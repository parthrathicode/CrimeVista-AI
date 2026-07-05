import os
import sys
import networkx as nx
import community as community_louvain # from python-louvain
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path so we can import backend.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import CaseMaster, Accused, Victim, Unit, CrimeSubHead, CrimeHead

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crime_vista.db"))
ENGINE_URL = f"sqlite:///{DB_PATH}"

def get_session():
    engine = create_engine(ENGINE_URL)
    Session = sessionmaker(bind=engine)
    return session()

def get_identity_key(name, age, gender):
    """
    Identity resolution proxy: group by clean name, age, and gender.
    In real production, this would use biometric matching or detailed demographics.
    """
    clean_name = " ".join(name.strip().lower().split())
    return (clean_name, age, gender)

def get_repeat_offenders(min_cases=2):
    session = get_session()
    
    # Query all accused and load their cases
    accused_list = session.query(Accused).all()
    
    # Group accused by identity proxy
    offender_groups = {}
    for acc in accused_list:
        key = get_identity_key(acc.AccusedName, acc.AgeYear, acc.GenderID)
        if key not in offender_groups:
            offender_groups[key] = []
        offender_groups[key].append(acc)
        
    repeat_offenders = []
    
    # Cache subhead names
    subheads = {sh.CrimeSubHeadID: sh.CrimeHeadName for sh in session.query(CrimeSubHead).all()}
    
    offender_id_counter = 1
    for key, instances in offender_groups.items():
        linked_cases_count = len(instances)
        if linked_cases_count < min_cases:
            continue
            
        name, age, gender = key
        gender_str = "M" if gender == 1 else "F"
        
        # Collect case details
        linked_case_ids = []
        cases_details = []
        cat_counts = {}
        hour_buckets = {"Morning": 0, "Afternoon": 0, "Evening": 0, "Night": 0}
        gravity_counts = {}
        district_ids = set()
        
        for inst in instances:
            case = inst.case
            if not case:
                continue
            linked_case_ids.append(case.CaseMasterID)
            district_ids.add(case.district_id)
            
            sub_name = subheads.get(case.CrimeMinorHeadID, "Unknown")
            cat_name = case.major_head.CrimeGroupName
            cat_counts[cat_name] = cat_counts.get(cat_name, 0) + 1
            
            h = case.IncidentFromDate.hour
            b = "Night" if h < 6 else "Morning" if h < 12 else "Afternoon" if h < 18 else "Evening"
            hour_buckets[b] += 1
            
            gravity_str = case.gravity_level.LookupValue
            gravity_counts[gravity_str] = gravity_counts.get(gravity_str, 0) + 1
            
            cases_details.append({
                "id": str(case.CaseMasterID),
                "crimeNo": case.CrimeNo,
                "category": cat_name,
                "subType": sub_name,
                "date": case.CrimeRegisteredDate.isoformat(),
                "hour": h,
                "gravity": gravity_str,
                "status": case.status.CaseStatusName,
                "stationId": str(case.PoliceStationID),
                "stationName": case.station.UnitName
            })
            
        # MO Signature elements
        top_cat = max(cat_counts, key=cat_counts.get) if cat_counts else "—"
        top_bucket = max(hour_buckets, key=hour_buckets.get) if hour_buckets else "—"
        top_gravity = max(gravity_counts, key=gravity_counts.get) if gravity_counts else "—"
        
        repeat_offenders.append({
            "id": f"ro_{offender_id_counter}",
            "name": instances[0].AccusedName, # Preserve casing
            "age": age,
            "gender": gender_str,
            "districtId": str(list(district_ids)[0]) if district_ids else "1",
            "linkedCaseIds": [str(cid) for cid in linked_case_ids],
            "linkedCases": cases_details,
            "moSignature": f"{top_cat} · {top_bucket} · {top_gravity}",
            "stationsInvolved": len(set(c["stationId"] for c in cases_details))
        })
        offender_id_counter += 1
        
    # Sort by case count descending
    repeat_offenders.sort(key=lambda x: len(x["linkedCaseIds"]), reverse=True)
    session.close()
    return repeat_offenders

def get_network_graph(filters=None):
    """
    Builds a NetworkX graph:
    Nodes: Accused (grouped), Victims, PoliceStations.
    Edges: Connect Accused to Victims and Accused to PoliceStations when sharing a case.
    Applies Louvain community detection and betweenness centrality.
    """
    session = get_session()
    
    # Query all case masters with relations
    query = session.query(CaseMaster)
    
    # Apply district filter
    if filters and filters.get("districtId"):
        query = query.filter(CaseMaster.district_id == filters["districtId"])
        
    cases = query.all()
    
    G = nx.Graph()
    
    # Identify unique repeat offenders
    accused_records = []
    for c in cases:
        accused_records.extend(c.accused_list)
        
    offender_groups = {}
    for acc in accused_records:
        key = get_identity_key(acc.AccusedName, acc.AgeYear, acc.GenderID)
        if key not in offender_groups:
            offender_groups[key] = []
        offender_groups[key].append(acc)
        
    # Filter groups by minLinks (default to 2 for repeat offenders)
    min_links = int(filters.get("minLinks", 2)) if filters else 2
    active_offenders = {}
    
    for key, instances in offender_groups.items():
        if len(instances) >= min_links:
            # Map instances to this offender key
            name = instances[0].AccusedName
            age = key[1]
            gender = "M" if key[2] == 1 else "F"
            active_offenders[key] = {
                "id": f"off_{name.lower().replace(' ', '_')}_{age}_{gender.lower()}",
                "label": name,
                "age": age,
                "gender": gender,
                "linkedCaseCount": len(instances),
                "districtId": str(instances[0].case.district_id) if instances[0].case else "1"
            }
            
    # Add nodes to graph
    for key, ro in active_offenders.items():
        G.add_node(
            ro["id"],
            label=ro["label"],
            type="accused",
            districtId=ro["districtId"],
            linkedCaseCount=ro["linkedCaseCount"],
            age=ro["age"],
            gender=ro["gender"]
        )
        
    # Cache to avoid duplicate node metadata writes
    victim_nodes_added = set()
    station_nodes_added = set()
    
    # Track cases containing active repeat offenders
    for c in cases:
        # Find if this case has any active repeat offender
        case_ro_ids = []
        for acc in c.accused_list:
            acc_key = get_identity_key(acc.AccusedName, acc.AgeYear, acc.GenderID)
            if acc_key in active_offenders:
                case_ro_ids.append(active_offenders[acc_key]["id"])
                
        if not case_ro_ids:
            continue # Skip cases with no repeat offenders
            
        # Add station node
        station_id = f"stn_{c.PoliceStationID}"
        if station_id not in station_nodes_added:
            G.add_node(
                station_id,
                label=c.station.UnitName,
                type="station",
                districtId=str(c.district_id),
                linkedCaseCount=0
            )
            station_nodes_added.add(station_id)
            
        # Add victim node
        victim_label = c.victims[0].VictimName if c.victims else f"Victim ({c.CaseNo})"
        victim_id = f"vic_{c.CaseMasterID}"
        if victim_id not in victim_nodes_added:
            G.add_node(
                victim_id,
                label=victim_label,
                type="victim",
                districtId=str(c.district_id),
                linkedCaseCount=1
            )
            victim_nodes_added.add(victim_id)
            
        # Add edges
        for ro_id in case_ro_ids:
            # Connect offender to victim
            G.add_edge(
                ro_id,
                victim_id,
                caseId=str(c.CaseMasterID),
                crimeCategory=c.major_head.CrimeGroupName
            )
            # Connect offender to station
            G.add_edge(
                ro_id,
                station_id,
                caseId=str(c.CaseMasterID),
                crimeCategory=c.major_head.CrimeGroupName
            )
            
    # Calculate station degree sizes
    for n in G.nodes():
        if G.nodes[n]["type"] == "station":
            G.nodes[n]["linkedCaseCount"] = G.degree(n)
            
    # Run centrality and community detection if graph is not empty
    communities = {}
    centralities = {}
    if len(G) > 0:
        try:
            communities = community_louvain.best_partition(G)
        except Exception as e:
            # Fallback if partition fails
            communities = {node: 1 for node in G.nodes()}
            
        try:
            centralities = nx.betweenness_centrality(G)
        except Exception as e:
            centralities = {node: 0.0 for node in G.nodes()}
            
    # Format for react-force-graph
    nodes_json = []
    for node, attrs in G.nodes(data=True):
        node_data = {
            "id": node,
            "label": attrs["label"],
            "type": attrs["type"],
            "districtId": attrs["districtId"],
            "linkedCaseCount": attrs["linkedCaseCount"],
            "community": communities.get(node, 0),
            "centrality": round(centralities.get(node, 0.0), 4)
        }
        if attrs["type"] == "accused":
            node_data["age"] = attrs["age"]
            node_data["gender"] = attrs["gender"]
        nodes_json.append(node_data)
        
    edges_json = []
    for u, v, attrs in G.edges(data=True):
        edges_json.append({
            "source": u,
            "target": v,
            "caseId": attrs["caseId"],
            "crimeCategory": attrs["crimeCategory"]
        })
        
    # Compile statistics
    offender_count = len([n for n in nodes_json if n["type"] == "accused"])
    linked_case_count = len(victim_nodes_added)
    
    session.close()
    return {
        "nodes": nodes_json,
        "edges": edges_json,
        "stats": {
            "offenderCount": offender_count,
            "linkedCaseCount": linked_case_count
        }
    }

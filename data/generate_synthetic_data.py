import os
import sys
import argparse
import random
from datetime import datetime, date, timedelta
import numpy as np
import pandas as pd
from faker import Faker

# Add parent directory to path so we can import backend.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models import (
    Base, State, District, UnitType, Unit, Rank, Designation, Employee,
    CaseCategory, GravityOffence, CaseStatusMaster, Court, CrimeHead, CrimeSubHead,
    CaseMaster, ComplainantDetails, Victim, Accused, Act, Section, ActSectionAssociation,
    CasteMaster, ReligionMaster, OccupationMaster
)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

fake = Faker('en_IN') # Using Indian locale for names/addresses

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "crime_vista.db"))
ENGINE_URL = f"sqlite:///{DB_PATH}"

# Master lists
DISTRICT_DATA = [
    {"id": 1, "name": "Bengaluru Urban", "lat": 12.9716, "lng": 77.5946, "pop": 9621551, "urb": 90.5},
    {"id": 2, "name": "Mysuru", "lat": 12.2958, "lng": 76.6394, "pop": 3001127, "urb": 41.5},
    {"id": 3, "name": "Dakshina Kannada", "lat": 12.9141, "lng": 74.8560, "pop": 2089649, "urb": 47.6},
    {"id": 4, "name": "Belagavi", "lat": 15.8497, "lng": 74.4977, "pop": 4779661, "urb": 25.3},
    {"id": 5, "name": "Kalaburagi", "lat": 17.3297, "lng": 76.8343, "pop": 2566326, "urb": 32.2},
    {"id": 6, "name": "Dharwad", "lat": 15.4589, "lng": 75.0078, "pop": 1847023, "urb": 56.8},
    {"id": 7, "name": "Tumakuru", "lat": 13.3379, "lng": 77.1022, "pop": 2678703, "urb": 22.4},
    {"id": 8, "name": "Shivamogga", "lat": 13.9299, "lng": 75.5681, "pop": 1752753, "urb": 35.6},
    {"id": 9, "name": "Ballari", "lat": 15.1394, "lng": 76.9214, "pop": 1400000, "urb": 37.5},
    {"id": 10, "name": "Vijayapura", "lat": 16.8302, "lng": 75.7100, "pop": 2177331, "urb": 23.0}
]

CRIME_CLASSIFICATION = {
    "Crimes Against Property": [
        {"name": "Chain Snatching", "act": "IPC", "section": "379"},
        {"name": "House Burglary", "act": "IPC", "section": "457"},
        {"name": "Vehicle Theft", "act": "IPC", "section": "379"},
        {"name": "Robbery", "act": "IPC", "section": "392"}
    ],
    "Crimes Against Body": [
        {"name": "Murder", "act": "IPC", "section": "302"},
        {"name": "Assault", "act": "IPC", "section": "352"},
        {"name": "Grievous Hurt", "act": "IPC", "section": "325"},
        {"name": "Kidnapping", "act": "IPC", "section": "363"}
    ],
    "Crimes Against Women": [
        {"name": "Molestation", "act": "IPC", "section": "354"},
        {"name": "Dowry Harassment", "act": "IPC", "section": "498A"},
        {"name": "Rape", "act": "IPC", "section": "376"},
        {"name": "Cruelty by Husband", "act": "IPC", "section": "498A"}
    ],
    "Cyber Crime": [
        {"name": "Cyber Fraud", "act": "IT Act", "section": "66D"},
        {"name": "Identity Theft", "act": "IT Act", "section": "66C"},
        {"name": "Hacking", "act": "IT Act", "section": "66"},
        {"name": "Phishing", "act": "IT Act", "section": "66D"}
    ],
    "Crimes Against Public Order": [
        {"name": "Riot", "act": "IPC", "section": "147"},
        {"name": "Unlawful Assembly", "act": "IPC", "section": "143"},
        {"name": "Affray", "act": "IPC", "section": "160"},
        {"name": "Public Nuisance", "act": "IPC", "section": "290"}
    ]
}

def generate_data(reset=False):
    if reset and os.path.exists(DB_PATH):
        print(f"Removing existing database at {DB_PATH}")
        os.remove(DB_PATH)

    engine = create_engine(ENGINE_URL)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    print("Seeding Master Data...")
    
    # 1. State
    state_karnataka = State(StateID=29, StateName="Karnataka", NationalityID=1, Active=True)
    session.add(state_karnataka)
    session.commit()

    # 2. Districts
    districts = []
    for d in DISTRICT_DATA:
        dist = District(
            DistrictID=d["id"],
            DistrictName=d["name"],
            StateID=state_karnataka.StateID,
            Active=True,
            centroid_lat=d["lat"],
            centroid_lng=d["lng"],
            population=d["pop"],
            urbanization_pct=d["urb"]
        )
        session.add(dist)
        districts.append(dist)
    session.commit()

    # 3. Unit Types
    ps_type = UnitType(UnitTypeID=1, UnitTypeName="Police Station", CityDistState="District")
    session.add(ps_type)
    session.commit()

    # 4. Units (Police Stations) - 3-5 per district
    stations = []
    station_counter = 1
    for dist in districts:
        num_stations = random.randint(3, 5)
        for i in range(num_stations):
            # 5-10km offset (approx 0.045 to 0.09 lat/lng degrees)
            lat_offset = random.uniform(-0.08, 0.08)
            lng_offset = random.uniform(-0.08, 0.08)
            stn = Unit(
                UnitID=station_counter,
                UnitName=f"{dist.DistrictName} Police Station {i+1}",
                TypeID=ps_type.UnitTypeID,
                ParentUnit=None,
                StateID=state_karnataka.StateID,
                DistrictID=dist.DistrictID,
                Active=True,
                latitude=dist.centroid_lat + lat_offset,
                longitude=dist.centroid_lng + lng_offset
            )
            session.add(stn)
            stations.append(stn)
            station_counter += 1
    session.commit()

    # 5. Ranks
    ranks = [
        Rank(RankID=1, RankName="Police Constable", Hierarchy=10),
        Rank(RankID=2, RankName="Head Constable", Hierarchy=9),
        Rank(RankID=3, RankName="Assistant Sub-Inspector", Hierarchy=8),
        Rank(RankID=4, RankName="Sub-Inspector", Hierarchy=7),
        Rank(RankID=5, RankName="Inspector", Hierarchy=6)
    ]
    session.add_all(ranks)
    session.commit()

    # 6. Designations
    designations = [
        Designation(DesignationID=1, DesignationName="Investigating Officer", Active=True, SortOrder=1),
        Designation(DesignationID=2, DesignationName="Station House Officer (SHO)", Active=True, SortOrder=2),
        Designation(DesignationID=3, DesignationName="Patrol Officer", Active=True, SortOrder=3)
    ]
    session.add_all(designations)
    session.commit()

    # 7. Employees (Officers)
    employees = []
    emp_counter = 1
    for stn in stations:
        # 3 officers per station
        for j in range(3):
            emp = Employee(
                EmployeeID=emp_counter,
                DistrictID=stn.DistrictID,
                UnitID=stn.UnitID,
                RankID=random.choice(ranks).RankID,
                DesignationID=random.choice(designations).DesignationID,
                KGID=f"KSP{emp_counter:05d}",
                FirstName=fake.first_name_male() if random.random() > 0.3 else fake.first_name_female(),
                EmployeeDOB=date(1980, 1, 1) + timedelta(days=random.randint(0, 7000)),
                GenderID=1 if random.random() > 0.2 else 2,
                BloodGroupID=random.randint(1, 8),
                PhysicallyChallenged=False,
                AppointmentDate=date(2005, 1, 1) + timedelta(days=random.randint(0, 5000))
            )
            session.add(emp)
            employees.append(emp)
            emp_counter += 1
    session.commit()

    # 8. Lookups & Masters
    categories = [
        CaseCategory(CaseCategoryID=1, LookupValue="FIR"),
        CaseCategory(CaseCategoryID=2, LookupValue="UDR"),
        CaseCategory(CaseCategoryID=3, LookupValue="PAR"),
        CaseCategory(CaseCategoryID=4, LookupValue="Zero FIR")
    ]
    session.add_all(categories)

    gravities = [
        GravityOffence(GravityOffenceID=1, LookupValue="Heinous"),
        GravityOffence(GravityOffenceID=2, LookupValue="Non-Heinous")
    ]
    session.add_all(gravities)

    statuses = [
        CaseStatusMaster(CaseStatusID=1, CaseStatusName="Under Investigation"),
        CaseStatusMaster(CaseStatusID=2, CaseStatusName="Charge Sheeted"),
        CaseStatusMaster(CaseStatusID=3, CaseStatusName="Closed"),
        CaseStatusMaster(CaseStatusID=4, CaseStatusName="Undetected")
    ]
    session.add_all(statuses)

    castes = [CasteMaster(caste_master_id=i, caste_master_name=name) for i, name in enumerate(["General", "OBC", "SC", "ST", "Other"], 1)]
    session.add_all(castes)

    religions = [ReligionMaster(ReligionID=i, ReligionName=name) for i, name in enumerate(["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Other"], 1)]
    session.add_all(religions)

    occupations = [OccupationMaster(OccupationID=i, OccupationName=name) for i, name in enumerate(["Farmer", "Business", "Government Employee", "Private Employee", "Student", "Unemployed", "Homemaker"], 1)]
    session.add_all(occupations)

    courts = []
    for dist in districts:
        crt = Court(
            CourtID=dist.DistrictID,
            CourtName=f"District & Sessions Court, {dist.DistrictName}",
            DistrictID=dist.DistrictID,
            StateID=state_karnataka.StateID,
            Active=True
        )
        session.add(crt)
        courts.append(crt)
    session.commit()

    # 9. Acts & Sections
    acts = [
        Act(ActCode="IPC", ActDescription="Indian Penal Code", ShortName="IPC", Active=True),
        Act(ActCode="IT Act", ActDescription="Information Technology Act, 2000", ShortName="IT Act", Active=True)
    ]
    session.add_all(acts)
    session.commit()

    sections = [
        # Property
        Section(ActCode="IPC", SectionCode="379", SectionDescription="Punishment for theft", Active=True),
        Section(ActCode="IPC", SectionCode="457", SectionDescription="Lurking house-trespass or house-breaking by night", Active=True),
        Section(ActCode="IPC", SectionCode="392", SectionDescription="Punishment for robbery", Active=True),
        # Body
        Section(ActCode="IPC", SectionCode="302", SectionDescription="Punishment for murder", Active=True),
        Section(ActCode="IPC", SectionCode="352", SectionDescription="Punishment for assault", Active=True),
        Section(ActCode="IPC", SectionCode="325", SectionDescription="Punishment for voluntarily causing grievous hurt", Active=True),
        Section(ActCode="IPC", SectionCode="363", SectionDescription="Punishment for kidnapping", Active=True),
        # Women
        Section(ActCode="IPC", SectionCode="354", SectionDescription="Assault or criminal force to woman with intent to outrage her modesty", Active=True),
        Section(ActCode="IPC", SectionCode="498A", SectionDescription="Husband or relative of husband of a woman subjecting her to cruelty", Active=True),
        Section(ActCode="IPC", SectionCode="376", SectionDescription="Punishment for rape", Active=True),
        # Cyber
        Section(ActCode="IT Act", SectionCode="66D", SectionDescription="Punishment for cheating by personation by using computer resource", Active=True),
        Section(ActCode="IT Act", SectionCode="66C", SectionDescription="Punishment for identity theft", Active=True),
        Section(ActCode="IT Act", SectionCode="66", SectionDescription="Computer related offences", Active=True),
        # Public Order
        Section(ActCode="IPC", SectionCode="147", SectionDescription="Punishment for rioting", Active=True),
        Section(ActCode="IPC", SectionCode="143", SectionDescription="Punishment for being member of unlawful assembly", Active=True),
        Section(ActCode="IPC", SectionCode="160", SectionDescription="Punishment for committing affray", Active=True),
        Section(ActCode="IPC", SectionCode="290", SectionDescription="Punishment for public nuisance", Active=True)
    ]
    session.add_all(sections)
    session.commit()

    # 10. Crime Heads & Sub-Heads
    heads = []
    sub_heads = []
    h_idx = 1
    sh_idx = 1
    for h_name, subs in CRIME_CLASSIFICATION.items():
        ch = CrimeHead(CrimeHeadID=h_idx, CrimeGroupName=h_name, Active=True)
        session.add(ch)
        heads.append(ch)
        for s in subs:
            csh = CrimeSubHead(
                CrimeSubHeadID=sh_idx,
                CrimeHeadID=h_idx,
                CrimeHeadName=s["name"],
                SeqID=sh_idx
            )
            session.add(csh)
            sub_heads.append((csh, s["act"], s["section"]))
            sh_idx += 1
        h_idx += 1
    session.commit()

    print("Generating engineered patterns...")

    # Pattern 1: Repeat Offenders Identities (40-50 offenders)
    # We will reuse these across cases later
    repeat_offenders_mo = []
    num_repeat_offenders = random.randint(40, 50)
    for ro_id in range(1, num_repeat_offenders + 1):
        gender = random.choice([1, 2])
        name = fake.name_male() if gender == 1 else fake.name_female()
        age = random.randint(19, 45)
        # Choose a dominant subhead index for their MO bias
        dominant_sub = random.choice(sub_heads) # (csh, act, sec)
        repeat_offenders_mo.append({
            "name": name,
            "age": age,
            "gender": gender,
            "dominant_sub": dominant_sub,
            "cases_to_create": random.randint(2, 6)
        })

    # Pattern 3: Spatial Hotspots designations per district (1-2 hotspots per district)
    # Within 2km (0.018 lat/lng offset)
    district_hotspots = {}
    for dist in districts:
        district_hotspots[dist.DistrictID] = [
            (dist.centroid_lat + random.uniform(-0.02, 0.02), dist.centroid_lng + random.uniform(-0.02, 0.02))
            for _ in range(random.randint(1, 2))
        ]

    # Pattern 5: Recent Trend Spike
    # Let's select 2-3 specific districts and a subhead to spike in the last 3 months
    # We spike:
    # - Bengaluru Urban (District 1) -> Cyber Fraud (SubHead 13)
    # - Mysuru (District 2) -> Chain Snatching (SubHead 1)
    spiked_combos = [
        {"district_id": 1, "sub_head_id": 13},  # Cyber Fraud
        {"district_id": 2, "sub_head_id": 1}    # Chain Snatching
    ]

    # Chronology setup: 24 months
    today_dt = datetime.now()
    start_dt = today_dt - timedelta(days=24*30)

    # Let's count cases
    cases_count = random.randint(1800, 2200)
    print(f"Creating {cases_count} CaseMaster records...")

    # We will build list of date weights or loop month by month
    # To build seasonality (October-November Property +25-30%)
    # Let's assign cases to dates
    case_dates = []
    delta_days = (today_dt - start_dt).days
    
    # We can assign weights to days
    day_weights = []
    for day_offset in range(delta_days):
        curr_date = start_dt + timedelta(days=day_offset)
        weight = 1.0
        
        # Pattern 4: Seasonality in Oct-Nov (+25-30%)
        if curr_date.month in [10, 11]:
            weight *= 1.28
            
        day_weights.append((curr_date, weight))
        
    dates_pool = [d[0] for d in day_weights]
    weights_pool = [d[1] for d in day_weights]
    weights_pool = np.array(weights_pool) / sum(weights_pool)
    
    selected_dates = np.random.choice(dates_pool, size=cases_count, p=weights_pool)

    # Serial number counters per (station_id, category_id, year)
    serial_counters = {}

    cases_inserted = 0

    # Separate container for accused/victims to insert
    all_cases_data = []

    # Map sub-head name to realistic briefs
    brief_templates = {
        "Chain Snatching": [
            "Complainant stated that while walking back home, two unidentified motorbikers snatched their gold chain.",
            "Accused rode past the victim on a bike without a registration plate and snatched a gold neck chain.",
            "Incident occurred near the main road where a lone walker was targeted by chain snatchers."
        ],
        "House Burglary": [
            "Burglary occurred in the early hours of the morning. Lock of the front door was broken, gold ornaments stolen.",
            "Complainant reported that their house was broken into while they were away for the weekend.",
            "Unidentified thieves entered the residence through a window and stole cash and electronics."
        ],
        "Vehicle Theft": [
            "Two-wheeler parked in front of the house was found missing in the morning.",
            "Car parked in public parking space was stolen. Alarm system was bypassed.",
            "Complainant stated they parked their motorcycle near the market, and it was missing when they returned."
        ],
        "Robbery": [
            "Victim was threatened with a knife near the bus stand and forced to hand over their mobile phone and wallet.",
            "A group of three cornered the victim in an alleyway and robbed them of jewelry at knifepoint.",
            "Cash bag was snatched from the complainant at a secluded intersection."
        ],
        "Murder": [
            "Victim's body was discovered with multiple stab wounds. Investigation points to personal enmity.",
            "A verbal dispute escalated into physical violence, resulting in fatal head injuries to the victim.",
            "Police received a report of a homicide at a residential building. Suspect fled the scene."
        ],
        "Assault": [
            "Accused assaulted the complainant following an argument over parking space.",
            "A group clash resulted in minor injuries to several individuals, case registered under assault.",
            "Complainant was physically assaulted in a neighborhood brawl."
        ],
        "Cyber Fraud": [
            "Complainant was defrauded of money through a fake KYC update link sent via SMS.",
            "Accused impersonated a bank official over the phone and transferred funds illegally.",
            "Victim fell prey to an online investment scam promising high returns."
        ],
        "Molestation": [
            "Accused harassed and molested the victim in a public bus.",
            "Complainant reported being stalked and harassed on her way to work.",
            "Incident of outraging modesty reported at a local park."
        ]
    }

    def get_brief(sub_head_name):
        lst = brief_templates.get(sub_head_name, [
            "Case registered regarding an incident. Detailed statements have been recorded.",
            "Investigation underway. Crime scene examined, and evidence collected.",
            "F.I.R registered based on complainant's statement. Witness accounts are being compiled."
        ])
        return random.choice(lst)

    # Let's generate cases
    # To allocate repeat offenders, we will pre-allocate some dates and stations
    ro_allocated_count = 0
    ro_cases = []
    
    # We will build cases where the accused is a repeat offender
    for ro in repeat_offenders_mo:
        for c_idx in range(ro["cases_to_create"]):
            ro_cases.append(ro)

    # Shuffle the repeat offender slots
    random.shuffle(ro_cases)

    for i in range(cases_count):
        reg_datetime = selected_dates[i]
        reg_date = reg_datetime.date()
        
        # Decide district and police station
        # We can bias the choice based on population
        dist_weights = [d["pop"] for d in DISTRICT_DATA]
        dist_weights = np.array(dist_weights) / sum(dist_weights)
        selected_dist = np.random.choice(districts, p=dist_weights)
        
        dist_stns = [s for s in stations if s.DistrictID == selected_dist.DistrictID]
        selected_stn = random.choice(dist_stns)
        
        # Select category, gravity, status, crime head and sub head
        category = random.choice(categories)
        gravity = random.choice(gravities)
        
        # Pattern 6: Status Distribution
        # 55% Charge Sheeted, 15% Closed, 20% Under Investigation, 10% Undetected overall
        # Heinous crimes skewed toward lower charge-sheet rates and higher undetected rates
        status_weights = [0.20, 0.55, 0.15, 0.10] # Under Inv, Charge Sheeted, Closed, Undetected
        if gravity.LookupValue == "Heinous":
            status_weights = [0.35, 0.35, 0.10, 0.20] # More under investigation and undetected
            
        status = np.random.choice(statuses, p=np.array(status_weights)/sum(status_weights))

        # Check if we should use a repeat offender for this case
        accused_is_ro = False
        ro_data = None
        if ro_cases and random.random() < 0.15: # 15% chance to assign a repeat offender case
            ro_data = ro_cases.pop()
            accused_is_ro = True

        # Determine subhead
        if accused_is_ro:
            # Repeat offender biased to their dominant subhead
            subhead_tuple = ro_data["dominant_sub"]
        else:
            # Otherwise random subhead, but check for Recent Trend Spike (Pattern 5)
            # Recent trend spike: Last 3 months in specific districts
            is_recent_3mo = (today_dt - reg_datetime).days <= 90
            
            # Check if this district has a spike configured
            spike_configured = False
            spiked_sub_id = None
            for spike in spiked_combos:
                if spike["district_id"] == selected_dist.DistrictID:
                    spike_configured = True
                    spiked_sub_id = spike["sub_head_id"]
                    break
            
            if is_recent_3mo and spike_configured and random.random() < 0.50:
                # 50% chance to force the spiked subhead
                subhead_tuple = [sh for sh in sub_heads if sh[0].CrimeSubHeadID == spiked_sub_id][0]
            else:
                # Standard random selection
                subhead_tuple = random.choice(sub_heads)

        csh, act_code, section_code = subhead_tuple
        major_head_id = csh.CrimeHeadID

        # Pattern 2: Time of Day clustering
        # Chain snatching / theft (subhead 1, 3): 18:00 - 22:00
        # Burglary (subhead 2): 01:00 - 05:00
        # Cyber Crime (head 4): uniform
        hour = random.randint(0, 23)
        if csh.CrimeHeadName in ["Chain Snatching", "Vehicle Theft"] or csh.CrimeSubHeadID in [1, 3]:
            if random.random() < 0.70: # 70% cluster
                hour = random.choice([18, 19, 20, 21, 22])
        elif csh.CrimeHeadName == "House Burglary" or csh.CrimeSubHeadID == 2:
            if random.random() < 0.70:
                hour = random.choice([1, 2, 3, 4, 5])
        
        inc_from = datetime(reg_date.year, reg_date.month, reg_date.day, hour, random.randint(0, 59))
        # Ensure incident datetime is not in the future relative to registered datetime
        if inc_from > reg_datetime:
            inc_from = reg_datetime - timedelta(hours=random.randint(1, 12))
        
        inc_to = inc_from + timedelta(hours=random.randint(1, 4))
        if inc_to > reg_datetime:
            inc_to = reg_datetime

        # Pattern 3: Spatial Hotspots vs Uniform
        # Concentrates 30-40% of cases near district hotspots (2km ≈ 0.018 lat/lng degrees)
        if random.random() < 0.35: # 35% hotspot concentration
            hotspots_coords = district_hotspots[selected_dist.DistrictID]
            center_lat, center_lng = random.choice(hotspots_coords)
            lat = center_lat + random.uniform(-0.015, 0.015)
            lng = center_lng + random.uniform(-0.015, 0.015)
        else:
            # Standard uniform offset from police station
            lat = selected_stn.latitude + random.uniform(-0.03, 0.03)
            lng = selected_stn.longitude + random.uniform(-0.03, 0.03)

        # Serial number computation
        year = reg_date.year
        s_key = (selected_stn.UnitID, category.CaseCategoryID, year)
        serial_counters[s_key] = serial_counters.get(s_key, 0) + 1
        serial = serial_counters[s_key]

        # CrimeNo: 1-digit category code + 4-digit district ID + 4-digit unit ID + 4-digit year + 5-digit running serial
        crime_no = f"{category.CaseCategoryID}{selected_dist.DistrictID:04d}{selected_stn.UnitID:04d}{year:04d}{serial:05d}"
        case_no = f"{year}{serial:05d}"

        # Assign registering officer
        stn_officers = [e for e in employees if e.UnitID == selected_stn.UnitID]
        officer = random.choice(stn_officers) if stn_officers else random.choice(employees)

        court = [c for c in courts if c.DistrictID == selected_dist.DistrictID][0]

        # Brief Facts
        brief = get_brief(csh.CrimeHeadName)

        case = CaseMaster(
            CaseMasterID=i+1,
            CrimeNo=crime_no,
            CaseNo=case_no,
            CrimeRegisteredDate=reg_date,
            PolicePersonID=officer.EmployeeID,
            PoliceStationID=selected_stn.UnitID,
            CaseCategoryID=category.CaseCategoryID,
            GravityOffenceID=gravity.GravityOffenceID,
            CrimeMajorHeadID=major_head_id,
            CrimeMinorHeadID=csh.CrimeSubHeadID,
            CaseStatusID=status.CaseStatusID,
            CourtID=court.CourtID,
            IncidentFromDate=inc_from,
            IncidentToDate=inc_to,
            InfoReceivedPSDate=reg_datetime - timedelta(hours=random.randint(1, 3)),
            latitude=lat,
            longitude=lng,
            BriefFacts=brief,
            district_id=selected_dist.DistrictID
        )
        session.add(case)

        # Act Section Association
        assoc = ActSectionAssociation(
            CaseMasterID=case.CaseMasterID,
            ActCode=act_code,
            SectionCode=section_code,
            ActOrderID=1,
            SectionOrderID=1
        )
        session.add(assoc)

        # Complainant
        comp = ComplainantDetails(
            ComplainantID=i+1,
            CaseMasterID=case.CaseMasterID,
            ComplainantName=fake.name(),
            AgeYear=random.randint(22, 65),
            OccupationID=random.choice(occupations).OccupationID,
            ReligionID=random.choice(religions).ReligionID,
            CasteID=random.choice(castes).caste_master_id,
            GenderID=random.choice([1, 2])
        )
        session.add(comp)

        # Victim
        vic = Victim(
            VictimMasterID=i+1,
            CaseMasterID=case.CaseMasterID,
            VictimName=fake.name(),
            AgeYear=random.randint(10, 75),
            GenderID=random.choice([1, 2]),
            VictimPolice="1" if random.random() < 0.05 else "0"
        )
        session.add(vic)

        # Accused - Inject repeat offender if flagged
        if accused_is_ro:
            acc = Accused(
                AccusedMasterID=i+1,
                CaseMasterID=case.CaseMasterID,
                AccusedName=ro_data["name"],
                AgeYear=ro_data["age"],
                GenderID=ro_data["gender"],
                PersonID="A1"
            )
        else:
            acc = Accused(
                AccusedMasterID=i+1,
                CaseMasterID=case.CaseMasterID,
                AccusedName=fake.name_male() if random.random() > 0.15 else fake.name_female(),
                AgeYear=random.randint(18, 60),
                GenderID=random.choice([1, 2]),
                PersonID="A1"
            )
        session.add(acc)
        cases_inserted += 1

    session.commit()
    print(f"Successfully generated database at {DB_PATH}")
    print(f"Total CaseMaster Records: {cases_inserted}")
    
    # Quick queries to confirm
    print(f"Districts in DB: {session.query(District).count()}")
    print(f"Police Stations in DB: {session.query(Unit).count()}")
    print(f"Repeat offender cases created: {num_repeat_offenders}")
    session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Karnataka Police FIR Synthetic Data Generator")
    parser.add_argument("--reset", action="store_true", help="Wipe and recreate database")
    args = parser.parse_args()
    
    # Defaulting to reset to make sure everything works
    generate_data(reset=args.reset or True)

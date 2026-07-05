import os
import sys
import numpy as np
from sklearn.cluster import DBSCAN
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

# Add parent directory to path so we can import backend.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import CaseMaster, CrimeSubHead, District, Unit

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crime_vista.db"))
ENGINE_URL = f"sqlite:///{DB_PATH}"

def get_session():
    engine = create_engine(ENGINE_URL)
    Session = sessionmaker(bind=engine)
    return Session()

def detect_hotspots(district_id, date_days=None, hour_range=None):
    session = get_session()
    
    # Query cases for the district
    query = session.query(CaseMaster).filter(CaseMaster.district_id == district_id)
    
    # Apply date filters
    if date_days is not None:
        cutoff_date = datetime.now() - timedelta(days=date_days)
        query = query.filter(CaseMaster.CrimeRegisteredDate >= cutoff_date.date())
        
    cases = query.all()
    
    # Apply hour filters in Python for simpler datetime logic
    if hour_range is not None:
        h_min, h_max = hour_range
        # Extract cases within the hour range
        filtered_cases = []
        for c in cases:
            h = c.IncidentFromDate.hour
            if h_min <= h <= h_max:
                filtered_cases.append(c)
        cases = filtered_cases
        
    if not cases or len(cases) < 3:
        session.close()
        return []
        
    # Prepare coordinates for DBSCAN
    coords = np.array([[c.latitude, c.longitude] for c in cases])
    
    # eps=0.015 degrees is roughly 1.5km. min_samples=3 to find clusters
    db = DBSCAN(eps=0.015, min_samples=3).fit(coords)
    labels = db.labels_
    
    clusters = []
    unique_labels = set(labels)
    
    # Cache crime subheads
    subheads = {sh.CrimeSubHeadID: sh.CrimeHeadName for sh in session.query(CrimeSubHead).all()}
    
    for label in unique_labels:
        if label == -1:
            continue # Noise points
            
        cluster_indices = np.where(labels == label)[0]
        cluster_cases = [cases[idx] for idx in cluster_indices]
        cluster_coords = coords[cluster_indices]
        
        centroid = cluster_coords.mean(axis=0)
        case_count = len(cluster_cases)
        
        # Determine dominant crime subtype
        sub_counts = {}
        for c in cluster_cases:
            sub_counts[c.CrimeMinorHeadID] = sub_counts.get(c.CrimeMinorHeadID, 0) + 1
            
        dominant_sub_id = max(sub_counts, key=sub_counts.get)
        dominant_crime = subheads.get(dominant_sub_id, "Unknown")
        
        # Calculate radius in meters (approximate)
        # 1 degree lat ≈ 111,000 meters. Let's find max distance from centroid
        max_dist_deg = np.max(np.sqrt(np.sum((cluster_coords - centroid) ** 2, axis=1)))
        radius_meters = max(max_dist_deg * 111000, 100.0) # minimum 100 meters
        
        # Density score: case count per 100m radius
        density_score = round(case_count / (radius_meters / 100.0), 3)
        
        clusters.append({
            "id": f"cluster_{district_id}_{label}",
            "districtId": str(district_id),
            "lat": float(centroid[0]),
            "lng": float(centroid[1]),
            "caseCount": case_count,
            "dominantCrime": dominant_crime,
            "radiusMeters": float(radius_meters),
            "densityScore": density_score
        })
        
    # Sort clusters by case count descending
    clusters.sort(key=lambda x: x["caseCount"], reverse=True)
    session.close()
    return clusters

def calculate_alerts():
    """
    Rolling baseline comparison:
    Compute last-30-day count vs prior-90-day monthly average per (district, crime_sub_head).
    If it exceeds a 25% threshold and last-30-day count is substantial (>= 5 cases), flag as alert.
    """
    session = get_session()
    
    now = datetime.now()
    t30 = now - timedelta(days=30)
    t120 = now - timedelta(days=120)
    
    # Query cases in the last 120 days
    cases_120 = session.query(CaseMaster).filter(CaseMaster.CrimeRegisteredDate >= t120.date()).all()
    
    # Organize counts by (district_id, sub_head_id)
    recent_counts = {} # last 30 days
    prior_counts = {}  # days 31 to 120
    
    for c in cases_120:
        key = (c.district_id, c.CrimeMinorHeadID)
        dt = datetime.combine(c.CrimeRegisteredDate, datetime.min.time())
        if dt >= t30:
            recent_counts[key] = recent_counts.get(key, 0) + 1
        else:
            prior_counts[key] = prior_counts.get(key, 0) + 1
            
    districts = {d.DistrictID: d.DistrictName for d in session.query(District).all()}
    subheads = {sh.CrimeSubHeadID: (sh.CrimeHeadName, sh.crime_head.CrimeGroupName) for sh in session.query(CrimeSubHead).all()}
    
    alerts = []
    alert_counter = 1
    
    # Check for spikes
    for key, count_30 in recent_counts.items():
        if count_30 < 5: 
            continue # ignore very small numbers
            
        dist_id, sub_id = key
        count_prior = prior_counts.get(key, 0)
        
        # prior 90-day monthly average
        monthly_avg = count_prior / 3.0
        
        if monthly_avg == 0:
            pct_change = 100.0 # Spiked from 0
            is_spike = True
        else:
            pct_change = ((count_30 - monthly_avg) / monthly_avg) * 100.0
            is_spike = pct_change >= 25.0
            
        if is_spike:
            sub_name, group_name = subheads.get(sub_id, ("Unknown", "Unknown"))
            dist_name = districts.get(dist_id, "Unknown")
            
            alerts.append({
                "id": f"alert_{alert_counter}",
                "severity": "warning" if pct_change > 50 else "info",
                "title": f"Spike Alert: {sub_name} in {dist_name} has increased by {pct_change:.1f}% (+{count_30} cases in last 30 days)",
                "districtId": str(dist_id),
                "category": group_name
            })
            alert_counter += 1
            
    session.close()
    return alerts

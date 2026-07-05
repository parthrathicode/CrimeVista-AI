import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path so we can import backend.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import CaseMaster, CrimeSubHead

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crime_vista.db"))
ENGINE_URL = f"sqlite:///{DB_PATH}"

def get_session():
    engine = create_engine(ENGINE_URL)
    Session = sessionmaker(bind=engine)
    return session()

def detect_anomalies(limit=15):
    """
    Runs IsolationForest to find statistically unusual cases based on features:
    [DistrictID, CrimeMinorHeadID, HourOfDay, GravityID, StatusID]
    """
    session = get_session()
    
    # Query all cases
    cases = session.query(CaseMaster).all()
    if not cases or len(cases) < 50:
        session.close()
        return []
        
    # Build feature matrix
    data = []
    for c in cases:
        data.append({
            "case_id": c.CaseMasterID,
            "district_id": c.district_id,
            "sub_head_id": c.CrimeMinorHeadID,
            "hour": c.IncidentFromDate.hour,
            "gravity_id": c.GravityOffenceID,
            "status_id": c.CaseStatusID
        })
        
    df = pd.DataFrame(data)
    X = df[["district_id", "sub_head_id", "hour", "gravity_id", "status_id"]]
    
    # Train IsolationForest
    # contamination=0.03 means about 3% of cases will be classified as anomalous (-1)
    clf = IsolationForest(n_estimators=100, contamination=0.03, random_state=42)
    preds = clf.fit_predict(X)
    scores = clf.decision_function(X) # lower score = more anomalous
    
    df["anomaly"] = preds
    df["score"] = scores
    
    # Filter anomalies (-1) and sort by score ascending (most anomalous first)
    anomalies_df = df[df["anomaly"] == -1].sort_values(by="score")
    
    anomalous_ids = anomalies_df["case_id"].tolist()[:limit]
    anomalous_scores = {row["case_id"]: float(row["score"]) for _, row in anomalies_df.iterrows()}
    
    # Fetch details for the selected anomalous cases
    anomalous_cases = session.query(CaseMaster).filter(CaseMaster.CaseMasterID.in_(anomalous_ids)).all()
    
    # Cache subheads
    subheads = {sh.CrimeSubHeadID: sh.CrimeHeadName for sh in session.query(CrimeSubHead).all()}
    
    results = []
    for c in anomalous_cases:
        score_val = anomalous_scores.get(c.CaseMasterID, 0.0)
        # Scale score for readability in UI: lower decision score -> higher anomaly confidence (0 to 100)
        confidence = round((0.5 - score_val) * 100.0, 1) # decision scores typically range from -0.5 to 0.5
        confidence = min(max(confidence, 50.0), 99.9) # bound between 50% and 99.9%
        
        results.append({
            "id": str(c.CaseMasterID),
            "crimeNo": c.CrimeNo,
            "caseNo": c.CaseNo,
            "districtName": c.district.DistrictName,
            "stationName": c.station.UnitName,
            "category": c.major_head.CrimeGroupName,
            "subType": subheads.get(c.CrimeMinorHeadID, "Unknown"),
            "date": c.CrimeRegisteredDate.isoformat(),
            "hour": c.IncidentFromDate.hour,
            "gravity": c.gravity_level.LookupValue,
            "status": c.status.CaseStatusName,
            "briefFacts": c.BriefFacts,
            "anomalyScore": confidence,
            "reason": determine_anomaly_reason(c, confidence)
        })
        
    # Sort results by anomaly score descending
    results.sort(key=lambda x: x["anomalyScore"], reverse=True)
    session.close()
    return results

def determine_anomaly_reason(case, confidence):
    """
    Generates a human-readable explanation of why a case was flagged as anomalous.
    """
    hour = case.IncidentFromDate.hour
    gravity = case.gravity_level.LookupValue
    status = case.status.CaseStatusName
    subhead = case.minor_head.CrimeHeadName
    
    reasons = []
    
    # Heuristics based on our engineered patterns
    if hour >= 1 and hour <= 5 and subhead == "Cyber Fraud":
        reasons.append("Irregular timestamp: Cyber Fraud occurred during deep night hours (01:00-05:00)")
    if gravity == "Heinous" and status == "Closed":
        reasons.append("Atypical legal progression: Heinous offence marked as 'Closed' without chargesheet")
    if hour >= 18 and hour <= 22 and subhead == "House Burglary":
        reasons.append("Atypical temporal pattern: House Burglary occurred during active evening hours (18:00-22:00)")
    if gravity == "Non-Heinous" and status == "Undetected" and subhead in ["Murder", "Rape"]:
        # Mismatched metadata
        reasons.append("Data conflict: Major offence classified as Non-Heinous severity")
        
    if not reasons:
        reasons.append(f"Outlier combination: Statistical variance in crime type, location, and registry time (Score: {confidence}%)")
        
    return " & ".join(reasons)

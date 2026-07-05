import os
import sys
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from typing import Optional, List

# Add parent directory to path so we can import backend
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from models import (
    Base, District, Unit, CaseMaster, CrimeSubHead, CrimeHead, Accused, Victim
)
from ml.hotspot_detection import detect_hotspots, calculate_alerts
from ml.network_analysis import get_repeat_offenders, get_network_graph
from ml.risk_prediction import predict_risk, get_monthly_trend
from ml.anomaly_detection import detect_anomalies

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "crime_vista.db"))
ENGINE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(ENGINE_URL)
Session = sessionmaker(bind=engine)

app = FastAPI(title="CrimeVista AI API", description="Crime Intelligence Analytics Platform Backend")

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/districts")
def list_districts():
    db = Session()
    districts = db.query(District).all()
    results = []
    for d in districts:
        case_count = db.query(CaseMaster).filter(CaseMaster.district_id == d.DistrictID).count()
        results.append({
            "id": str(d.DistrictID),
            "name": d.DistrictName,
            "lat": d.centroid_lat,
            "lng": d.centroid_lng,
            "totalCases": case_count
        })
    db.close()
    return results

@app.get("/api/districts/{id}/cases")
def get_cases_for_district(
    id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    hour_from: Optional[int] = Query(None, ge=0, le=23),
    hour_to: Optional[int] = Query(None, ge=0, le=23),
    dateWindowDays: Optional[int] = None
):
    db = Session()
    query = db.query(CaseMaster)
    
    if id != "all" and id.isdigit():
        query = query.filter(CaseMaster.district_id == int(id))
        
    # Apply date filters
    if dateWindowDays is not None:
        cutoff = datetime.now() - timedelta(days=dateWindowDays)
        query = query.filter(CaseMaster.CrimeRegisteredDate >= cutoff.date())
    else:
        if date_from:
            try:
                df = datetime.fromisoformat(date_from).date()
                query = query.filter(CaseMaster.CrimeRegisteredDate >= df)
            except ValueError:
                pass
        if date_to:
            try:
                dt = datetime.fromisoformat(date_to).date()
                query = query.filter(CaseMaster.CrimeRegisteredDate <= dt)
            except ValueError:
                pass
                
    cases = query.all()
    
    # Filter hours in Python
    h_min = hour_from if hour_from is not None else 0
    h_max = hour_to if hour_to is not None else 23
    
    results = []
    for c in cases:
        h = c.IncidentFromDate.hour
        if h_min <= h <= h_max:
            results.append({
                "id": str(c.CaseMasterID),
                "districtId": str(c.district_id),
                "stationId": str(c.PoliceStationID),
                "category": c.major_head.CrimeGroupName,
                "subType": c.minor_head.CrimeHeadName,
                "lat": c.latitude,
                "lng": c.longitude,
                "date": c.CrimeRegisteredDate.isoformat(),
                "hour": h,
                "gravity": c.gravity_level.LookupValue,
                "status": c.status.CaseStatusName
            })
            
    db.close()
    return results

@app.get("/api/districts/{id}/hotspots")
def get_district_hotspots(id: str, date_days: Optional[int] = None):
    if not id.isdigit():
        raise HTTPException(status_code=400, detail="Invalid district ID")
    return detect_hotspots(int(id), date_days=date_days)

@app.get("/api/alerts")
def get_alerts():
    return calculate_alerts()

@app.get("/api/network/graph")
def get_network_graph_data(
    district_id: Optional[str] = None,
    min_cases: Optional[int] = Query(2, ge=1)
):
    filters = {}
    if district_id and district_id != "all" and district_id.isdigit():
        filters["districtId"] = int(district_id)
    filters["minLinks"] = min_cases
    return get_network_graph(filters)

@app.get("/api/network/repeat-offenders")
def get_network_repeat_offenders(min_cases: Optional[int] = Query(2, ge=1)):
    return get_repeat_offenders(min_cases)

@app.get("/api/network/offender/{id}")
def get_offender_detail_api(id: str):
    # Retrieve offender details from the list of repeat offenders
    ro_list = get_repeat_offenders(min_cases=2)
    for ro in ro_list:
        if ro["id"] == id or ro["id"].split("_")[-1] == id or ro["name"].lower().replace(" ", "_") in id.lower():
            # Enrich MO signature further
            return ro
    raise HTTPException(status_code=404, detail="Offender not found")

@app.get("/api/risk/leaderboard")
def get_risk_leaderboard():
    db = Session()
    districts = db.query(District).all()
    subheads = db.query(CrimeSubHead).all()
    db.close()
    
    leaderboard = []
    for d in districts:
        for sh in subheads:
            res = predict_risk(d.DistrictID, sh.CrimeSubHeadID)
            if "error" not in res:
                leaderboard.append(res)
                
    # Sort descending by score
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    return leaderboard[:10]

@app.get("/api/risk/scores")
def get_all_risk_scores():
    db = Session()
    districts = db.query(District).all()
    subheads = db.query(CrimeSubHead).all()
    db.close()
    
    scores = []
    for d in districts:
        for sh in subheads:
            res = predict_risk(d.DistrictID, sh.CrimeSubHeadID)
            if "error" not in res:
                scores.append(res)
    return scores

@app.get("/api/risk/{district_id}/{crime_sub_head_id}")
def get_risk_detail_api(district_id: int, crime_sub_head_id: int):
    res = predict_risk(district_id, crime_sub_head_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@app.get("/api/anomalies")
def get_anomaly_cases():
    return detect_anomalies(limit=15)

@app.get("/api/districts/insights")
def get_districts_insights():
    db = Session()
    districts = db.query(District).all()
    cases_all = db.query(CaseMaster).all()
    subheads = {sh.CrimeSubHeadID: sh.CrimeHeadName for sh in db.query(CrimeSubHead).all()}
    db.close()
    
    # Calculate insights
    insights = []
    now = datetime.now()
    t30 = now - timedelta(days=30)
    t60 = now - timedelta(days=60)
    
    ro_list = get_repeat_offenders(min_cases=2)
    alerts = calculate_alerts()
    
    for d in districts:
        d_cases = [c for c in cases_all if c.district_id == d.DistrictID]
        recent = [c for c in d_cases if datetime.combine(c.CrimeRegisteredDate, datetime.min.time()) >= t30]
        prior = [c for c in d_cases if t60 <= datetime.combine(c.CrimeRegisteredDate, datetime.min.time()) < t30]
        
        trend_pct = 0
        if prior:
            trend_pct = round(((len(recent) - len(prior)) / len(prior)) * 100)
        elif recent:
            trend_pct = 100
            
        cat_counts = {}
        sub_counts = {}
        for c in d_cases:
            cat_counts[c.major_head.CrimeGroupName] = cat_counts.get(c.major_head.CrimeGroupName, 0) + 1
            sub_counts[c.minor_head.CrimeHeadName] = sub_counts.get(c.minor_head.CrimeHeadName, 0) + 1
            
        dominant_category = max(cat_counts, key=cat_counts.get) if cat_counts else "—"
        dominant_sub = max(sub_counts, key=sub_counts.get) if sub_counts else "—"
        
        # Hotspots
        d_hotspots = detect_hotspots(d.DistrictID, date_days=90)
        top_hotspot = d_hotspots[0] if d_hotspots else None
        top_hotspot_label = f"{top_hotspot['dominantCrime']} cluster ({top_hotspot['caseCount']} cases)" if top_hotspot else "—"
        
        # Offenders
        offender_count = len([o for o in ro_list if o["districtId"] == str(d.DistrictID)])
        
        # Risk (evaluate top risk subhead for this district)
        top_risk_score = 0
        top_risk_band = "Low"
        
        # Check cyber or property subheads
        db = Session()
        sh_list = db.query(CrimeSubHead).all()
        db.close()
        for sh in sh_list:
            risk_res = predict_risk(d.DistrictID, sh.CrimeSubHeadID)
            if "error" not in risk_res:
                if risk_res["score"] > top_risk_score:
                    top_risk_score = risk_res["score"]
                    top_risk_band = risk_res["band"]
                    
        suggested_action = "Review station patrol density."
        if dominant_category == "Cyber Crime":
            suggested_action = "Increase cyber cell monitoring and public awareness campaigns."
        elif dominant_category == "Crimes Against Women":
            suggested_action = "Deploy women's safety patrol units in high-alert flashpoint areas."
        elif dominant_category == "Crimes Against Property":
            suggested_action = "Increase patrol frequency and CCTV coverage in hotspots during evening hours."
            
        insights.append({
            "districtId": str(d.DistrictID),
            "districtName": d.DistrictName,
            "totalCases": len(d_cases),
            "priorPeriodCases": len(prior),
            "trendPct": trend_pct,
            "hotspotCount": len(d_hotspots),
            "offenderCount": offender_count,
            "dominantSubType": dominant_sub,
            "dominantCategory": dominant_category,
            "topHotspotLabel": top_hotspot_label,
            "highestRiskBand": top_risk_band,
            "highestRiskScore": top_risk_score,
            "suggestedAction": suggested_action
        })
        
    return insights

@app.get("/api/briefing")
def get_weekly_briefing(district_id: Optional[str] = None):
    db = Session()
    cases_query = db.query(CaseMaster)
    if district_id and district_id != "all" and district_id.isdigit():
        cases_query = cases_query.filter(CaseMaster.district_id == int(district_id))
    cases = cases_query.all()
    
    district_name = "State-wide (Karnataka)"
    if district_id and district_id != "all" and district_id.isdigit():
        dist = db.query(District).filter(District.DistrictID == int(district_id)).first()
        if dist:
            district_name = dist.DistrictName
            
    db.close()
    
    now = datetime.now()
    t30 = now - timedelta(days=30)
    t60 = now - timedelta(days=60)
    
    recent = [c for c in cases if datetime.combine(c.CrimeRegisteredDate, datetime.min.time()) >= t30]
    prior = [c for c in cases if t60 <= datetime.combine(c.CrimeRegisteredDate, datetime.min.time()) < t30]
    
    trend_pct = 0
    if prior:
        trend_pct = round(((len(recent) - len(prior)) / len(prior)) * 100)
        
    bullets = []
    
    # Active alerts
    alerts = calculate_alerts()
    relevant_alerts = [a for a in alerts if not district_id or a["districtId"] == district_id]
    for a in relevant_alerts[:3]:
        bullets.append(a["title"])
        
    # Repeat offenders
    ro_list = get_repeat_offenders(min_cases=2)
    district_ro = [o for o in ro_list if not district_id or o["districtId"] == district_id]
    three_plus = [o for o in district_ro if len(o["linkedCaseIds"]) >= 3]
    if three_plus:
        bullets.append(f"{len(three_plus)} repeat offenders are linked to 3 or more cases in the jurisdiction, indicating persistent networks.")
        
    # Anomaly cases
    anoms = detect_anomalies(limit=5)
    relevant_anoms = [an for an in anoms if not district_id or an["id"] in [str(c.CaseMasterID) for c in cases]]
    if relevant_anoms:
        bullets.append(f"Isolation Forest flagged {len(relevant_anoms)} high-anomaly cases needing immediate review (e.g. Case {relevant_anoms[0]['caseNo']} score: {relevant_anoms[0]['anomalyScore']}%).")
        
    if not bullets:
        bullets.append("Crime rates show steady baseline activity with no significant spatial clusters flagged today.")
        
    recommendations = [
        "Optimize patrol patterns using the latest DBSCAN-identified coordinates.",
        "Strengthen inter-jurisdictional repeat offender profiling.",
        "Perform deep review on IsolationForest-flagged anomaly cases."
    ]
    
    plain_text_lines = [
        f"WEEKLY CRIME INTELLIGENCE BRIEFING",
        f"Scope: {district_name}",
        f"Period: {t30.date().isoformat()} to {now.date().isoformat()}",
        "",
        f"Key Summary: {len(recent)} cases registered recently, representing a {trend_pct:+d}% change.",
        "",
        "KEY OBSERVATIONS:",
        * [f"- {b}" for b in bullets],
        "",
        "RECOMMENDED ACTIONS:",
        * [f"- {r}" for r in recommendations]
    ]
    
    return {
        "scope": district_name,
        "dateRange": f"{t30.date().isoformat()} — {now.date().isoformat()}",
        "totalCases": len(recent),
        "trendPct": trend_pct,
        "bullets": bullets,
        "recommendations": recommendations,
        "plainText": "\n".join(plain_text_lines)
    }

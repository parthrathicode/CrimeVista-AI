import os
import sys
import pickle
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload
from functools import lru_cache
from collections import defaultdict

# Add parent directory to path so we can import backend.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import CaseMaster, District, CrimeSubHead, Accused
from ml.hotspot_detection import detect_hotspots

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crime_vista.db"))
ENGINE_URL = f"sqlite:///{DB_PATH}"

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
MODEL_PATH = os.path.join(MODEL_DIR, "risk_model.pkl")

# Feature names in order
FEATURE_NAMES = [
    "Prior 3-Month Average Count",
    "Prior 12-Month Average Count",
    "Trend Ratio",
    "Seasonal Index",
    "Hotspot Density",
    "Repeat Offender Count"
]


def _score_from_features(features):
    score = min(max((features[0] * 12.0 + features[2] * 20.0 + features[4] * 5.0), 5.0), 95.0)
    if score < 30:
        band = "Low"
    elif score < 65:
        band = "Medium"
    else:
        band = "High"

    contributions = [
        {"feature": FEATURE_NAMES[0], "points": round(features[0] * 8.0, 2)},
        {"feature": FEATURE_NAMES[1], "points": round(features[1] * -3.0, 2)},
        {"feature": FEATURE_NAMES[2], "points": round(features[2] * 15.0, 2)},
        {"feature": FEATURE_NAMES[3], "points": round(features[3] * 4.0, 2)},
        {"feature": FEATURE_NAMES[4], "points": round(features[4] * 10.0, 2)},
        {"feature": FEATURE_NAMES[5], "points": round(features[5] * 2.0, 2)},
    ]
    return round(score, 1), band, contributions


def _build_monthly_trend_from_dates(dates, predicted_score, now):
    monthly_data = {}
    for i in range(12):
        month_date = now - timedelta(days=i * 30)
        monthly_data[month_date.strftime("%b %y")] = 0

    for case_date in dates:
        m_key = case_date.strftime("%b %y")
        if m_key in monthly_data:
            monthly_data[m_key] += 1

    trend_list = []
    for i in range(11, -1, -1):
        month_date = now - timedelta(days=i * 30)
        m_key = month_date.strftime("%b %y")
        trend_list.append({"month": m_key, "cases": monthly_data.get(m_key, 0)})

    next_month = now + timedelta(days=30)
    predicted_cases = max(round(predicted_score / 10.0), 0)
    trend_list.append(
        {"month": next_month.strftime("%b %y"), "cases": predicted_cases, "isPredicted": True}
    )
    return trend_list

def get_session():
    engine = create_engine(ENGINE_URL)
    Session = sessionmaker(bind=engine)
    return Session()

# Cache model loading to avoid unpickling on every single prediction call
_MODEL_DATA_CACHE = None

def load_model_once():
    global _MODEL_DATA_CACHE
    if _MODEL_DATA_CACHE is None:
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    _MODEL_DATA_CACHE = pickle.load(f)
            except Exception:
                _MODEL_DATA_CACHE = {}
        else:
            _MODEL_DATA_CACHE = {}
    return _MODEL_DATA_CACHE


@lru_cache(maxsize=8)
def get_risk_snapshot(cache_key):
    """
    Build a bulk risk snapshot using one DB pass so AppSail endpoints do not time out.
    """
    session = get_session()
    now = datetime.now()
    t90 = now - timedelta(days=90)
    t360 = now - timedelta(days=360)
    target_month = now.month

    cases = (
        session.query(CaseMaster)
        .options(joinedload(CaseMaster.major_head), joinedload(CaseMaster.minor_head))
        .all()
    )
    districts = {d.DistrictID: d.DistrictName for d in session.query(District).all()}
    session.close()

    combo_dates = defaultdict(list)
    combo_meta = {}
    district_ids = set()

    for case in cases:
        combo_key = (case.district_id, case.CrimeMinorHeadID)
        combo_dates[combo_key].append(case.CrimeRegisteredDate)
        combo_meta[combo_key] = (
            districts.get(case.district_id, str(case.district_id)),
            case.major_head.CrimeGroupName,
            case.minor_head.CrimeHeadName,
        )
        district_ids.add(case.district_id)

    hotspot_density_by_district = {}
    for district_id in district_ids:
        hotspots = detect_hotspots(district_id, date_days=90)
        hotspot_density_by_district[district_id] = sum(h["densityScore"] for h in hotspots) if hotspots else 0.0

    repeat_offender_count_by_district = {
        district_id: get_district_repeat_offender_count(district_id) for district_id in district_ids
    }

    scores = []
    for (district_id, sub_head_id), dates in combo_dates.items():
        count_3mo = sum(1 for d in dates if d >= t90.date())
        count_12mo = sum(1 for d in dates if d >= t360.date())
        prior_3mo_avg = count_3mo / 3.0
        prior_12mo_avg = count_12mo / 12.0

        if prior_12mo_avg == 0:
            trend_ratio = 1.0 if prior_3mo_avg > 0 else 0.0
        else:
            trend_ratio = prior_3mo_avg / prior_12mo_avg

        month_counts = defaultdict(int)
        for case_date in dates:
            month_counts[case_date.month] += 1
        seasonal_index = month_counts.get(target_month, 0) / 2.0

        features = [
            prior_3mo_avg,
            prior_12mo_avg,
            trend_ratio,
            seasonal_index,
            hotspot_density_by_district.get(district_id, 0.0),
            repeat_offender_count_by_district.get(district_id, 0.0),
        ]
        score, band, contributions = _score_from_features(features)
        district_name, category_name, sub_type_name = combo_meta[(district_id, sub_head_id)]

        scores.append(
            {
                "districtId": str(district_id),
                "districtName": district_name,
                "category": category_name,
                "subType": sub_type_name,
                "score": score,
                "band": band,
                "contributions": contributions,
                "monthlyTrend": _build_monthly_trend_from_dates(dates, score, now),
            }
        )

    scores.sort(key=lambda row: row["score"], reverse=True)
    return scores

# Cache repeat offenders count per district
@lru_cache(maxsize=128)
def get_district_repeat_offender_count(district_id):
    session = get_session()
    try:
        accused_in_district = session.query(Accused).join(CaseMaster).filter(
            CaseMaster.district_id == district_id
        ).all()
        
        offender_counts = {}
        for acc in accused_in_district:
            key = (acc.AccusedName.strip().lower(), acc.AgeYear, acc.GenderID)
            offender_counts[key] = offender_counts.get(key, 0) + 1
            
        return float(len([k for k, count in offender_counts.items() if count >= 2]))
    finally:
        session.close()

def get_features_for_combo(session, district_id, sub_head_id, reference_date):
    """
    Computes features dynamically for a given district, crime subhead, and reference date.
    """
    # 1. Prior 3-month and 12-month counts
    t30 = reference_date - timedelta(days=30)
    t90 = reference_date - timedelta(days=90)
    t360 = reference_date - timedelta(days=360)
    
    cases_12mo = session.query(CaseMaster).filter(
        CaseMaster.district_id == district_id,
        CaseMaster.CrimeMinorHeadID == sub_head_id,
        CaseMaster.CrimeRegisteredDate >= t360.date(),
        CaseMaster.CrimeRegisteredDate < reference_date.date()
    ).all()
    
    count_3mo = 0
    count_12mo = 0
    
    for c in cases_12mo:
        dt = datetime.combine(c.CrimeRegisteredDate, datetime.min.time())
        if dt >= t90:
            count_3mo += 1
        count_12mo += 1
        
    prior_3mo_avg = count_3mo / 3.0
    prior_12mo_avg = count_12mo / 12.0
    
    # 2. Trend Ratio
    if prior_12mo_avg == 0:
        trend_ratio = 1.0 if prior_3mo_avg > 0 else 0.0
    else:
        trend_ratio = prior_3mo_avg / prior_12mo_avg
        
    # 3. Seasonal Index (average for that calendar month historically)
    target_month = reference_date.month
    cases_all_time = session.query(CaseMaster).filter(
        CaseMaster.district_id == district_id,
        CaseMaster.CrimeMinorHeadID == sub_head_id
    ).all()
    
    month_counts = {}
    for c in cases_all_time:
        m = c.CrimeRegisteredDate.month
        month_counts[m] = month_counts.get(m, 0) + 1
        
    # Average across 2 years of data
    seasonal_index = month_counts.get(target_month, 0) / 2.0
    
    # 4. Hotspot Density (from DBSCAN output)
    hotspots = detect_hotspots(district_id, date_days=90)
    # Average density of hotspots in this district
    hotspot_density = sum(h["densityScore"] for h in hotspots) if hotspots else 0.0
    
    # 5. Repeat Offender Count in this district
    repeat_offender_count = get_district_repeat_offender_count(district_id)
    
    return [
        prior_3mo_avg,
        prior_12mo_avg,
        trend_ratio,
        seasonal_index,
        hotspot_density,
        repeat_offender_count
    ]

@lru_cache(maxsize=1024)
def predict_risk(district_id, sub_head_id):
    """
    Returns risk score, risk band, and SHAP explainability values for the district + crime subtype.
    """
    snapshot = get_risk_snapshot(datetime.now().strftime("%Y-%m-%d-%H"))

    session = get_session()
    district = session.query(District).filter(District.DistrictID == district_id).first()
    subhead = session.query(CrimeSubHead).filter(CrimeSubHead.CrimeSubHeadID == sub_head_id).first()
    if not district or not subhead:
        session.close()
        return {"error": "Invalid district_id or sub_head_id"}
    district_name = district.DistrictName
    category_name = subhead.crime_head.CrimeGroupName
    sub_type_name = subhead.CrimeHeadName
    session.close()

    for row in snapshot:
        if (
            row["districtId"] == str(district_id)
            and row["districtName"] == district_name
            and row["category"] == category_name
            and row["subType"] == sub_type_name
        ):
            return row

    session = get_session()
    features = get_features_for_combo(session, district_id, sub_head_id, datetime.now())
    session.close()
    
    # Check if XGBoost model is trained and saved
    model_data = load_model_once()
    if not model_data:
        # Fallback explanation if model is not trained yet (to prevent crashes)
        score, band, contributions = _score_from_features(features)
        
        return {
            "districtId": str(district_id),
            "districtName": district_name,
            "category": category_name,
            "subType": sub_type_name,
            "score": round(score, 1),
            "band": band,
            "contributions": contributions,
            "monthlyTrend": get_monthly_trend(district_id, sub_head_id, score)
        }
        
    model = model_data["model"]
    explainer = model_data["explainer"]
    
    X_val = np.array([features])
    
    # Compute prediction and scale to 0-100 range
    pred_val = float(model.predict(X_val)[0])
    score = min(max(pred_val * 10.0, 0.0), 100.0) # Scale predictions to 0-100
    
    # Risk Band
    if score < 35:
        band = "Low"
    elif score < 70:
        band = "Medium"
    else:
        band = "High"
        
    # SHAP Explanations
    shap_vals = explainer.shap_values(X_val)[0]
    
    contributions = []
    for f_name, s_val in zip(FEATURE_NAMES, shap_vals):
        contributions.append({
            "feature": f_name,
            "points": round(float(s_val) * 10.0, 2)
        })
        
    return {
        "districtId": str(district_id),
        "districtName": district_name,
        "category": category_name,
        "subType": sub_type_name,
        "score": round(score, 1),
        "band": band,
        "contributions": contributions,
        "monthlyTrend": get_monthly_trend(district_id, sub_head_id, score)
    }

def get_monthly_trend(district_id, sub_head_id, predicted_score):
    """
    Helper to fetch monthly historical case counts for the trend graph.
    Appends the next-month predicted case count.
    """
    session = get_session()
    
    # Fetch cases for the last 12 months
    now = datetime.now()
    t360 = now - timedelta(days=360)
    
    cases = session.query(CaseMaster).filter(
        CaseMaster.district_id == district_id,
        CaseMaster.CrimeMinorHeadID == sub_head_id,
        CaseMaster.CrimeRegisteredDate >= t360.date()
    ).all()
    
    # Group by month
    monthly_data = {}
    for i in range(12):
        month_date = now - timedelta(days=i*30)
        m_key = month_date.strftime("%b %y")
        monthly_data[m_key] = 0
        
    for c in cases:
        m_key = c.CrimeRegisteredDate.strftime("%b %y")
        if m_key in monthly_data:
            monthly_data[m_key] += 1
            
    # Format sorted ascending by date
    trend_list = []
    # Re-iterate backwards to get chronological order
    for i in range(11, -1, -1):
        month_date = now - timedelta(days=i*30)
        m_key = month_date.strftime("%b %y")
        trend_list.append({
            "month": m_key,
            "cases": monthly_data.get(m_key, 0)
        })
        
    # Append predicted next month (predicted score maps directly to expected case volume / 10)
    next_month = now + timedelta(days=30)
    predicted_cases = max(round(predicted_score / 10.0), 0)
    trend_list.append({
        "month": next_month.strftime("%b %y"),
        "cases": predicted_cases,
        "isPredicted": True
    })
    
    session.close()
    return trend_list

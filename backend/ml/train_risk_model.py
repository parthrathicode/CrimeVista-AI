import os
import sys
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import xgboost as xgb
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

# Add parent directory to path so we can import backend.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import CaseMaster, District, CrimeSubHead
from ml.risk_prediction import get_features_for_combo, FEATURE_NAMES, MODEL_DIR, MODEL_PATH

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crime_vista.db"))
ENGINE_URL = f"sqlite:///{DB_PATH}"

def get_session():
    engine = create_engine(ENGINE_URL)
    Session = sessionmaker(bind=engine)
    return Session()

def train_model():
    session = get_session()
    
    districts = [d.DistrictID for d in session.query(District).all()]
    subheads = [sh.CrimeSubHeadID for sh in session.query(CrimeSubHead).all()]
    
    print("Building training dataset from historical cases (rolling window)...")
    
    # We will roll a window month by month for the last 18 months (months 6 to 23 of our 24-month dataset)
    # reference dates will be month-ends
    today_dt = datetime.now()
    
    dataset = []
    
    # Calculate for 12 monthly periods to get enough historical samples
    for month_offset in range(3, 18):
        ref_date = today_dt - timedelta(days=month_offset * 30)
        next_month_start = ref_date.date()
        next_month_end = (ref_date + timedelta(days=30)).date()
        
        # Pre-query case counts for the target month to optimize speed
        target_cases = session.query(CaseMaster).filter(
            CaseMaster.CrimeRegisteredDate >= next_month_start,
            CaseMaster.CrimeRegisteredDate < next_month_end
        ).all()
        
        # Build lookup table for targets
        counts_lookup = {}
        for c in target_cases:
            lookup_key = (c.district_id, c.CrimeMinorHeadID)
            counts_lookup[lookup_key] = counts_lookup.get(lookup_key, 0) + 1
            
        print(f"  Processing window reference date: {ref_date.strftime('%Y-%m-%d')}...")
        
        for d_id in districts:
            for sh_id in subheads:
                features = get_features_for_combo(session, d_id, sh_id, ref_date)
                target = counts_lookup.get((d_id, sh_id), 0)
                
                dataset.append({
                    "features": features,
                    "target": float(target)
                })
                
    session.close()
    
    df = pd.DataFrame(dataset)
    X = np.array(df["features"].tolist())
    y = np.array(df["target"].tolist())
    
    print(f"Dataset generated. Shape: {X.shape}")
    
    # Split into train and validation
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor model...")
    model = xgb.XGBRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    preds = model.predict(X_val)
    mae = mean_absolute_error(y_val, preds)
    r2 = r2_score(y_val, preds)
    
    print("\n" + "="*40)
    print("MODEL EVALUATION & BENCHMARK METRICS")
    print("="*40)
    print(f"Mean Absolute Error (MAE): {mae:.4f} cases")
    print(f"Coefficient of Determination (R2): {r2:.4f}")
    
    # Feature Importances
    importances = model.feature_importances_
    print("\nFeature Importances:")
    print("-" * 30)
    for name, imp in zip(FEATURE_NAMES, importances):
        print(f"{name:<30} : {imp:.4f} ({imp*100:.1f}%)")
    print("="*40)
    
    # Build SHAP explainer
    print("\nComputing Tree SHAP Explainer...")
    explainer = shap.TreeExplainer(model)
    
    # Create output model folder if not exists
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Serialize model and explainer
    print(f"Saving serialized model and explainer to {MODEL_PATH}...")
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({
            "model": model,
            "explainer": explainer,
            "metrics": {"mae": mae, "r2": r2, "importances": list(importances)}
        }, f)
        
    print("Model training pipeline completed successfully!")

if __name__ == "__main__":
    train_model()

# ml/train_xgb.py — XGBoost regressor for dynamic price prediction
import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

FEATURES = [
    'distance_km', 'total_items', 'fragile_count',
    'heavy_items', 'package_enc', 'floor_source',
    'floor_dest', 'has_elevator', 'day_of_week',
    'hour_of_day', 'fuel_price_index', 'demand_score'
]

def build_dataset(path='data/completed_bookings.csv'):
    df = pd.read_csv(path)
    df['day_of_week']  = pd.to_datetime(df['move_date']).dt.weekday
    df['hour_of_day']  = pd.to_datetime(df['move_date']).dt.hour
    df['package_enc']  = df['package'].map({'Basic': 0, 'Standard': 1, 'Premium': 2})
    return df

def train():
    df = build_dataset()
    X, y = df[FEATURES], df['final_price']

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.15, random_state=7
    )

    model = xgb.XGBRegressor(
        n_estimators=600,
        learning_rate=0.05,
        max_depth=7,
        min_child_weight=3,
        subsample=0.85,
        colsample_bytree=0.80,
        objective='reg:squarederror',
        tree_method='hist',
        random_state=7
    )
    model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    preds = model.predict(X_te)
    print(f'MAE : Rs.{mean_absolute_error(y_te, preds):.2f}')
    print(f'R^2 : {r2_score(y_te, preds):.3f}')

    joblib.dump({'model': model, 'features': FEATURES},
                'artifacts/xgb_price_v3.joblib')

def predict_price(payload: dict) -> float:
    bundle = joblib.load('artifacts/xgb_price_v3.joblib')
    row = pd.DataFrame([payload])[bundle['features']]
    return float(bundle['model'].predict(row)[0])

if __name__ == '__main__':
    train()

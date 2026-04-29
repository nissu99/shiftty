# ml/train_rf.py — Random Forest trainer for service package recommendation
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import joblib

FEATURES = [
    'distance_km', 'total_items', 'fragile_ratio',
    'heavy_items', 'floor_source', 'floor_dest',
    'has_elevator', 'weekend_move'
]
TARGET = 'package'          # Basic | Standard | Premium

def load_training_data(path='data/bookings.csv'):
    df = pd.read_csv(path)
    df['fragile_ratio'] = df['fragile_count'] / df['total_items'].clip(lower=1)
    df['weekend_move']  = pd.to_datetime(df['move_date']).dt.weekday >= 5
    return df

def train():
    df = load_training_data()
    X, y = df[FEATURES], df[TARGET]

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y_enc, test_size=0.20, stratify=y_enc, random_state=42
    )

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=14,
        min_samples_leaf=4,
        class_weight='balanced',
        n_jobs=-1,
        random_state=42
    )
    clf.fit(X_tr, y_tr)

    cv_acc = cross_val_score(clf, X_tr, y_tr, cv=5).mean()
    print(f'5-fold CV accuracy: {cv_acc:.3f}')

    preds = clf.predict(X_te)
    print(classification_report(y_te, preds, target_names=le.classes_))

    joblib.dump({'model': clf, 'encoder': le, 'features': FEATURES},
                'artifacts/rf_package_v1.joblib')
    print('Model saved -> artifacts/rf_package_v1.joblib')

if __name__ == '__main__':
    train()

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from app.engine import run_prediction_engine
import os
import pandas as pd

# 1. Place the dynamic path resolution right under your imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'cleaned_josaa_data.csv')

# 2. Update your pandas loading line to use DATA_PATH instead of a string shortcut
df = pd.read_csv(DATA_PATH)

app = FastAPI(title="JoSAA College Predictor API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("⚡ Loading historical database into RAM...")
josaa_dataframe = pd.read_csv(DATA_PATH)
print("✅ Database loaded successfully.")

@app.get("/")
def home():
    return {"status": "Online", "message": "Welcome to the JoSAA Predictor API Engine"}

@app.get("/predict")
def predict(
    rank: int, 
    category: str, 
    gender: str, 
    quota: str, 
    institute: str = Query(default=""), 
    branch: str = Query(default=""),
    advanced_rank: int = Query(default=None)  # <-- ADDED OPTIONAL PARAMETER
):
    predictions = run_prediction_engine(
        df=josaa_dataframe, 
        rank=rank, 
        category=category, 
        gender=gender, 
        quota=quota, 
        inst_keyword=institute, 
        branch_keyword=branch,
        advanced_rank=advanced_rank
    )
    return {
        "user_query": {"rank": rank, "category": category, "gender": gender, "quota": quota, "advanced_rank": advanced_rank},
        "total_options_found": len(predictions),
        "results": predictions
    }
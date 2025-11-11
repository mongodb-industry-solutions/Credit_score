import pandas as pd
import joblib
from pymongo import MongoClient
import certifi
import os
import json
import numpy as np
import sys
from dummy import PrepareDummyCols
from dotenv import load_dotenv
from functools import lru_cache
from llm_utils import invoke_llm, get_credit_score_expl, get_card_suggestions
from stat_score_util import calculate_credit_score, calculate_percentile_given_value
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import time
from datetime import datetime, timezone

import uvicorn

# Fix for pickle/joblib loading when running with uvicorn
# When uvicorn runs, __main__ refers to uvicorn's main module, not our main.py
# The pickle file expects PrepareDummyCols to be in __main__, so we register it there
# This ensures pickle can find the class when unpickling the model file
import __main__
if not hasattr(__main__, 'PrepareDummyCols'):
    __main__.PrepareDummyCols = PrepareDummyCols

# Load environment variables
load_dotenv()

# MongoDB setup
MONGO_CONN = os.environ.get("MONGO_CONNECTION_STRING")
COLLECTION = os.environ.get("MONGODB_DB")
client = MongoClient(MONGO_CONN)
col = client[COLLECTION]["user_data"]

# Model loading - lazy initialization to avoid pickle issues with uvicorn reloader
_label_encoder_l = None
_dummy_l = None
_model_l = None
_ordinal_enc_l = None

def get_label_encoder():
    """Lazy initialization of label encoder."""
    global _label_encoder_l
    if _label_encoder_l is None:
        _label_encoder_l = joblib.load("./model/credit_score_mul_lable_le.jlb")
    return _label_encoder_l

def get_dummy():
    """Lazy initialization of dummy transformer."""
    global _dummy_l
    if _dummy_l is None:
        # Ensure PrepareDummyCols is available in __main__ namespace for pickle
        # This is needed because uvicorn runs the app as __main__
        import __main__
        if not hasattr(__main__, 'PrepareDummyCols'):
            __main__.PrepareDummyCols = PrepareDummyCols
        _dummy_l = joblib.load("./model/credit_score_mul_lable_coldummy.jlb")
    return _dummy_l

def get_model():
    """Lazy initialization of ML model."""
    global _model_l
    if _model_l is None:
        _model_l = joblib.load("./model/credit_score_mul_lable_model.jlb")
    return _model_l

def get_ordinal_encoder():
    """Lazy initialization of ordinal encoder."""
    global _ordinal_enc_l
    if _ordinal_enc_l is None:
        _ordinal_enc_l = joblib.load("./model/credit_score_mul_lable_ordenc.jlb")
    return _ordinal_enc_l


def predict(df):
    # Get models lazily
    dummy_l = get_dummy()
    ordinal_enc_l = get_ordinal_encoder()
    model_l = get_model()
    label_encoder_l = get_label_encoder()
    
    df_copy = df.copy()
    df_copy.drop(columns=["ID", "Customer_ID", "Name",
                 "SSN", "Credit_Score"], inplace=True)
    df_copy = dummy_l.transform(df_copy)
    df_copy[ordinal_enc_l.feature_names_in_] = ordinal_enc_l.transform(
        df_copy[ordinal_enc_l.feature_names_in_])
    v = model_l.predict_proba(df_copy[model_l.feature_names_in_])[0]
    pred = label_encoder_l.inverse_transform(
        model_l.predict(df_copy[model_l.feature_names_in_]))[0]
    return pred, v


def get_user_profile(user_id):
    """
    Get user profile from MongoDB and run ML prediction.
    Raises ValueError if user not found.
    """
    # Query MongoDB
    user_records = list(col.find({"Customer_ID": int(user_id)}, {"_id": 0}))
    
    if not user_records or len(user_records) == 0:
        raise ValueError(f"User with Customer_ID {user_id} not found in database")
    
    # Convert to DataFrame
    user_id_df = pd.DataFrame.from_records(user_records)
    
    if user_id_df.empty:
        raise ValueError(f"User with Customer_ID {user_id} found but has no data")
    
    # Run ML prediction
    pred, v = predict(user_id_df)
    
    # Prepare user profile
    user_id_df.drop(columns=["ID", "Customer_ID",
                    "SSN", "Credit_Score"], inplace=True)
    user_profile_ip = user_id_df.to_dict(orient="records")[0]
    
    # Calculate allowed credit limit
    monthly_income = user_id_df['Monthly_Inhand_Salary'].values[0]
    allowed_credit_limit = int(
        np.ceil(monthly_income * 6 * ((1 * v[0] + 0.5 * v[1] + 0.25 * v[2]))))
    
    return pred, allowed_credit_limit, user_profile_ip


@lru_cache(1)
def get_model_feature_imps():
    model_l = get_model()
    df = pd.DataFrame.from_records(
        (col.find({"Customer_ID": 8625}, {"_id": 0})))
    imp_idx = np.argsort(-1 * model_l.feature_importances_)
    feature_importance = "\n".join(i for i in list(map(lambda x: f"Columns:{x[0]}  Prob score for decision making:{x[1]}",
                                                       zip(df.columns[imp_idx], model_l.feature_importances_[imp_idx]))))
    return feature_importance


# Create FastAPI app
app = FastAPI(
    title="Credit Score API",
    description="Credit Score API for credit score prediction and product suggestions",
    version="0.1.0",
    redirect_slashes=False
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers to the client
    max_age=3600,  # Cache preflight requests for 1 hour
)


@app.get("/")
async def root():
    return {"status": "Server is running!"}


@app.get("/credit_score/{user_id}")
async def get_credit_score(user_id: int):
    """
    Get credit score explanation and calculations for a user.
    """
    try:
        # Print the initial time when the function is called
        start_time = time.time()
        initial_time_utc = datetime.fromtimestamp(start_time, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        print(f"Function called at: {initial_time_utc} UTC")

        # Measure time for get_user_profile
        profile_start_time = time.time()
        try:
            pred, allowed_credit_limit, user_profile_ip = get_user_profile(user_id)
        except Exception as e:
            print(f"Error in get_user_profile: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=404, detail=f"User {user_id} not found or error retrieving user profile: {str(e)}")
        print(f"Time taken for get_user_profile: {time.time() - profile_start_time:.4f} seconds")
        
        # Measure time for get_credit_score_expl
        expl_start_time = time.time()
        try:
            response = get_credit_score_expl(
                user_profile_ip, pred, allowed_credit_limit, get_model_feature_imps()).strip()
        except Exception as e:
            print(f"Error in get_credit_score_expl: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Error generating credit score explanation: {str(e)}")
        print(f"Time taken for get_credit_score_expl: {time.time() - expl_start_time:.4f} seconds")

        # Measure time for calculating IP features
        ip_start_time = time.time()
        try:
            ip = {
                "Repayment History": (user_profile_ip["Credit_History_Age"] - user_profile_ip["Num_of_Delayed_Payment"]) / user_profile_ip["Credit_History_Age"],
                "Credit Utilization": 1 - (1 if (user_profile_ip["Credit_Utilization_Ratio"] / 100) > 0.4 else (user_profile_ip["Credit_Utilization_Ratio"] / 100)),
                "Credit History": calculate_percentile_given_value(user_profile_ip["Credit_History_Age"], 221.220, 99.681),
                "Outstanding": 1 - calculate_percentile_given_value(user_profile_ip['Outstanding_Debt'], 1426.220, 1155.129),
                "Num Credit Inquiries": 0 if calculate_percentile_given_value(user_profile_ip['Num_Credit_Inquiries'], 5.798, 3.868) > 0.8 else 1 - calculate_percentile_given_value(user_profile_ip['Num_Credit_Inquiries'], 5.798, 3.868)
            }
        except Exception as e:
            print(f"Error calculating IP features: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Error calculating scorecard features: {str(e)}")
        print(f"Time taken for calculating IP features: {time.time() - ip_start_time:.4f} seconds")

        # Measure time for calculating credit score
        score_start_time = time.time()
        try:
            scorecard_credit_score = calculate_credit_score(ip)
        except Exception as e:
            print(f"Error calculating credit score: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Error calculating credit score: {str(e)}")
        print(f"Time taken for calculate_credit_score: {time.time() - score_start_time:.4f} seconds")

        print(f"Total time taken for /credit_score/{user_id}: {time.time() - start_time:.4f} seconds")

        print(f"User profile: {response}")
        print(f"User credit profile: {pred}")
        print(f"Allowed credit limit: {allowed_credit_limit}")
        print(f"Scorecard credit score: {scorecard_credit_score}")
        print(f"Scorecard score features: {ip}")
        print(f"User ID: {user_id}")

        return {
            "userProfile": response,
            "userCreditProfile": pred,
            "allowedCreditLimit": allowed_credit_limit,
            "scoreCardCreditScore": scorecard_credit_score,
            "scorecardScoreFeatures": ip,
            "userId": user_id
        }
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Unexpected error in get_credit_score: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/product_suggestions")
async def product_suggestions(request: Request):
    start_time = time.time()
    print(f"Function called at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC")

    try:
        data = await request.json()
        user_profile, user_id, pred, allowed_credit_limit = \
            data.get("userProfile"), data.get("userId"), data.get("userCreditProfile"), data.get("allowedCreditLimit")

        print(f"User profile: {user_profile}")
        print(f"User ID: {user_id}")
        print(f"User credit profile: {pred}")
        print(f"Allowed credit limit: {allowed_credit_limit}")
        
        if not all([user_profile, user_id, pred, allowed_credit_limit]):
            print("Error: Missing required fields in the request or credit limit = 0")
            raise ValueError("Missing required fields in the request")

        profile_start_time = time.time()
        _, _, user_profile_ip = get_user_profile(user_id)
        print(f"Time taken for get_user_profile: {time.time() - profile_start_time:.4f} seconds")

        suggestions_start_time = time.time()
        # Move parsing logic here instead for isolated timing
        user_profile_ip_final = {
            k: user_profile_ip[k] for k in [
                "Occupation", "Annual_Income", "Monthly_Inhand_Salary",
                "Type_of_Loan", "Credit_Mix", "Payment_of_Min_Amount",
                "Total_EMI_per_month", "Amount_invested_monthly", "Payment_Behaviour"
            ] if k in user_profile_ip
        }

        print(f"Time taken for extracting relevant fields: {time.time() - profile_start_time:.4f} seconds")
        
        card_suggestions_json = get_card_suggestions(
            user_profile, json.dumps(user_profile_ip_final), pred, allowed_credit_limit
        )
        print(f"Time taken for generating card suggestions json: {time.time() - suggestions_start_time:.4f} seconds")

        print("Parsed card suggestions JSON:")
        print(card_suggestions_json)
        print(f"Total time taken for /product_suggestions: {time.time() - start_time:.4f} seconds")

        return JSONResponse(content={"productRecommendations": json.loads(card_suggestions_json)})
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"JSON decode error: {str(e)}")
    except Exception as e:
        return JSONResponse(content={"error": "An error occurred.", "details": str(e)}, status_code=500)


@app.post("/user_data/find_one")
async def find_user_data(request: Request):
    """
    Find a single user document from MongoDB.
    Used by frontend to fetch user profile data.
    """
    try:
        data = await request.json()
        filter_query = data.get("filter", {})
        
        if not filter_query:
            raise HTTPException(status_code=400, detail="Filter is required")
        
        # Query MongoDB
        user_data = col.find_one(filter_query, {"_id": 0})  # Exclude _id for JSON serialization
        
        if not user_data:
            return JSONResponse(content={}, status_code=200)
        
        return JSONResponse(content=user_data)
    except Exception as e:
        print(f"Error finding user data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to find user data: {str(e)}")


@app.post("/user_data/update_one")
async def update_user_data(request: Request):
    """
    Update a single user document in MongoDB.
    Used by frontend to update user profile data.
    """
    try:
        data = await request.json()
        filter_query = data.get("filter", {})
        update_query = data.get("update", {})
        
        if not filter_query:
            raise HTTPException(status_code=400, detail="Filter is required")
        if not update_query:
            raise HTTPException(status_code=400, detail="Update is required")
        
        # Ensure _id is not part of the update
        if "$set" in update_query and "_id" in update_query["$set"]:
            del update_query["$set"]["_id"]
        
        # Update MongoDB
        result = col.update_one(filter_query, update_query)
        
        return JSONResponse(content={
            "matched_count": result.matched_count,
            "modified_count": result.modified_count,
            "acknowledged": result.acknowledged
        })
    except Exception as e:
        print(f"Error updating user data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user data: {str(e)}")
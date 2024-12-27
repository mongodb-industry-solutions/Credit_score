import pandas as pd
import joblib
from pymongo import MongoClient
import certifi
import os
import json
import numpy as np
from dummy import PrepareDummyCols
from dotenv import load_dotenv
from functools import lru_cache
from llm_utils import invoke_llm, get_credit_score_expl, get_product_suggestions_1, get_credit_card_recommendations
from stat_score_util import calculate_credit_score, calculate_percentile_given_value
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import uvicorn

# Load environment variables
load_dotenv()

# MongoDB setup
MONGO_CONN = os.environ.get("MONGO_CONNECTION_STRING")
COLLECTION = os.environ.get("MONGODB_DB")
client = MongoClient(MONGO_CONN)
col = client[COLLECTION]["user_data"]

# Load models
label_encoder_l = joblib.load("./model/credit_score_mul_lable_le.jlb")
dummy_l = joblib.load("./model/credit_score_mul_lable_coldummy.jlb")
model_l = joblib.load("./model/credit_score_mul_lable_model.jlb")
ordinal_enc_l = joblib.load("./model/credit_score_mul_lable_ordenc.jlb")


def predict(df):
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
    user_id_df = pd.DataFrame.from_records(
        (col.find({"Customer_ID": int(user_id)}, {"_id": 0})))
    pred, v = predict(user_id_df)
    user_id_df.drop(columns=["ID", "Customer_ID",
                    "SSN", "Credit_Score"], inplace=True)
    user_profile_ip = user_id_df.to_dict(orient="records")[0]
    monthly_income = user_id_df['Monthly_Inhand_Salary'].values[0]
    allowed_credit_limit = int(
        np.ceil(monthly_income * 6 * ((1 * v[0] + 0.5 * v[1] + 0.25 * v[2]))))
    return pred, allowed_credit_limit, user_profile_ip


@lru_cache(1)
def get_model_feature_imps():
    df = pd.DataFrame.from_records(
        (col.find({"Customer_ID": 8625}, {"_id": 0})))
    imp_idx = np.argsort(-1 * model_l.feature_importances_)
    feature_importance = "\n".join(i for i in list(map(lambda x: f"Columns:{x[0]}  Prob score for decision making:{x[1]}",
                                                       zip(df.columns[imp_idx], model_l.feature_importances_[imp_idx]))))
    return feature_importance


# FastAPI app setup
app = FastAPI()

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "Server is running!"}


@app.post("/login")
async def login(request: Request):
    data = await request.json()
    user_id = data["userId"]
    # Assuming 'password' is used somewhere in the logic, retrieved it from data
    name = data["password"]
    data = list(col.find({"Customer_ID": int(user_id)}, {"_id": 0}))
    df = pd.DataFrame.from_records(data)
    if df.shape[0] > 0:
        return {"message": "Login Successful"}
    else:
        raise HTTPException(status_code=403, detail="Login Failed")


@app.get("/credit_score/{user_id}")
async def get_credit_score(user_id: int):
    pred, allowed_credit_limit, user_profile_ip = get_user_profile(user_id)
    response = get_credit_score_expl(
        user_profile_ip, pred, allowed_credit_limit, get_model_feature_imps()).strip()

    ip = {
        "Repayment History": (user_profile_ip["Credit_History_Age"] - user_profile_ip["Num_of_Delayed_Payment"]) / user_profile_ip["Credit_History_Age"],
        "Credit Utilization": 1 - (1 if (user_profile_ip["Credit_Utilization_Ratio"] / 100) > 0.4 else (user_profile_ip["Credit_Utilization_Ratio"] / 100)),
        "Credit History": calculate_percentile_given_value(user_profile_ip["Credit_History_Age"], 221.220, 99.681),
        "Outstanding": 1 - calculate_percentile_given_value(user_profile_ip['Outstanding_Debt'], 1426.220, 1155.129),
        "Num Credit Inquiries": 0 if calculate_percentile_given_value(user_profile_ip['Num_Credit_Inquiries'], 5.798, 3.868) > 0.8 else 1 - calculate_percentile_given_value(user_profile_ip['Num_Credit_Inquiries'], 5.798, 3.868)
    }
    scorecard_credit_score = calculate_credit_score(ip)

    return {
        "userProfile": response,
        "userCreditProfile": pred,
        "allowedCreditLimit": allowed_credit_limit,
        "scoreCardCreditScore": scorecard_credit_score,
        "scorecardScoreFeatures": ip,
        "userId": user_id
    }


@app.post("/product_suggestions")
async def product_suggestions(request: Request):
    try:
        # Attempt to parse the incoming JSON request
        data = await request.json()
        # Extract data from the request
        user_profile = data.get("userProfile")
        user_id = data.get("userId")
        pred = data.get("userCreditProfile")
        allowed_credit_limit = data.get("allowedCreditLimit")
        # Simple validation of required data fields
        if not all([user_profile, user_id, pred, allowed_credit_limit]):
            raise ValueError("Missing required fields in the request")
        # Process the user profile information
        _, _, user_profile_ip = get_user_profile(user_id)
        # Extract relevant fields from user profile IP
        user_profile_ip_final = {k: user_profile_ip[k] for k in [
            "Occupation", "Annual_Income", "Monthly_Inhand_Salary",
            "Type_of_Loan", "Credit_Mix", "Payment_of_Min_Amount",
            "Total_EMI_per_month", "Amount_invested_monthly", "Payment_Behaviour"
        ] if k in user_profile_ip}
        # Generate product suggestions and recommendations
        card_suggestions = get_product_suggestions_1(
            user_profile, json.dumps(user_profile_ip_final), pred, allowed_credit_limit
        )
        product_recommendations = get_credit_card_recommendations(
            user_profile, json.dumps(user_profile_ip_final), pred,
            allowed_credit_limit, card_suggestions
        )
        # Attempt to parse output recommendations into JSON
        product_recommendations = product_recommendations.replace("\n", "").replace('\"', '"').strip()
        product_recommendations_json = json.loads(product_recommendations)
        # Return the JSON response
        return JSONResponse(
            content={"productRecommendations": product_recommendations_json},
            headers={"Access-Control-Allow-Origin": "*"}
        )
    except json.JSONDecodeError as e:
        # Handle JSON parsing errors gracefully
        raise HTTPException(status_code=400, detail=f"JSON decode error: {str(e)}")
    except Exception as e:
        # Handle general exceptions gracefully
        return JSONResponse(
            content={"error": "An error occurred while processing the request.", "details": str(e)},
            status_code=500
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
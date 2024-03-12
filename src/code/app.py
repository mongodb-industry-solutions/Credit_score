from flask import Flask, jsonify, request
from flask_cors import CORS  
import joblib
import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient
from langchain.llms import OpenAI
from langchain.vectorstores import MongoDBAtlasVectorSearch
from langchain.embeddings import HuggingFaceInstructEmbeddings
from langchain.retrievers import MultiQueryRetriever
import os
import pandas as pd
import json

import logging

load_dotenv()

app = Flask(__name__)
CORS(app) 

MONGO_CONN=os.environ.get("MONGO_CONNECTION_STRING")
client = MongoClient(MONGO_CONN)
col = client["bfsi-genai"]["credit_history"]
vcol = client["bfsi-genai"]["cc_products"]

llm = OpenAI(temperature=0.2, model_name="gpt-3.5-turbo")
llm_large= OpenAI(temperature=0, model_name="gpt-3.5-turbo-16k")
repo_id = "hkunlp/instructor-base"
hf = HuggingFaceInstructEmbeddings(model_name=repo_id, cache_folder="tmp/")
hf.embed_instruction = "Represent the document for retrieval of personalized credit cards:"
vectorstore = MongoDBAtlasVectorSearch(vcol, hf)
retriever = vectorstore.as_retriever(search_type='similarity',search_kwargs={'k': 3})
recommender_retriever = MultiQueryRetriever.from_llm(retriever=retriever,llm=llm_large)

model = joblib.load("../model/classifier.jlb")
imp_idx = np.argsort(-1 * model.feature_importances_)
df = pd.DataFrame.from_records((col.find({"Unnamed: 0":241}, {"_id":0,"Unnamed: 0":0, "SeriousDlqin2yrs":0})))
feature_importance = "\n".join(i for i in list(map(lambda x:f"Columns:{x[0]}  Prob score for decision making:{x[1]}" ,zip(df.columns[imp_idx], model.feature_importances_[imp_idx]))))

def get_user_profile(user_id):
    user_id_df = pd.DataFrame.from_records((col.find({"Unnamed: 0":int(user_id)}, {"_id":0,"Unnamed: 0":0, "SeriousDlqin2yrs":0})))
    print(user_id_df)
    user_profile_ip = user_id_df.to_dict(orient="records")[0]
    print(user_profile_ip)
    pred = model.predict_proba(user_id_df)[:,1][0]
    allowed_credit_limit = int(np.ceil(df.MonthlyIncome*6*(1-pred)))
    logging.info(f"Allowed Credit Limit for the user: {allowed_credit_limit}")
    return pred, allowed_credit_limit, user_profile_ip

def get_credit_score_expl_prompt(user_profile_ip, allowed_credit_limit):
    prompt = f"""
##Instruction: Taking into account the Definitions of various fields and their respective values a model is trained to predict weather a person will experice delinquency or not in the next 2 years. 
Below both the values that were input to the model and the result produced by the model are provided. As a bank employee response to the candidate, It is expected to provide a detailed reason in layman 
language as to why a Credit request was rejected or processed given the profile of the candidate. Also while providing reason do not mention the use of AI model being used for decision making.

##Definitions:
RevolvingUtilizationOfUnsecuredLines=Total balance on credit cards and personal lines of credit except real estate and no installment debt like car loans divided by the sum of credit limits DataType=percentage
age=Age of borrower in years DataType=integer
NumberOfTime30-59DaysPastDueNotWorse=Number of times borrower has been 30-59 days past due but no worse in the last 2 years. DataType=integer
DebtRatio=Monthly debt payments, alimony,living costs divided by monthy gross income DataType=percentage
MonthlyIncome=Monthly income in INR DataType=real
NumberOfOpenCreditLinesAndLoans=Number of Open loans (installment like car loan or mortgage) and Lines of credit (e.g. credit cards) DataType=integer
NumberOfTimes90DaysLate=Number of times borrower has been 90 days or more past due. DataType=integer
NumberRealEstateLoansOrLines=Number of mortgage and real estate loans including home equity lines of credit DataType=integer
NumberOfTime60-89DaysPastDueNotWorse=Number of times borrower has been 60-89 days past due but no worse in the last 2 years. DataType=integer
NumberOfDependents=Number of dependents in family excluding themselves (spouse, children etc.) DataType=integer
SeriousDlqin2yrs=Person experienced 90 days past due delinquency or worse  DataType=Percentage

##Feature importace of the model used:
{feature_importance}

##Values for given profile to be use to predict the Result(SeriousDlqin2yrs) with a reason:
{user_profile_ip}

## Model Result:
Allowed Credit Limit for the user={allowed_credit_limit}

##Reason in step by step points:
<result>
{"UserProfile":}
</result>
"""
    return prompt

def get_product_suggestions_expl_prompt(user_profile, card_suggestions):
    recomendations_template=f"""
##Instruction:
-If the the user is considerd High/Moderate risk of default and suggestion on user profile in rejection of credit request then return "No Credit Card Recomended"
-Provide card by card reasons(concise) as to why the credit card is suggested to the user.  

## User profile:
{user_profile}

## Recommended Credit cards if Eligible:
{card_suggestions}

## Recommendations=Output as Json with card name as Key and concise reasons point by point as Value:
"""
    res = llm.invoke(recomendations_template)
    return json.loads(res)


def get_product_suggestions(user_profile):
    user_profile_based_card_template=f"""
##Instruction: Given the user profile recommended credit cards that will best fit the user profile. Provide reason as to why the credit card is suggested to the user for each card.

## User profile:
{user_profile}

## Recommendations with reasons point by point:
"""
    rec = recommender_retriever.get_relevant_documents(user_profile_based_card_template)
    card_suggestions= ""
    for r in rec:
        card_suggestions += f'- Card name:{" ".join(r.metadata["title"].split("-"))} card \n  Card Features:{r.page_content} +\n'
    return card_suggestions, rec

@app.route("/hello", methods=["GET"])
def say_hello():
    return jsonify({"msg": "Hello from Flask"})

@app.route("/credit_score", methods=["GET"])
def get_credit_score():
    user_id = request.args.get("userId")
    _ , allowed_credit_limit, user_profile_ip = get_user_profile(user_id)
    prompt = get_credit_score_expl_prompt(user_profile_ip, allowed_credit_limit)
    response = llm.predict(prompt)
    return jsonify({"userProfile": response, "allowedCreditLimit": allowed_credit_limit}) 

@app.route("/product_suggestions", methods=["POST"])
def get_product_suggestions_endpoint():
    data = request.get_json()
    user_profile = data["userProfile"]
    card_suggestions, rec = get_product_suggestions(user_profile)
    #print(rec)
    product_recommednations = get_product_suggestions_expl_prompt(user_profile, card_suggestions)
    return jsonify({"productRecommendations": product_recommednations})

if __name__ == "__main__":   # Please do not set debug=True in production
    app.run(host="0.0.0.0", port=5000, debug=True)
from flask import Flask, jsonify, request
import joblib
import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi
from langchain.llms import OpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.vectorstores import MongoDBAtlasVectorSearch
from langchain.embeddings import HuggingFaceInstructEmbeddings
from langchain.retrievers import MultiQueryRetriever
import os
import pandas as pd
import json
import re

import logging

load_dotenv()

app = Flask(__name__)

MONGO_CONN=os.environ.get("MONGO_CONNECTION_STRING")
client = MongoClient(MONGO_CONN,tlsCAFile=certifi.where())
col = client["bfsi-genai"]["credit_history"]
print(col.find_one({}))
vcol = client["bfsi-genai"]["cc_products"]
llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.2, top_p=0.999, top_k=200, max_output_tokens=1024)
llm_large = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.2, top_p=0.7, max_output_tokens=1024)
# llm = OpenAI(temperature=0.2, model_name="gpt-3.5-turbo")
# llm_large= OpenAI(temperature=0, model_name="gpt-3.5-turbo-16k")
repo_id = "hkunlp/instructor-base"
hf = HuggingFaceInstructEmbeddings(model_name=repo_id, cache_folder="tmp/")
hf.embed_instruction = "Represent the document for retrieval of personalized credit cards:"
vectorstore = MongoDBAtlasVectorSearch(vcol, hf)
retriever = vectorstore.as_retriever(search_type='similarity',search_kwargs={'k': 3})
recommender_retriever = MultiQueryRetriever.from_llm(retriever=retriever,llm=llm_large)

model = joblib.load("classifier.jlb")
imp_idx = np.argsort(-1 * model.feature_importances_)

df = pd.DataFrame.from_records((col.find({"Unnamed: 0":9}, {"_id":0,"Unnamed: 0":0, "SeriousDlqin2yrs":0})))
feature_importance = "\n".join(i for i in list(map(lambda x:f"Columns:{x[0]}  Prob score for decision making:{x[1]}" ,zip(df.columns[imp_idx], model.feature_importances_[imp_idx]))))

def get_user_profile(user_id):
    user_id_df = pd.DataFrame.from_records((col.find({"Unnamed: 0":int(user_id)}, {"_id":0,"Unnamed: 0":0, "SeriousDlqin2yrs":0})))
    print(user_id_df)
    user_profile_ip = user_id_df.to_dict(orient="records")[0]
    print(user_profile_ip)
    pred = model.predict_proba(user_id_df)[:,1][0]
    print(f">>>>>>>>>>>>>>>>>>>>>> Monthly Income : {user_id_df.MonthlyIncome}")
    allowed_credit_limit = int(np.ceil(user_id_df.MonthlyIncome*6*(1-pred)))
    logging.info(f"Allowed Credit Limit for the user: {allowed_credit_limit}")
    return pred, allowed_credit_limit, user_profile_ip

def get_credit_score_expl_prompt(user_profile_ip, pred, allowed_credit_limit):
    status = "Approved" if pred<0.5 else "Rejected"
    prompt = f"""
##Instruction: 
- Taking into account the Definitions of various fields and their respective values a model is trained to predict weather a person will expericen delinquency or not in the next 2 years.
- Below both the values that was input to the model and the result produced by the model are provided. 
- As a bank employee response to the candidate, It is expected to provide a detailed reason in layman language as to why a Credit request was rejected or processed given the profile of the candidate. 
- Also while providing reason do mention the use of automated process employed for decision making.

##Definitions:
- RevolvingUtilizationOfUnsecuredLines=Total balance on credit cards and personal lines of credit except real estate and no installment debt like car loans divided by the sum of credit limits DataType=percentage
- age=Age of borrower in years DataType=integer
- NumberOfTime30-59DaysPastDueNotWorse=Number of times borrower has been 30-59 days past due but no worse in the last 2 years. DataType=integer
- DebtRatio=Monthly debt payments, alimony,living costs divided by monthy gross income DataType=percentage
- MonthlyIncome=Monthly income in INR DataType=real
- NumberOfOpenCreditLinesAndLoans=Number of Open loans (installment like car loan or mortgage) and Lines of credit (e.g. credit cards) DataType=integer
- NumberOfTimes90DaysLate=Number of times borrower has been 90 days or more past due. DataType=integer
- NumberRealEstateLoansOrLines=Number of mortgage and real estate loans including home equity lines of credit DataType=integer
- NumberOfTime60-89DaysPastDueNotWorse=Number of times borrower has been 60-89 days past due but no worse in the last 2 years. DataType=integer
- NumberOfDependents=Number of dependents in family excluding themselves (spouse, children etc.) DataType=integer
SeriousDlqin2yrs=Person experienced 90 days past due delinquency or worse  DataType=Percentage

##Feature importace of the model used:
{feature_importance}

##Values for given profile to be use to predict the Result(SeriousDlqin2yrs) with a reason:
{user_profile_ip}

## Model Result:
- Probability of the user experiencing 90 days past due delinquency or worse in the next 2 years={pred}
- Credit Product Approval Status={status}
- Allowed Credit Limit for the user={allowed_credit_limit}

##Reason in step by step points as to why the credit request was rejected or processed given the profile of the candidate:
- Response length should be less than 250 words
<result>
{"UserProfile":}
</result>
"""
    return prompt

def get_product_suggestions_expl_prompt(user_profile, card_suggestions, pred, allowed_credit_limit,):
    status = "Approved" if float(pred)<0.5 else "Rejected"
    recomendations_template=f"""
##Instruction:
- The user profile is considered high risk if the
- Only If the the user credit product approval status is Rejected then return "No Credit Card Recomended"

## User profile:
{user_profile}

## Model Result:
- Credit Product Approval Status={status}
- Allowed Credit Limit for the user={allowed_credit_limit}

## Recommended Credit cards if Eligible:
{card_suggestions}

## Recommendations=Output as Json with card name as Key and concise reasons point by point as Value:
<result>
{{"CardName1":"personalized_product_description_1","CardName2":"personalized_product_description_2"}}
</result>
"""
    res = llm.invoke(recomendations_template)
    print(res.content)
    if res.content.strip().startswith("{"):
        op = res.content.replace("""\\n""", "\n")
        return op
    elif res.content.startswith("```json"):
        op = res.content.replace("```json\n", "").replace("""\n```""", "")
        return json.loads(op)


def get_product_suggestions(user_profile):
    user_profile_based_card_template=f"""
##Instruction: Given the user profile recommended credit cards that will best fit the user profile. Provide reason as to why the credit card is suggested to the user for each card.
- If the user profile has a higher age recommed card with lower annual fees
- If the user profile has a higher MonthlyIncome recommed card with higher benefits such as lounge access, brand affiliated discounts etc.
- If the user profile has a higher NumberOfOpenCreditLinesAndLoans recommed card with lower credit limit
- If the user profile has a higher NumberOfDependents recommed card with lower annual fees

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
    pred , allowed_credit_limit, user_profile_ip = get_user_profile(user_id)
    prompt = get_credit_score_expl_prompt(user_profile_ip, pred,allowed_credit_limit)
    response = llm.invoke(prompt)
    return jsonify({"userProfile": response.content, "delinquencyStatus": str(pred), "allowedCreditLimit": allowed_credit_limit}) 

@app.route("/product_suggestions", methods=["POST"])
def get_product_suggestions_endpoint():
    data = request.get_json()
    user_profile = data["userProfile"]
    allowed_credit_limt = data["allowedCreditLimit"]
    pred = data["delinquencyStatus"]
    card_suggestions, rec = get_product_suggestions(user_profile)
    product_recommednations = get_product_suggestions_expl_prompt(user_profile,card_suggestions, pred, allowed_credit_limt)
    return jsonify({"productRecommendations": product_recommednations})

if __name__ == "__main__":   # Please do not set debug=True in production
    app.run(host="0.0.0.0", port=5000, debug=True)
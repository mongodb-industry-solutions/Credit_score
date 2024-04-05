from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.vectorstores import MongoDBAtlasVectorSearch
from langchain.embeddings import HuggingFaceInstructEmbeddings
from langchain.retrievers import MultiQueryRetriever
import os
import pandas as pd
import json
import re
from functools import lru_cache

import logging

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 

MONGO_CONN=os.environ.get("MONGO_CONNECTION_STRING")
client = MongoClient(MONGO_CONN,tlsCAFile=certifi.where())
col = client["bfsi-genai"]["credit_history"]
vcol = client["bfsi-genai"]["cc_products"]
llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.2, top_p=0.999, top_k=250, max_output_tokens=1024)
llm_large = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.2, top_p=0.8, max_output_tokens=2048)
repo_id = "hkunlp/instructor-base"
hf = HuggingFaceInstructEmbeddings(model_name=repo_id, cache_folder="tmp/")
hf.embed_instruction = "Represent the document for retrieval of personalized credit cards:"
vectorstore = MongoDBAtlasVectorSearch(vcol, hf)
retriever = vectorstore.as_retriever(search_type='similarity',search_kwargs={'k': 3})
recommender_retriever = MultiQueryRetriever.from_llm(retriever=retriever,llm=llm_large)

model = joblib.load("classifier.jlb")
imp_idx = np.argsort(-1 * model.feature_importances_)

df = pd.DataFrame.from_records((col.find({"Unnamed: 0":1}, {"_id":0,"Unnamed: 0":0, "SeriousDlqin2yrs":0,"PredDlqin2yrs":0})))
feature_importance = "\n".join(i for i in list(map(lambda x:f"Columns:{x[0]}  Prob score for decision making:{x[1]}" ,zip(df.columns[imp_idx], model.feature_importances_[imp_idx]))))

def get_user_profile(user_id):
    user_id_df = pd.DataFrame.from_records((col.find({"Unnamed: 0":int(user_id)}, {"_id":0,"Unnamed: 0":0, "SeriousDlqin2yrs":0,"PredDlqin2yrs":0})))
    print(user_id_df)
    user_profile_ip = user_id_df.to_dict(orient="records")[0]
    print(user_profile_ip)
    pred = model.predict_proba(user_id_df)[:,1][0]
    print(f">>>>>>>>>>>>>>>>>>>>>> Monthly Income : {user_id_df.MonthlyIncome}")
    allowed_credit_limit = int(np.ceil(user_id_df.MonthlyIncome*6*(1-pred)))
    logging.info(f"Allowed Credit Limit for the user: {allowed_credit_limit}")
    return pred, allowed_credit_limit, user_profile_ip

def get_credit_score_expl_prompt(user_profile_ip, pred, allowed_credit_limit, thresh=0.3):
    status = "Approved" if pred<thresh else "Rejected"
    prompt = f"""
##Instruction: 
- Taking into account the Definitions of various fields and their respective values a model is trained to predict weather a person will expericen delinquency or not in the next year.
- Do not refer to the fileds using the column names found in the definitions below, instead write the field names in layman language.
- Below both the values that was input to the model and the result produced by the model are provided. 
- As a bank employee response to the candidate, It is expected to provide a detailed reason in layman language as to why a Credit request was rejected or processed given the profile of the candidate. 
- Also while providing reason do mention the use of automated process employed for decision making.
- Do not mention the Credit Limit in the response, as it is an internal tool for you to get more information about the user profile.

##Definitions:
- RevolvingUtilizationOfUnsecuredLines=Total balance on credit cards and personal lines of credit except real estate and no installment debt like car loans divided by the sum of credit limits DataType=percentage
- age=Age of borrower in years DataType=integer
- NumberOfTime30-59DaysPastDueNotWorse=Number of times borrower has been 30-59 days past due but no worse in the last 2 years. DataType=integer
- DebtRatio=Monthly debt payments, alimony,living costs divided by monthy gross income DataType=percentage
- MonthlyIncome=Monthly income in USD DataType=real
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
- Credit Product Approval Status={status}
- Fictitious Credit Limit for the user={allowed_credit_limit}

##Reason in step by step points as to why the credit request was rejected or processed given the profile of the candidate:
- Response length should be less than 250 words.
- Response should not be in a letter format nor should in include promtps like [Candidate's Name], [Bank Name] or others.

Reason for Decision:\n[Reason]
"""
    return prompt

def process_user_suggestion_prompt(recomendations_template):
    res = invoke_llm(recomendations_template)
    #print('res',res.content)
    if res.content.strip().startswith("{"):
        op = res.content.replace("""\\n""", "\n")
        print('\nhere 1\n\n')
        print('op',op)
        print('op',type(op))
        return op
    elif res.content.startswith("```json"):
        op = res.content.replace("```json\n", "").replace("""\n```""", "")
        print('\nhere 2\n\n')
        print('op',op)
        return json.loads(op)

def get_product_suggestions_expl_prompt(user_profile, pred, allowed_credit_limit,thresh=0.3):
    status = "Approved" if float(pred)<thresh else "Rejected"
    if status == 'Approved':
        card_suggestions,rec = get_product_suggestions(user_profile)
        recomendations_template=f"""
        ##Instruction:
        - Given the user profile and recommended credit cards that will best fit the user profile.
        - Provide reasons why each suggested credit card is adapted to the specific user.
        - When ever possible different cards should have different reasons to be suggested.
        - The name of the card should be ficticious and not a real one.

        ## User profile:
        {user_profile}

        ## Model Result:
        - Credit Product Approval Status={status}
        - Allowed Credit Limit for the user={allowed_credit_limit}

        ## Credit cards Suggestions:
        {card_suggestions}

        ## Recommendations=Output as Json with card name as Key and concise reasons point by point as Value:
        {{"CardName1":"personalized_product_description_1","CardName2":"personalized_product_description_2",...}}
        Do not format the output as a string, return the output as a JSON object.
        """
        return process_user_suggestion_prompt(recomendations_template)
    elif float(pred)>2*thresh:
            return {"No Credit Card Recomended": "Kindly improve your credit score and try again later."}
    else:
        card_suggestions,rec = get_product_suggestions_for_rejection(user_profile)
        recomendations_template=f"""
    ##Instruction:
    - Given the user profile was rejected, recommended credit cards that will best fit the user profile.
    - Given the user profile was rejected, modify the information from the Credit cards Suggestions to make it an inferior product. Cheaper, less benefits and less risk for the bank if the user fails to pay back.
    - Provide reasons as to why the credit card is suggested to the user for each card. There should be different reasons for different cards. No need to list benefits that they don't have. And there should be more than 5 reasons per card.

        ## User profile:
    {user_profile}

    ## Model Result:
    - Credit Product Approval Status={status}

    ## Credit cards Suggestions:
    {card_suggestions}

    ## Recommendations=Output as Json with card name as Key and concise reasons point by point as Value:
    {{"CardName1":"personalized_product_description_1","CardName2":"personalized_product_description_2",...}}
    """
        return process_user_suggestion_prompt(recomendations_template)
    
@lru_cache(100)
def get_product_suggestions_for_rejection(user_profile):
    user_profile_based_card_template=f"""
##Instruction: 
- Given the user profile recommended credit cards that will best fit the user profile. Provide reason as to why the credit card is suggested to the user for each card.
- suggest card that have the usage limits, 1 reward point for appropriate spend, 50 days repayment cycle, low annual fee

## User profile:
{user_profile}

## Recommendations with reasons point by point:
"""
    rec = recommender_retriever.get_relevant_documents(user_profile_based_card_template)
    card_suggestions= ""
    for r in rec:
        card_suggestions += f'- Card name:{" ".join(r.metadata["title"].split("-"))} \n  Card Features:{r.page_content} +\n'
    card_suggestions = replace_words(card_suggestions)
    return card_suggestions, rec
    
@lru_cache(100)
def get_product_suggestions(user_profile):
    user_profile_based_card_template=f"""
##Instruction: 
- You are a Credit Card broker and you would like to recommend the best credit card for the user based on the user profile.
- Provide reason as to why the credit card is suggested to the user for each card.
- suggest card that have the usage of word premium, co branded, travel, cashback, rewards, dining, shopping, fuel, lifestyle, entertainment, airport, lounge, golf, movie, hotel, concierge, insurance, wellness, health, fitness, luxury, exclusive, signature, platinum, gold, silver, titanium, contactless, contact-free, contact less, contact free, virtual, digital, online, offline, international, domestic, global, local, zero, no, low, minimum, maximum, high
## User profile:
{user_profile}

## Recommendations with reasons point by point:
"""
    rec = recommender_retriever.get_relevant_documents(user_profile_based_card_template)
    card_suggestions= ""
    for r in rec:
        card_suggestions += f'- Card name:{" ".join(r.metadata["title"].split("-"))} \n  Card Features:{r.page_content} +\n'
    return card_suggestions, rec

def replace_words(text):
    replacements = {
        "Premium": "Standard",
        "Titanium": "Basic",
        "Plus": "Basic",
        "Platinum": "Steel",
        "Elite": "Economy",
        "Exclusive": "Core",
        "Infinite": "Entry"
    }
    for word, replacement in replacements.items():
        text = text.replace(word, replacement)
    return text

@app.route("/hello", methods=["GET"])
def say_hello():
    return jsonify({"msg": "Hello from Flask"})

@lru_cache(1000)
def invoke_llm(prompt):
    response = llm.invoke(prompt)
    return response

@app.route("/credit_score", methods=["GET"])
def get_credit_score():
    user_id = request.args.get("userId")
    pred , allowed_credit_limit, user_profile_ip = get_user_profile(user_id)
    prompt = get_credit_score_expl_prompt(user_profile_ip, pred,allowed_credit_limit)
    approval_status =  "Approved" if pred<0.3 else "Rejected"
    response = invoke_llm(prompt)    
    return jsonify({"userProfile": response.content, "delinquencyStatus": str(pred), "approvalStatus": approval_status, "allowedCreditLimit": allowed_credit_limit}) 

@app.route("/product_suggestions", methods=["POST"])
def get_product_suggestions_endpoint():
    data = request.get_json()
    user_profile = data["userProfile"]
    allowed_credit_limt = data["allowedCreditLimit"]
    pred = data["delinquencyStatus"]
    product_recommednations = get_product_suggestions_expl_prompt(user_profile, pred, allowed_credit_limt)
    return jsonify({"productRecommendations": product_recommednations})

if __name__ == "__main__":   # Please do not set debug=True in production
    app.run(host="0.0.0.0", port=5000, debug=True)
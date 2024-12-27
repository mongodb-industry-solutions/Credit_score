from pymongo import MongoClient
import certifi
import json

from langchain_fireworks import Fireworks 
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain.embeddings.huggingface import HuggingFaceInstructEmbeddings
from langchain.retrievers import MultiQueryRetriever

from prompt_utils import get_credit_score_expl_prompt, get_credit_card_recommendations_prompt, user_profile_based_cc_rec_prompt, recommendation_parser

from dotenv import load_dotenv

load_dotenv()

import os
from functools import lru_cache

MONGO_CONN=os.environ.get("MONGO_CONNECTION_STRING")
client = MongoClient(MONGO_CONN)
vcol = client["bfsi-genai"]["cc_products"]

# headers = {
#     'X-Fireworks-Genie': True
# }

# https://fireworks.ai/models/fireworks/llama-v3p3-70b-instruct
llm = Fireworks(
    fireworks_api_key=os.environ.get("FIREWORKS_API_KEY"),
    model="accounts/fireworks/models/llama-v3p3-70b-instruct",
    temperature=0.000001, 
    max_tokens=16384, 
    top_p=0.9, 
    top_k=20
    )

# llm_large = Fireworks(
#     fireworks_api_key=os.environ["FIREWORKS_API_KEY"],
#     model="accounts/fireworks/models/mixtral-8x22b-instruct",
#     base_url="https://api.fireworks.ai/inference/v1/completions",
#     max_tokens=4096,
#     temperature=0,
#     top_p=1.0, 
#     top_k=43,
#     headers=headers
# )

# embedding model
repo_id = "hkunlp/instructor-base"
hf = HuggingFaceInstructEmbeddings(model_name=repo_id, cache_folder="tmp/")
hf.embed_instruction = "Represent the description to find most relevant credit cards as per provided Credit health:"

# Vector store declaration
vectorstore = MongoDBAtlasVectorSearch(vcol, hf)
retriever = vectorstore.as_retriever(search_type='similarity',search_kwargs={'k': 5})
# recommender_retriever = MultiQueryRetriever.from_llm(retriever=retriever,llm=llm_large)

@lru_cache(1000000)
def invoke_llm(prompt):
    """
    Invoke the LLM with the given prompt with cache.

    Args:
        prompt (str): The prompt to pass to the LLM.
    """
    response = llm.invoke(prompt)
    return response

def get_credit_score_expl(user_profile_ip, pred, allowed_credit_limit, feature_importance):
    """
    
    Get the credit score explanation from the LLM.

    Args:
        user_profile_ip (str): The user profile information.
        pred (float): The predicted credit score.
        allowed_credit_limit (float): The allowed credit limit.
        feature_importance (dict): The feature importance dictionary for the used ML model.

    """
    prompt = get_credit_score_expl_prompt.format(user_profile_ip=user_profile_ip, \
                                                 pred=pred, \
                                                 allowed_credit_limit=allowed_credit_limit, \
                                                 feature_importance=feature_importance)
    return invoke_llm(prompt)

@lru_cache(1000)
def get_credit_card_recommendations(user_profile, user_profile_ip, pred, allowed_credit_limit, card_suggestions):
    """
    
    Get the credit card recommendations from the LLM.

    Args:
        user_profile (str): The user profile information.
        user_profile_ip (json): The user profile information in Json format.
        pred (float): The predicted credit score.
        allowed_credit_limit (float): The allowed credit limit.
        card_suggestions (str): The card suggestions string.

    Returns:
        str: The card suggestions with personalized summary based on the user profile and prediction.

    """
    prompt = get_credit_card_recommendations_prompt.format(user_profile=user_profile,\
                                                  user_profile_ip=user_profile_ip,\
                                                  pred=pred,\
                                                  allowed_credit_limit=allowed_credit_limit,\
                                                  card_suggestions=card_suggestions)
    print("Output Summarize prompt \n", prompt)
    resp = invoke_llm(prompt)
    print('=================================================================')
    print("Output Summarize Response \n",resp)
    print(f"================================================================")
    parsed_resp = recommendation_parser.parse(resp)
    out = {}
    for ele in json.loads(parsed_resp.json())['card_suggestions']:
        out[ele['name']] = ele['description']
    return json.dumps(out)

@lru_cache(100)
def get_product_suggestions_1(user_profile, user_profile_ip, pred, allowed_credit_limit):
    """
    Retrieves product suggestions based on user profile and prediction.

    Args:
        user_profile (str): The user profile information.
        user_profile_ip (str): The user profile input in JSON format.
        pred (str): The prediction for the user profile ('Good', 'Poor', or 'Standard').
        allowed_credit_limit (float): The allowed credit limit for the user.

    Returns:
        str: The card suggestions based on the user profile and prediction.
    """

    search_term_suggestions = [
        "suggest card that have the usage of words like priority pass, zenith, lifetime free, super premium, ultra luxury, dining benefits, concerige services, premium, co branded, travel, cashback, rewards, dining, shopping, fuel, lifestyle, entertainment, airport, lounge, golf, movie, hotel, concierge, insurance, wellness, health, fitness, luxury, exclusive, signature, platinum, gold, silver, titanium, contactless, contact-free, contact less, contact free, virtual, digital, online, offline, international, domestic, global, local, zero, no, low, minimum, maximum, high",
        "suggest card that have the usage limits, cashback, basic, 50 days repayment cycle, low annual fee, basic features, low joining fees, higher interest rate",
        "suggest card that have usage of words cashback, with moderate credit limit and features, annual fee waiver on spends, redeem gifts on reward points"
    ]

    if pred == 'Good':
        search_term_suggestion = search_term_suggestions[0]
    elif pred == 'Poor':
        search_term_suggestion = search_term_suggestions[1]
    elif pred == 'Standard':
        search_term_suggestion = search_term_suggestions[2]

    user_profile_ip = json.loads(user_profile_ip)
    reco_prompt = user_profile_based_cc_rec_prompt.format(
        user_profile=user_profile,
        annual_income=user_profile_ip["Annual_Income"],
        occupation=user_profile_ip["Occupation"],
        monthly_inhand_salary=user_profile_ip["Monthly_Inhand_Salary"],
        pred=pred,
        allowed_credit_limit=allowed_credit_limit,
        search_term_suggestion=search_term_suggestion
    )
    resp = invoke_llm(reco_prompt)
    parsed_resp = recommendation_parser.parse(resp)

    card_suggestions = json.loads(parsed_resp.json())['card_suggestions']
    recs = []
    for suggestion in card_suggestions:
        recs += retriever.get_relevant_documents(f"{suggestion['name']}: {suggestion['description']}")

    card_suggestions = ""
    for r in recs:
        card_suggestions += f'- Card name:{" ".join(r.metadata["title"].split("-"))} card \n  Card Features:{r.page_content} +\n'
    return card_suggestions
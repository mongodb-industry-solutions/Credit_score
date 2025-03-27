from pymongo import MongoClient
import json

from langchain_fireworks import Fireworks 
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_voyageai import VoyageAIEmbeddings

from prompt_utils import get_credit_score_expl_prompt

from dotenv import load_dotenv

load_dotenv()

import os
from functools import lru_cache

MONGO_CONN=os.environ.get("MONGO_CONNECTION_STRING")
MONGO_DB_NAME=os.environ.get("MONGODB_DB") 
MONGO_COLL_NAME=os.environ.get("MONGODB_COLLECTION")

client = MongoClient(MONGO_CONN)
vcol = client[MONGO_DB_NAME][MONGO_COLL_NAME]

# https://fireworks.ai/models/fireworks/llama-v3p1-405b-instruct
llm = Fireworks(
        fireworks_api_key=os.environ.get("FIREWORKS_API_KEY"),
        model="accounts/fireworks/models/llama-v3p1-405b-instruct",
        temperature=0.000001,
        max_tokens=4096, 
        top_p=0.9, 
        top_k=30
    )

# Embedding model
embedding_model = VoyageAIEmbeddings(
    voyage_api_key=os.environ.get("VOYAGE_API_KEY"), model="voyage-3-large"
)

# Vector Store declaration
vector_store = MongoDBAtlasVectorSearch(
    embedding=embedding_model,
    collection=vcol,
    index_name="default"
)

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

@lru_cache(maxsize=100)
def get_card_suggestions(user_profile, user_profile_ip, pred, allowed_credit_limit):
    """
    Retrieves card suggestions based on user profile and prediction.

    Args:
        user_profile (str): The user profile information.
        user_profile_ip (str): The user profile input in JSON format.
        pred (str): The prediction for the user profile ('Good', 'Poor', or 'Standard').
        allowed_credit_limit (float): The allowed credit limit for the user.

    Returns:
        str: The card suggestions based on the user profile and prediction.
    """
    import time
    start_time = time.time()

    # Mapping prediction to search term suggestion
    search_term_suggestions = [
        "suggest card that have the usage of words like priority pass, zenith, lifetime free, super premium, ultra luxury, dining benefits, premium.",
        "suggest card that have usage limits, cashback, basic, 50 days repayment cycle, low annual fee, basic features, low joining fees, higher interest rate.",
        "suggest card that have usage of words cashback, with moderate credit limit and features, annual fee waiver on spends, redeem gifts on reward points."
    ]

    if pred == 'Good':
        search_term_suggestion = search_term_suggestions[0]
    elif pred == 'Poor':
        search_term_suggestion = search_term_suggestions[1]
    elif pred == 'Standard':
        search_term_suggestion = search_term_suggestions[2]

    print(f"pred: {pred}")
    print(f"search_term_suggestion: {search_term_suggestion}")

    try:
        recs = vector_store.similarity_search(query=search_term_suggestion, k=5, oversampling_factor=10, include_scores=True)
        print()
        print("Retrieved relevant documents for card suggestions:")
        print(recs)
        
        # Create a list to hold the card suggestion dictionaries
        card_suggestions_list = []

         # Loop over `recs` to build the suggestion data
        for r in recs:
            name = r.metadata["title"].strip()

            suggestion = {
                    "name": name,
                    "description": r.page_content.strip(),
                    "score": r.metadata["score"]
                }
            card_suggestions_list.append(suggestion)

        print("Formatted Card Suggestions List:")
        print(card_suggestions_list)
        
         # Serialize the list of dictionaries into a JSON string
        card_suggestions_json = json.dumps({"card_suggestions": card_suggestions_list}, ensure_ascii=False)
        # Print the final JSON string for additional debugging (optional)
        print("Final Card Suggestions JSON:", card_suggestions_json)
        # Return the serialized JSON string
        return card_suggestions_json

        
    except Exception as e:
        print(f"Error retrieving relevant documents: {e}")
        raise ValueError("Failed to retrieve relevant documents for card suggestions.")
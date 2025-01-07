from pymongo import MongoClient
import certifi
import json

from langchain_fireworks import Fireworks 
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain.embeddings.huggingface import HuggingFaceInstructEmbeddings
from langchain.retrievers import MultiQueryRetriever

from prompt_utils import get_credit_score_expl_prompt, user_profile_based_cc_rec_prompt, recommendation_parser

from dotenv import load_dotenv

load_dotenv()

import os
from functools import lru_cache

MONGO_CONN=os.environ.get("MONGO_CONNECTION_STRING")
client = MongoClient(MONGO_CONN)
vcol = client["bfsi-genai"]["cc_products"]

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
repo_id = "hkunlp/instructor-base"
hf = HuggingFaceInstructEmbeddings(model_name=repo_id, cache_folder="tmp/")
hf.embed_instruction = "Represent the description to find most relevant credit cards as per provided Credit health:"

# Vector Store declaration
vectorstore = MongoDBAtlasVectorSearch(vcol, hf)
retriever = vectorstore.as_retriever(search_type='similarity',search_kwargs={'k': 5})

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

    # Parse user profile input
    try:
        user_profile_ip = json.loads(user_profile_ip)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid user_profile_ip JSON: {e}")

    print(f"User Profile: {user_profile}")
    print(f"User Profile Annual Income: {user_profile_ip.get('Annual_Income')}")
    print(f"User Profile Occupation: {user_profile_ip.get('Occupation')}")
    print(f"User Profile Monthly Inhand Salary: {user_profile_ip.get('Monthly_Inhand_Salary')}")
    print(f"Prediction: {pred}")
    print(f"Allowed Credit Limit: {allowed_credit_limit}")
    print(f"Search Term Suggestion: {search_term_suggestion}")

    # Prepare the recommendation prompt
    reco_prompt = user_profile_based_cc_rec_prompt.format(
            user_profile=user_profile,
            annual_income=user_profile_ip.get('Annual_Income'),
            occupation=user_profile_ip.get('Occupation'),
            monthly_inhand_salary=user_profile_ip.get('Monthly_Inhand_Salary'),
            pred=pred,
            allowed_credit_limit=allowed_credit_limit,
            search_term_suggestion=search_term_suggestion
        )

    # Invoke LLM 
    try:
        # Invoke the LLM with the formatted prompt
        raw_response = invoke_llm(reco_prompt)
        print("Raw LLM Response:", raw_response)
    except Exception as e:
        raise ValueError(f"Error invoking LLM: {e}")

    # Parse the LLM response
    try:
        parsed_resp = recommendation_parser.parse(raw_response)
    except Exception as e:
        print(f"Error parsing LLM response: {e}")
        raise ValueError("Failed to parse recommendations from LLM response.")

    # Extract card suggestions from the parsed response
    try:
        card_suggestions = json.loads(parsed_resp.json())['card_suggestions']
    except Exception as e:
        print("Error extracting card suggestions from LLM response:", e)
        raise ValueError("Failed to extract card suggestions from LLM response.")

    print("Card Suggestions JSON Dict:")
    print(card_suggestions)

    # Retrieve relevant documents for each card suggestion from the retriever using the card suggestion name and description
    recs = []

    try:
        for suggestion in card_suggestions:
            print()
            print(f"Retrieving relevant documents for card suggestion: {suggestion['name']}: {suggestion['description']}")
            recs += retriever.get_relevant_documents(f"{suggestion['name']}: {suggestion['description']}")
        print()
        print("Retrieved relevant documents for card suggestions:")
        print(recs)
        print("Limiting to first 5 recommendations:")
        recs = recs[:5]  # Only take the first 5 items
    except Exception as e:
        print(f"Error retrieving relevant documents: {e}")
        raise ValueError("Failed to retrieve relevant documents for card suggestions.")


    # Format the card suggestions into a JSON string
    try:
        # Create a list to hold the card suggestion dictionaries
        card_suggestions_list = []
        # Create a set to keep track of processed card names
        seen_names = set()
        
        # Loop over `recs` to build the suggestion data
        for r in recs:
            name = r.metadata["title"].strip()
            # Check if the name has already been processed
            if name not in seen_names:
                suggestion = {
                    "name": name,
                    "description": r.page_content.strip()
                }
                card_suggestions_list.append(suggestion)
                # Add the name to the set of processed names
                seen_names.add(name)

        print("Formatted Card Suggestions List:")
        print(card_suggestions_list)
            
        # Serialize the list of dictionaries into a JSON string
        card_suggestions_json = json.dumps({"card_suggestions": card_suggestions_list}, ensure_ascii=False)
        # Print the final JSON string for additional debugging (optional)
        print("Final Card Suggestions JSON:", card_suggestions_json)
        # Return the serialized JSON string
        return card_suggestions_json
        
    except Exception as e:
        print(f"Error formatting card suggestions: {e}")
        raise ValueError("Failed to format card suggestions.")
    
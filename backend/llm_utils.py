from pymongo import MongoClient
import json

from langchain_fireworks import ChatFireworks
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

# Model is configurable via FIREWORKS_MODEL (ksec secret / environments/*.yaml).
# Uses the chat endpoint: all Fireworks serverless models are chat models
# (supports_chat=true) and Meta Llama was retired from serverless. The old
# text-completion path (Fireworks) leaked reasoning/harmony tokens into output.
# Default is GPT-OSS 120B (cheapest available). https://fireworks.ai/models
llm = ChatFireworks(
        fireworks_api_key=os.environ.get("FIREWORKS_API_KEY"),
        model=os.environ.get("FIREWORKS_MODEL")
              or "accounts/fireworks/models/gpt-oss-120b",
        temperature=0.000001,
        # GPT-OSS reasoning tokens count against max_tokens; keep reasoning
        # low and leave enough budget for the full ~200-word explanation.
        max_tokens=700,
        model_kwargs={"top_p": 0.9, "reasoning_effort": "low"},
    )

# Embedding model - lazy initialization
_embedding_model = None
_vector_store = None

def get_embedding_model():
    """Lazy initialization of embedding model."""
    global _embedding_model
    if _embedding_model is None:
        voyage_api_key = os.environ.get("VOYAGE_API_KEY")
        if not voyage_api_key:
            raise ValueError(
                "VOYAGE_API_KEY environment variable is not set. "
                "Please set it in your .env file or environment variables."
            )
        _embedding_model = VoyageAIEmbeddings(
            voyage_api_key=voyage_api_key, 
            model="voyage-3-large"
        )
    return _embedding_model

def get_vector_store():
    """Lazy initialization of vector store."""
    global _vector_store
    if _vector_store is None:
        _vector_store = MongoDBAtlasVectorSearch(
            embedding=get_embedding_model(),
            collection=vcol,
            index_name="default"
        )
    return _vector_store

@lru_cache(1000000)
def invoke_llm(prompt):
    """
    Invoke the LLM with the given prompt with cache.

    Args:
        prompt (str): The prompt to pass to the LLM.
    """
    response = llm.invoke(prompt)
    return response.content

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


def _format_card_suggestions_json(card_docs, default_score=0.0):
    """Format card documents into the frontend contract.

    Expected input shape examples:
    - {"title": "Card Name", "text": "Description"}
    - {"name": "Card Name", "description": "Description"}
    """
    card_suggestions_list = []

    for doc in card_docs:
        title = (doc.get("title") or doc.get("name") or "Credit Card").strip()
        description = (doc.get("text") or doc.get("description") or "").strip()
        score = doc.get("score", default_score)

        if description:
            card_suggestions_list.append(
                {
                    "name": title,
                    "description": description,
                    "score": score,
                }
            )

    return json.dumps({"card_suggestions": card_suggestions_list}, ensure_ascii=False)


def _fallback_card_suggestions(limit=5):
    """Return deterministic fallback suggestions directly from MongoDB."""
    docs = list(vcol.find({}, {"_id": 0, "title": 1, "text": 1}).limit(limit))
    return _format_card_suggestions_json(docs, default_score=0.0)

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
        vector_store = get_vector_store()
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

        # Gracefully degrade when external vector search/embedding provider is unavailable
        # (e.g., invalid/forbidden API key from embedding provider).
        try:
            fallback_json = _fallback_card_suggestions(limit=5)
            print("Using MongoDB fallback suggestions due to vector retrieval failure.")
            return fallback_json
        except Exception as fallback_error:
            print(f"Fallback retrieval also failed: {fallback_error}")
            raise ValueError("Failed to retrieve relevant documents for card suggestions.")
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor, XGBClassifier
import numpy as np

from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.retrievers.multi_query import MultiQueryRetriever

from pymongo import MongoClient
from dotenv import load_dotenv
import os
import joblib
from glob import glob

from langchain.embeddings.huggingface import HuggingFaceInstructEmbeddings
from langchain.vectorstores import MongoDBAtlasVectorSearch
from langchain.chains import RetrievalQA

load_dotenv()

if __name__ == '__main__':
    
    MONGO_CONN = os.environ.get("MONGO_CONNECTION_STRING")
    client = MongoClient(MONGO_CONN)
    api_key = os.environ.get("OPENAI_API_KEY")
    col = client["bfsi-genai"]["credit_history"]
    vcol = client["bfsi-genai"]["cc_products"]

    llm = ChatOpenAI(temperature=0.2, openai_api_key=api_key, model_name="gpt-3.5-turbo")
    repo_id = "hkunlp/instructor-base"
    hf = HuggingFaceInstructEmbeddings(model_name=repo_id, cache_folder="tmp/")
    hf.embed_instruction = "Represent the document for retrieval of personalized credit cards:"
    vectorstore = MongoDBAtlasVectorSearch(vcol, hf)

    # LLM powered retriver for product suggestions
    retriever = vectorstore.as_retriever(search_type='similarity',search_kwargs={'k': 3})
    recommender_retriever = MultiQueryRetriever.from_llm(retriever=retriever,llm=llm)

    df = pd.DataFrame.from_records(col.find({}, {"_id":0,"Unnamed: 0":0}))

    # Separate target from predictors
    y = df.SeriousDlqin2yrs
    X = df.drop(['SeriousDlqin2yrs'], axis=1)

    if "../model/classifier.jlb" not in glob("../model/*"):
        # Divide data into training and validation subsets
        X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        model = XGBClassifier(learning_rate = 0.1, n_estimators = 1000, verbose = 1)
        model.fit(X_train, y_train)
        joblib.dump(model, "../model/classifier.jlb")
    else:
        print("\nclassifier.jlb already exist loading it\n")
        model = joblib.load("../model/classifier.jlb")

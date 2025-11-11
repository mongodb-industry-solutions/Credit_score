from pymongo import MongoClient
from pymongo.operations import SearchIndexModel
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_CONNECTION_STRING=os.environ.get("MONGO_CONNECTION_STRING")
MONGODB_DB=os.environ.get("MONGODB_DB")
MONGODB_COLLECTION=os.environ.get("MONGODB_COLLECTION")

def create_index():
    # Connect to your Atlas deployment
    uri = MONGO_CONNECTION_STRING
    client = MongoClient(uri)
    # Access your database and collection
    database = client[MONGODB_DB]
    collection = database[MONGODB_COLLECTION]
    # Create your index model, then create the search index
    search_index_model = SearchIndexModel(
        definition={
                "mappings": {
                    "dynamic": True,
                    "fields": {
                    "embedding": [
                        {
                        "dimensions": 1024,
                        "similarity": "euclidean",
                        "type": "knnVector"
                        }
                    ]
                    }
                }
                },
        name="default",
    )
    result = collection.create_search_index(model=search_index_model)
    print(result)
    
if __name__ == "__main__":
    create_index()
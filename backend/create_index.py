from pymongo import MongoClient
from pymongo.operations import SearchIndexModel
import os
import time
from dotenv import load_dotenv

from db_config import APP_NAME

load_dotenv()

MONGO_CONNECTION_STRING=os.environ.get("MONGO_CONNECTION_STRING")
MONGODB_DB=os.environ.get("MONGODB_DB")
MONGODB_COLLECTION=os.environ.get("MONGODB_COLLECTION")

# Must match the embedding model used in llm_utils.py (voyage-3-large).
EMBEDDING_DIMENSIONS = 1024


def create_index():
    # Connect to your Atlas deployment
    uri = MONGO_CONNECTION_STRING
    client = MongoClient(uri, appName=APP_NAME)
    # Access your database and collection
    database = client[MONGODB_DB]
    collection = database[MONGODB_COLLECTION]

    if any(i["name"] == "default" for i in collection.list_search_indexes()):
        print("Search index 'default' already exists; nothing to do.")
        return

    # Type must be "vectorSearch": langchain-mongodb queries with the
    # $vectorSearch aggregation stage, which does not work against the older
    # knnVector search-index format.
    search_index_model = SearchIndexModel(
        definition={
            "fields": [
                {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": EMBEDDING_DIMENSIONS,
                    "similarity": "euclidean",
                }
            ]
        },
        name="default",
        type="vectorSearch",
    )
    result = collection.create_search_index(model=search_index_model)
    print(result)

    # Index creation is asynchronous; queries fail until it is queryable.
    print("Waiting for the index to become queryable...")
    for _ in range(60):
        index = next(
            (i for i in collection.list_search_indexes() if i["name"] == "default"),
            None,
        )
        if index and index.get("queryable"):
            print("Index is ready.")
            return
        time.sleep(5)
    print("Index is still building. Check its status in the Atlas UI.")


if __name__ == "__main__":
    create_index()

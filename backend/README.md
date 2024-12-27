# Installation of the backend

These are some simple APIs built on Python.

## Getting Started

First, make sure that you have all of the requirements installed in your Python instance:

```bash
pip install -r requirements.txt
# or
pip3 install -r requirements.txt
```
Next, please make sure to add a .env file in the folder <location_of_your_repo>/Credit_score/backend. It should include the following:

```md
MONGO_CONNECTION_STRING=<Your_connection_string>
FIREWORKS_API_KEY=<Your_FIREWORKS_api_key>
MONGODB_DB=bfsi-genai 
```
> [!Warning]
> You only need to populate one of the API keys depending on which one you choose. As a reminder, you can also decide to use OpenAI but will require some light code changes. You will also need to use the file OpenAI.py instead of app.py.

Lastly, run the bankend services:

```bash
python credit_score_demo.py
# or
python3 credit_score_demo.py
# or if you are running it on a server
pm2 start credit_score_demo.py --interpreter=python3
```
> [!Note]
> If you want to deploy this on a server, then you will need to install pm2, on top of the requirements. You will also need to call the APIs with the server's API which will need to be updated on the <location_of_your_repo>/Credit_score/frontend/.env file.

You should have two APIs:
- http://localhost:8000/credit_score?userId=<id_of_the_user_you_want_recomendation_for>
- http://localhost:8000/product_suggestions

As a reminder, in this demo we use both AI as well as genAI. Below you can see the architecture of the first API. Simply put, we generate a custom prompt by enriching the existing information on the MongoDB database with the ML algorithm that we trained prior. This is then sent to the LLM to generate the explanation for the approval/rejection of the user's application.
![image](./Explainations.png)

The second API is slightly more complicated. Indeed, the user's profile from the previous API is sent into the second. Then a [MultiQueryRetriever](https://python.langchain.com/docs/modules/data_connection/retrievers/MultiQueryRetriever/) function allows us to effectively retrieve relevant information from our chunked credit card information database, before getting formatted and refined by the LLM.
![image](./Recomendations.png)

Once you have done everything, we can move on to the next part:
- [Installation of the frontend](../frontend/)
- Or go back [to the main page](../)
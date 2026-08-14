# AGENTS.md

Guidance for AI coding agents working in this repository.

Two services: a Python FastAPI backend that runs an XGBoost credit model and calls
Fireworks AI for explanations, and a Next.js frontend that talks to it only through
its own API proxy routes. MongoDB Atlas holds the applicant data and the card
catalogue, and Atlas Vector Search powers the card recommendations.

## Build and test commands

Backend (from `backend/`, Python 3.13):

```bash
brew install libomp                 # macOS only, required before installing xgboost
uv venv && uv sync                  # or: python3 -m venv .venv && .venv/bin/pip install .
.venv/bin/python create_index.py    # create the Atlas vector search index
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

Frontend (from `frontend/`, Node 20+):

```bash
npm install --legacy-peer-deps      # plain npm install and npm ci both fail
npx next dev --port 3000            # npm run dev uses 8080, which the backend owns
npm run build
npm run lint
```

Docker, both services together:

```bash
make build      # docker-compose up --build -d
make stop
make clean      # removes images and volumes
```

**There is no automated test suite in this repository.** No pytest, no jest, no
`npm test`. To verify a change, run `npm run lint` and `npm run build` for the
frontend, import the backend modules to catch errors, then exercise the app. Do not
claim tests pass — there are none.

Smoke check after a change:

```bash
curl http://localhost:8080/                                   # {"status":"Server is running!"}
curl http://localhost:8080/credit_score/8625                   # ML + LLM explanation
curl -X POST http://localhost:8080/user_data/find_one \
  -H 'Content-Type: application/json' -d '{"filter":{"Customer_ID":8625}}'
```

Then open the frontend and confirm both tabs render: **Status explanation** and
**Product recommendations**. The page shows "Loading..." until *both* the profile and
the explanation resolve, and the recommendations call must succeed for the page to
leave that state.

## Project structure

```
backend/
  main.py              FastAPI app, ML inference, all four endpoints
  llm_utils.py         Fireworks chat client, Voyage embeddings, vector store
  prompt_utils.py      Prompt templates
  stat_score_util.py   Weighted scorecard calculation
  db_config.py         APP_NAME — the Atlas appName, single source of truth
  create_index.py      Creates the vector search index
  dummy.py             PrepareDummyCols, needed to unpickle the model
  model/               Pickled XGBoost model, encoders, and dummy columns
frontend/
  pages/index.js       The whole demo UI, including the loading gate
  pages/api/           Proxy routes; the browser never calls the backend directly
  utils/api/           Client wrappers — use these instead of raw fetch
  components/          LeafyGreen UI components
data/                  Seed JSON, Extended JSON format
environments/          Kanopy deploy config for staging and prod
```

Notable files:

- [backend/db_config.py](./backend/db_config.py) — the only place `appName` is
  defined. Import it rather than hardcoding a string at a new `MongoClient` call.
- [backend/dummy.py](./backend/dummy.py) — `PrepareDummyCols` must stay importable at
  the same path or `model/classifier.jlb` cannot be unpickled.
- [frontend/pages/index.js](./frontend/pages/index.js) — the applicant ID is hardcoded
  to 8625.

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Health check |
| GET | `/credit_score/{user_id}` | Model prediction, credit limit, scorecard, LLM explanation |
| POST | `/product_suggestions` | Card recommendations via vector search plus LLM |
| POST | `/user_data/find_one` | Read one applicant |
| POST | `/user_data/update_one` | Update one applicant |

Frontend proxy routes mirror these under `/api/` with kebab-case names, for example
`/api/credit-score/[userId]` and `/api/product-suggestions`.

## Environment variables and configuration

`backend/.env`:

| Name | Required | Example | Description |
| --- | --- | --- | --- |
| `MONGO_CONNECTION_STRING` | yes | `mongodb+srv://…` | Atlas connection string |
| `MONGODB_DB` | yes | `credit_score` | Database holding `user_data` and the card collection |
| `MONGODB_COLLECTION` | yes | `vs_score` | Card catalogue collection, the one the vector index is on |
| `FIREWORKS_API_KEY` | yes | — | Fireworks AI key |
| `FIREWORKS_MODEL` | no | `accounts/fireworks/models/gpt-oss-120b` | Defaults to GPT-OSS 120B when unset |
| `VOYAGE_API_KEY` | yes | — | Must be issued by Voyage AI, not MongoDB |

`frontend/.env`:

| Name | Required | Example | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:8080` | Backend URL, embedded at build time |
| `NODE_ENV` | yes | `dev` | Environment name |
| `INTERNAL_API_URL` | no | `http://credit-scoring-backend:8080` | Server-side proxy target; takes precedence over `NEXT_PUBLIC_API_URL` |
| `NEXT_PUBLIC_CHART_URL` | no | — | Atlas Charts embed URL, optional |

Constraints worth knowing before you debug a failure:

- **Atlas is required.** The demo queries with `$vectorSearch`, which does not exist
  on a local `mongod`.
- **The vector index must be type `vectorSearch` with 1024 dimensions.** langchain-mongodb
  builds a `$vectorSearch` stage, so the older `knnVector` search-index format returns
  nothing, and 1024 is what `voyage-3-large` produces. A wrong index fails silently:
  the endpoint 500s with "Failed to retrieve relevant documents" and the UI never
  leaves "Loading...".
- **`VOYAGE_API_KEY` must come from Voyage AI.** The backend calls `api.voyageai.com`
  through `langchain_voyageai`. A key issued for MongoDB's embedding endpoints returns
  403 "This API key cannot access this endpoint".
- **Both services default to port 8080.** Run the frontend elsewhere when developing
  locally.
- **macOS needs `brew install libomp`** before xgboost will import.
- **`npm install` and `npm ci` both fail** on a LeafyGreen peer dependency conflict;
  use `--legacy-peer-deps`.
- **`docker-compose.yml` bind-mounts three `~/.aws` paths** that do not exist on a
  clean machine, and nothing in the backend uses AWS.
- **Seed data is Extended JSON.** Parse `data/*.json` with `bson.json_util.loads`, not
  `json.load`, or `_id` becomes a nested `{"$oid": …}` object instead of an ObjectId.

## MongoDB Skills

Use the official MongoDB agent skills from https://github.com/mongodb/agent-skills
whenever the task is MongoDB-specific and a matching skill exists.

## When To Use EDD.md

Use [EDD.md](./EDD.md) as the source of truth for the MongoDB data model in this repository.

Consult [EDD.md](./EDD.md) before making changes that touch:

- MongoDB collections, document structure, or field names
- FastAPI routes that read or write database records
- Validation, form fields, API payloads, or UI that depend on persisted data
- Schema documentation, Mermaid diagrams, or entity modeling discussions

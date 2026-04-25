# Skill Bridge FastAPI Backend

FastAPI backend scaffold for Skill Bridge. It exposes extraction and training search endpoints for the React frontend.

## Requirements

- Python 3.11+
- `pip`

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Update `.env` values:

- `GEMINI_API_KEY`
- `TAVILY_API_KEY`

## Run

From the `backend/` directory:

```bash
uvicorn main:app --reload
```

API base URL: `http://127.0.0.1:8000`

## Endpoints

### Health check

- `GET /health`

Response:

```json
{ "status": "ok" }
```

### Extract profile

- `POST /api/extract`

Request body:

```json
{
  "narrative": "I repaired mobile phones and managed a small electronics shop.",
  "locale": "gh"
}
```

Response shape:

```json
{
  "user_skills": [
    {
      "label": "Mobile Device Repair",
      "isco_code": "7421",
      "esco_code": "esco:example",
      "status": "Durable"
    }
  ],
  "matches": [
    {
      "title": "Electronics Technician",
      "wage_floor": "GHS 1850",
      "growth_percent": "+3.8%",
      "match_strength": 84
    }
  ]
}
```

### Search training opportunities

- `POST /api/opportunities/search`

Request body:

```json
{
  "skill": "Mobile Device Repair",
  "location": "Accra"
}
```

Response shape:

```json
[
  {
    "name": "Example Training Center",
    "type": "Training Center",
    "cost": "Contact provider",
    "distance": "Near Accra"
  }
]
```

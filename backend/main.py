import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env from the backend/ directory regardless of where uvicorn is launched from
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

try:
    from .routers.api import router as api_router
    from .services import assessment_persistence
except (ImportError, ModuleNotFoundError):
    from routers.api import router as api_router
    from services import assessment_persistence

app = FastAPI(title="Skill Bridge API")


@app.on_event("startup")
def _init_assessment_db() -> None:
    assessment_persistence.init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

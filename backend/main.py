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


def _cors_config() -> dict:
    """Local dev + optional CORS_ORIGINS + regex for Vercel (*.vercel.app)."""
    origins = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    extra = os.getenv("CORS_ORIGINS", "").strip()
    if extra:
        origins.extend(o.strip() for o in extra.split(",") if o.strip())
    cfg: dict = {
        "allow_origins": origins,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    rx = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app").strip()
    if rx:
        cfg["allow_origin_regex"] = rx
    return cfg


app.add_middleware(CORSMiddleware, **_cors_config())

app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

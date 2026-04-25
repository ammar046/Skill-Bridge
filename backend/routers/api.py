from fastapi import APIRouter, HTTPException

try:
    from ..models.schemas import (
        MarketSignalsRequest,
        MarketSignalsResponse,
        OpportunitySearchRequest,
        ProfileResponse,
        TrainingProvider,
        UserNarrativeRequest,
    )
    from ..services.ai_engine import extract_skills
    from ..services.search_engine import find_market_signals, find_training
except (ImportError, ModuleNotFoundError):
    from models.schemas import (
        MarketSignalsRequest,
        MarketSignalsResponse,
        OpportunitySearchRequest,
        ProfileResponse,
        TrainingProvider,
        UserNarrativeRequest,
    )
    from services.ai_engine import extract_skills
    from services.search_engine import find_market_signals, find_training

router = APIRouter(prefix="/api", tags=["api"])


@router.post("/extract", response_model=ProfileResponse)
def extract_profile(payload: UserNarrativeRequest) -> ProfileResponse:
    try:
        return extract_skills(payload.narrative, payload.locale)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}") from exc


@router.post("/opportunities/search", response_model=list[TrainingProvider])
def search_opportunities(payload: OpportunitySearchRequest) -> list[TrainingProvider]:
    try:
        return find_training(payload.skill, payload.location)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}") from exc


@router.post("/market-signals", response_model=MarketSignalsResponse)
def market_signals(payload: MarketSignalsRequest) -> MarketSignalsResponse:
    try:
        return find_market_signals(payload.skill, payload.location)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Market signals failed: {exc}") from exc

from fastapi import APIRouter, HTTPException

try:
    from ..config.loader import get_econometric_signal, get_locale
    from ..models.schemas import (
        IndicatorValue,
        MarketSignalsRequest,
        MarketSignalsResponse,
        OpportunitySearchRequest,
        PolicymakerLiveStats,
        PolicymakerLocaleStats,
        ProfileResponse,
        TrainingProvider,
        UserNarrativeRequest,
    )
    from ..services.ai_engine import extract_skills
    from ..services.institutional_data import get_live_indicators
    from ..services.search_engine import find_market_signals, find_training
    from ..services.skill_enricher import enrich_profile
except (ImportError, ModuleNotFoundError):
    from config.loader import get_econometric_signal, get_locale
    from models.schemas import (
        IndicatorValue,
        MarketSignalsRequest,
        MarketSignalsResponse,
        OpportunitySearchRequest,
        PolicymakerLiveStats,
        PolicymakerLocaleStats,
        ProfileResponse,
        TrainingProvider,
        UserNarrativeRequest,
    )
    from services.ai_engine import extract_skills
    from services.institutional_data import get_live_indicators
    from services.search_engine import find_market_signals, find_training
    from services.skill_enricher import enrich_profile

router = APIRouter(prefix="/api", tags=["api"])


@router.post("/extract", response_model=ProfileResponse)
def extract_profile(payload: UserNarrativeRequest) -> ProfileResponse:
    """
    Full pipeline:
      1. Gemini extracts skills + ISCO codes + user_city from narrative.
      2. skill_enricher looks up real Frey-Osborne (2013) scores per ISCO code.
      3. skill_enricher runs Tavily search for the user's specific city to ground resilience_note.
      4. Returns enriched ProfileResponse — no guessed scores, no generic notes.
    """
    try:
        profile, gemini_city = extract_skills(payload.narrative, payload.locale)
        # User's explicitly entered region always wins over Gemini's guess
        user_city = payload.region.strip() or gemini_city or "the region"
        enriched = enrich_profile(profile, user_city, payload.locale)
        enriched.user_city = user_city
        return enriched
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


@router.get("/policymaker/{locale_code}", response_model=PolicymakerLiveStats)
def policymaker_stats(locale_code: str) -> PolicymakerLiveStats:
    """
    Returns live-fetched econometric data for the Policymaker Dashboard.
    Tier 1: World Bank WDI (live via wbgapi)
    Tier 2: ILOSTAT published baselines (clearly attributed)
    Tier 3: Wittgenstein Centre projections (published)
    Every value includes source attribution — no synthetic data.
    """
    try:
        locale = get_locale(locale_code)
        signal = get_econometric_signal(locale_code)
        live = get_live_indicators(locale_code)
        edu = locale["education_taxonomy"]
        ilo = locale["ilo_econometrics"]
        wit = locale["wittgenstein_projections"]
        fo = locale["frey_osborne_lmic_calibration"]

        def iv(d: dict) -> IndicatorValue:
            return IndicatorValue(
                value=d.get("value"),
                source=d.get("source", ""),
                year=d.get("year"),
                live=d.get("live", False),
                label=d.get("label", ""),
                available=d.get("available", d.get("value") is not None),
            )

        top_sectors_with_source = [
            {**s, "source": "ILOSTAT sector employment projections 2024 · Wittgenstein Centre SSP2"}
            for s in signal["top_growth_sectors"]
        ]

        return PolicymakerLiveStats(
            locale_code=locale["code"],
            country=locale["country"],
            context=locale["context"],
            fetched_at=live["_meta"]["fetched_at"],
            live_indicators_count=live["_meta"].get("live_count", 0),
            hci_score=iv(live["hci_score"]),
            gross_secondary_enrollment_pct=iv(live["gross_secondary_enrollment_pct"]),
            internet_penetration_pct=iv(live["internet_penetration_pct"]),
            neet_rate_pct=iv(live["neet_rate_pct"]),
            vulnerable_employment_pct=iv(live["vulnerable_employment_pct"]),
            gdp_per_capita_ppp=iv(live["gdp_per_capita_ppp"]),
            output_per_worker_usd=iv(live["output_per_worker_usd"]),
            wage_floor_local=iv(live["wage_floor_local"]),
            wage_floor_usd_ppp=iv(live["wage_floor_usd_ppp"]),
            automation_delay_years=iv(live["automation_delay_years"]),
            wittgenstein_note=wit.get("note", ""),
            wittgenstein_source=live["wittgenstein"].get("source", ""),
            frey_osborne_calibration=fo.get("calibration_note", ""),
            tvet_name=edu["name"],
            rpl_uptake_pct=edu["rpl_uptake_pct"],
            districts=locale["districts"],
            policy_insights=locale["policy_insights"],
            top_growth_sectors=top_sectors_with_source,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Policymaker stats failed: {exc}") from exc

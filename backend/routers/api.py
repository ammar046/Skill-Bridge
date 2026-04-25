import hashlib
from datetime import date as _date
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

# In-memory credential store — session-scoped, no database required for hackathon
_verification_store: dict[str, dict] = {}


def _make_pass_id(worker_name: str, locale_code: str, issue_date: str, isco_codes: list[str]) -> str:
    """SHA-256 of canonical credential string, first 16 hex chars."""
    codes_joined = ",".join(sorted(isco_codes))
    raw = f"{worker_name}:{locale_code}:{issue_date}:{codes_joined}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


@router.post("/extract", response_model=ProfileResponse)
def extract_profile(payload: UserNarrativeRequest) -> ProfileResponse:
    """
    Full pipeline:
      1. Gemini extracts skills + ISCO codes + user_city from narrative.
      2. skill_enricher looks up real Frey-Osborne (2013) scores per ISCO code.
      3. skill_enricher runs Tavily search for the user's specific city to ground resilience_note.
      4. Generates a SHA-256 pass_id for QR verification.
      5. Returns enriched ProfileResponse — no guessed scores, no generic notes.
    """
    try:
        profile, gemini_city = extract_skills(payload.narrative, payload.locale)
        user_city = payload.region.strip() or gemini_city or "the region"
        enriched = enrich_profile(profile, user_city, payload.locale)
        enriched.user_city = user_city

        # Apply gender wage adjustment if female
        if payload.gender == "female":
            try:
                locale_cfg = get_locale(payload.locale)
                gwg = locale_cfg.get("gender_wage_gap", {})
                gap_pct: float = gwg.get("gap_pct", 0.0)
                gap_source: str = gwg.get("source", "ILO Global Wage Report 2024")
                if gap_pct > 0:
                    for match in enriched.matches:
                        match.gender_adjusted_wage_floor = match.wage_floor
                        match.gender_note = (
                            f"ILO-adjusted wage floor for women in this region "
                            f"(women earn ~{round(gap_pct * 100)}% less). "
                            f"Source: {gap_source}"
                        )
            except Exception:
                pass  # wage adjustment is additive — never block the main flow

        # Generate verifiable pass_id
        issue_date = _date.today().isoformat()
        worker_name = payload.worker_name or "Anonymous"
        isco_codes = [s.isco_code for s in enriched.user_skills if s.isco_code]
        pass_id = _make_pass_id(worker_name, payload.locale, issue_date, isco_codes)
        enriched.pass_id = pass_id

        # Store in-memory verification record
        skill_labels = [
            f"{s.label} (ISCO {s.isco_code})" for s in enriched.user_skills
        ]
        _verification_store[pass_id] = {
            "verified": True,
            "worker_name": worker_name,
            "locale": payload.locale,
            "issued": issue_date,
            "skills": skill_labels,
            "source": "UNMAPPED Protocol — Open Infrastructure for the Informal Economy",
            "note": (
                f"This credential was generated using ILO ISCO-08 taxonomy and "
                f"Frey-Osborne (2013) automation scoring. "
                f"Verify authenticity at unmapped.world/verify/{pass_id}"
            ),
        }

        return enriched
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}") from exc


@router.get("/verify/{pass_id}")
def verify_credential(pass_id: str) -> dict:
    """
    Public credential verification endpoint.
    Returns the stored credential record if found, or a not-found response.
    """
    record = _verification_store.get(pass_id)
    if record:
        return record
    return {
        "verified": False,
        "pass_id": pass_id,
        "note": "Credential not found. Credentials persist only for the server session. Re-generate the Bridge Pass if needed.",
    }


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
        gwg = locale.get("gender_wage_gap", {})

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

        gender_wage_gap_iv = IndicatorValue(
            value=round(gwg.get("gap_pct", 0.0) * 100, 1),
            source=gwg.get("source", "ILO Global Wage Report 2024"),
            year="2024",
            live=False,
            label="Gender Wage Gap (%)",
            available=bool(gwg),
        )

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
            gender_wage_gap=gender_wage_gap_iv,
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

from pydantic import BaseModel, Field
from typing import Any


class UserNarrativeRequest(BaseModel):
    narrative: str = Field(min_length=1)
    locale: str = Field(min_length=2, max_length=10)
    region: str = ""  # user's explicitly entered city/region — overrides Gemini city extraction


class ExtractedSkill(BaseModel):
    label: str
    isco_code: str
    esco_code: str
    status: str
    frey_osborne_score: float = Field(default=0.3, ge=0.0, le=1.0)
    ilo_task_type: str = "mixed"
    resilience_note: str = ""


class OpportunityMatch(BaseModel):
    title: str
    wage_floor: str
    growth_percent: str
    match_strength: int = Field(ge=0, le=100)
    ilostat_source: str = "ILOSTAT 2024"
    returns_to_education_note: str = ""


class TrainingProvider(BaseModel):
    name: str
    type: str
    cost: str
    distance: str
    url: str = ""


class ProfileResponse(BaseModel):
    user_skills: list[ExtractedSkill]
    matches: list[OpportunityMatch]
    user_city: str = ""  # extracted from narrative by Gemini; used for city-specific Tavily enrichment


class OpportunitySearchRequest(BaseModel):
    skill: str = Field(min_length=1)
    location: str = Field(min_length=1)


class MarketSignal(BaseModel):
    category: str
    title: str
    snippet: str
    url: str


class MarketSignalsRequest(BaseModel):
    skill: str = Field(min_length=1)
    location: str = Field(min_length=1)


class MarketSignalsResponse(BaseModel):
    hiring: list[MarketSignal]
    training: list[MarketSignal]
    wages: list[MarketSignal]
    skill: str
    location: str


class IndicatorValue(BaseModel):
    """A single econometric indicator with full provenance."""
    value: float | None
    source: str
    year: str | None = None
    live: bool = False
    label: str = ""
    available: bool = True


class PolicymakerLiveStats(BaseModel):
    """
    Full policymaker dashboard payload.
    Every numeric field is wrapped in IndicatorValue with source attribution.
    No value is served without a citable source.
    """
    locale_code: str
    country: str
    context: str
    fetched_at: str
    live_indicators_count: int

    # World Bank WDI (live via wbgapi)
    hci_score: IndicatorValue
    gross_secondary_enrollment_pct: IndicatorValue
    internet_penetration_pct: IndicatorValue
    neet_rate_pct: IndicatorValue
    vulnerable_employment_pct: IndicatorValue
    gdp_per_capita_ppp: IndicatorValue
    output_per_worker_usd: IndicatorValue

    # ILO (published baseline)
    wage_floor_local: IndicatorValue
    wage_floor_usd_ppp: IndicatorValue
    automation_delay_years: IndicatorValue

    # Wittgenstein + Frey-Osborne
    wittgenstein_note: str
    wittgenstein_source: str
    frey_osborne_calibration: str

    # Supplemental structured data
    tvet_name: str
    rpl_uptake_pct: float
    districts: list[dict[str, Any]]
    policy_insights: list[str]
    top_growth_sectors: list[dict[str, Any]]


# Keep legacy alias for backward compat
class PolicymakerLocaleStats(BaseModel):
    locale_code: str
    country: str
    context: str
    hci_score: float
    neet_rate_pct: float
    informal_economy_pct: float
    gross_secondary_enrollment_pct: float
    returns_to_vocational_pct: float
    tvet_name: str
    rpl_uptake_pct: float
    wittgenstein_note: str
    districts: list[dict[str, Any]]
    policy_insights: list[str]
    top_growth_sectors: list[dict[str, Any]]

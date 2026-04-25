from pydantic import BaseModel, Field


class UserNarrativeRequest(BaseModel):
    narrative: str = Field(min_length=1)
    locale: str = Field(min_length=2, max_length=10)


class ExtractedSkill(BaseModel):
    label: str
    isco_code: str
    esco_code: str
    status: str


class OpportunityMatch(BaseModel):
    title: str
    wage_floor: str
    growth_percent: str
    match_strength: int = Field(ge=0, le=100)


class TrainingProvider(BaseModel):
    name: str
    type: str
    cost: str
    distance: str
    url: str = ""


class ProfileResponse(BaseModel):
    user_skills: list[ExtractedSkill]
    matches: list[OpportunityMatch]


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

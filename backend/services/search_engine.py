import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import HTTPException
from tavily import TavilyClient

try:
    from ..models.schemas import MarketSignal, MarketSignalsResponse, TrainingProvider
except (ImportError, ModuleNotFoundError):
    from models.schemas import MarketSignal, MarketSignalsResponse, TrainingProvider

load_dotenv()


# ─── Pure query-builder functions (no Tavily import, no side effects) ─────────

def build_hiring_query(isco_label: str, city: str, locale_code: str) -> str:
    """Build a city- and role-specific hiring demand query."""
    year = datetime.utcnow().year
    first_word = isco_label.split()[0] if isco_label else ""
    return (
        f'"{isco_label}" OR "{first_word}" jobs hiring demand '
        f'"{city}" {locale_code.upper()} {year} employment'
    )


def build_training_query(isco_label: str, city: str) -> str:
    """Build a city-specific training provider query."""
    first_word = isco_label.split()[0] if isco_label else ""
    return (
        f'vocational training "{isco_label}" OR "{first_word}" '
        f'course certificate "{city}" TVET NGO skills program'
    )


def build_wage_query(isco_label: str, city: str) -> str:
    """Build a city-specific wage/day-rate query."""
    year = datetime.utcnow().year
    first_word = isco_label.split()[0] if isco_label else ""
    return (
        f'"{isco_label}" OR "{first_word}" salary "per month" OR "per day" informal '
        f'"{city}" {year} wage earnings'
    )


def _client() -> TavilyClient:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="TAVILY_API_KEY is not configured.")
    return TavilyClient(api_key=api_key)


def _infer_provider_type(name: str, url: str) -> str:
    text = f"{name} {url}".lower()
    if any(t in text for t in ["university", "college", "institute", "polytechnic"]):
        return "Institution"
    if any(t in text for t in ["bootcamp", "academy", "hub"]):
        return "Bootcamp"
    if "online" in text:
        return "Online"
    return "Training Center"


def _estimate_cost(snippet: str) -> str:
    lower = (snippet or "").lower()
    if "free" in lower or "scholarship" in lower:
        return "Free / Sponsored"
    if any(t in lower for t in ["low-cost", "affordable", "subsidized"]):
        return "Low cost"
    return "Contact provider"


def _site_name_from_url(url: str) -> str:
    parsed = urlparse(url or "")
    host = parsed.netloc.replace("www.", "") if parsed.netloc else ""
    return host or "Unknown provider"


def find_training(skill: str, location: str) -> list[TrainingProvider]:
    client = _client()
    query = build_training_query(isco_label=skill, city=location)

    try:
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=6,
            include_answer=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Tavily request failed: {exc}") from exc

    results = response.get("results", []) if isinstance(response, dict) else []
    providers: list[TrainingProvider] = []

    for item in results:
        title = (item.get("title") or "").strip()
        snippet = (item.get("content") or "").strip()
        url = (item.get("url") or "").strip()
        name = title or _site_name_from_url(url)
        providers.append(
            TrainingProvider(
                name=name,
                type=_infer_provider_type(name, url),
                cost=_estimate_cost(snippet),
                distance=f"Near {location.strip()}" if location.strip() else "Unknown distance",
                url=url,
            )
        )

    return providers


def _run_tavily_query(
    client: TavilyClient,
    category: str,
    query: str,
    max_results: int = 4,
) -> list[MarketSignal]:
    try:
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=max_results,
            include_answer=False,
        )
    except Exception:
        return []

    results = response.get("results", []) if isinstance(response, dict) else []
    signals: list[MarketSignal] = []
    for item in results:
        title = (item.get("title") or "").strip()
        snippet = (item.get("content") or "")[:300].strip()
        url = (item.get("url") or "").strip()
        if title:
            signals.append(
                MarketSignal(
                    category=category,
                    title=title,
                    snippet=snippet,
                    url=url,
                )
            )
    return signals


def find_market_signals(skill: str, location: str, locale_code: str = "") -> MarketSignalsResponse:
    client = _client()

    queries = {
        "hiring": build_hiring_query(isco_label=skill, city=location, locale_code=locale_code),
        "training": build_training_query(isco_label=skill, city=location),
        "wages": build_wage_query(isco_label=skill, city=location),
    }

    results: dict[str, list[MarketSignal]] = {"hiring": [], "training": [], "wages": []}

    with ThreadPoolExecutor(max_workers=3) as executor:
        future_map = {
            executor.submit(_run_tavily_query, client, category, query): category
            for category, query in queries.items()
        }
        for future in as_completed(future_map):
            category = future_map[future]
            try:
                results[category] = future.result()
            except Exception:
                results[category] = []

    return MarketSignalsResponse(
        hiring=results["hiring"],
        training=results["training"],
        wages=results["wages"],
        skill=skill,
        location=location,
    )

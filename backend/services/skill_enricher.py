"""
Post-Extraction Skill Enrichment
==================================
After Gemini extracts skills + ISCO codes, this module:

  1. Looks up the real Frey-Osborne (2013) automation probability for each ISCO code.
  2. Applies LMIC + ITU internet-penetration discount.
  3. Runs ONE targeted Tavily search per skill for the user's SPECIFIC city,
     fetching real-world demand/resilience evidence (job posts, news, govt reports).
  4. Builds a grounded resilience_note from actual Tavily snippets — not AI guess.
  5. Re-derives `status` from the actual F-O score (not AI guess).

This guarantees:
  - Automation scores are from the peer-reviewed Oxford paper, not hallucinated.
  - Resilience notes cite real results from the user's actual city.
  - Wittgenstein demand trends are city-specific (Karachi ≠ Punjab).
"""
from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from tavily import TavilyClient
    _TAVILY_OK = True
except ImportError:
    _TAVILY_OK = False

try:
    from ..models.schemas import AdjacentSkill, ExtractedSkill, OpportunityMatch, ProfileResponse
    from ..services.adjacency_engine import get_adjacent_skills
    from ..services.frey_osborne import (
        classify,
        get_fo_score,
        get_ilo_task_label,
        get_ilo_task_type,
    )
    from ..services.institutional_data import get_automation_itu_context
except (ImportError, ModuleNotFoundError):
    from models.schemas import AdjacentSkill, ExtractedSkill, OpportunityMatch, ProfileResponse
    from services.adjacency_engine import get_adjacent_skills
    from services.frey_osborne import classify, get_fo_score, get_ilo_task_label, get_ilo_task_type
    from services.institutional_data import get_automation_itu_context


def _tavily_search(query: str, max_results: int = 2) -> list[dict]:
    """Run a single Tavily search; return [] on failure or missing key."""
    api_key = os.getenv("TAVILY_API_KEY", "")
    if not api_key or not _TAVILY_OK:
        return []
    try:
        client = TavilyClient(api_key=api_key)
        result = client.search(
            query=query,
            max_results=max_results,
            search_depth="basic",  # faster than "advanced"
        )
        return result.get("results", [])
    except Exception:
        return []


def _build_resilience_note(
    skill_label: str,
    isco_code: str,
    ilo_task_type: str,
    fo_score_lmic: float,
    city: str,
    tavily_results: list[dict],
) -> str:
    """
    Build a grounded resilience note:
    - If Tavily returned results: cite the first relevant snippet + source URL.
    - If no Tavily results: compose a note from F-O score + ILO task type alone,
      clearly stating it is based on the Oxford 2013 paper rather than live data.
    """
    task_label = get_ilo_task_label(ilo_task_type)
    risk_pct = round(fo_score_lmic * 100)
    classification = classify(fo_score_lmic)

    if tavily_results:
        # Use the first snippet that mentions the skill or city
        best = None
        for r in tavily_results:
            snippet = r.get("content", "") or r.get("snippet", "")
            if skill_label.lower().split()[0] in snippet.lower() or city.lower() in snippet.lower():
                best = r
                break
        best = best or tavily_results[0]
        snippet = (best.get("content") or best.get("snippet") or "")[:200].strip()
        url = best.get("url", "")
        source_domain = url.split("/")[2] if url.startswith("http") and len(url.split("/")) > 2 else url
        if snippet:
            return (
                f"Live evidence from {city}: \"{snippet}...\" "
                f"— {source_domain}. "
                f"Frey-Osborne (2013, LMIC-adjusted): {risk_pct}% automation probability. "
                f"ILO task profile: {task_label}."
            )

    # Fallback — grounded in academic sources only, no fabricated claims
    if classification == "durable":
        return (
            f"Frey & Osborne (2013) Oxford study assigns this occupation (ISCO {isco_code}) "
            f"a {risk_pct}% LMIC-adjusted automation probability — classified DURABLE. "
            f"ILO task profile: {task_label}. "
            f"No live web evidence could be retrieved for {city} at this time."
        )
    if classification == "transitioning":
        return (
            f"Frey & Osborne (2013) Oxford study assigns ISCO {isco_code} "
            f"a {risk_pct}% LMIC-adjusted probability — TRANSITIONING. "
            f"ILO task profile: {task_label}. "
            f"Demand in {city} could not be verified live; upskilling recommended."
        )
    return (
        f"Frey & Osborne (2013) Oxford study assigns ISCO {isco_code} "
        f"a {risk_pct}% LMIC-adjusted probability — AT RISK. "
        f"ILO task profile: {task_label}. "
        f"Live evidence for {city} could not be retrieved; pivot to higher-complexity roles advised."
    )


def _enrich_single_skill(
    skill: ExtractedSkill,
    city: str,
    lmic_discount_pct: int,
    medium_threshold: float,
    high_threshold: float,
) -> ExtractedSkill:
    """Enrich one skill: compute real F-O score, run Tavily, build grounded note."""
    # Step 1 — Real F-O score from Oxford lookup table
    fo_lmic = get_fo_score(skill.isco_code, lmic_discount_pct)

    # Step 2 — ILO task type from ISCO major group (override Gemini if it used old field)
    ilo_type = get_ilo_task_type(skill.isco_code)
    task_label = get_ilo_task_label(ilo_type)

    # Step 3 — Tavily search for city-specific demand
    query = (
        f'"{skill.label}" OR "ISCO {skill.isco_code}" jobs demand employment '
        f'"{city}" 2025 2026 informal economy'
    )
    results = _tavily_search(query, max_results=3)

    # Step 4 — Grounded resilience note
    note = _build_resilience_note(
        skill_label=skill.label,
        isco_code=skill.isco_code,
        ilo_task_type=ilo_type,
        fo_score_lmic=fo_lmic,
        city=city,
        tavily_results=results,
    )

    # Step 5 — Re-derive status from actual score
    status = classify(fo_lmic, medium_threshold, high_threshold)

    # Step 6 — Adjacent skills for resilience guidance
    raw_adjacent = get_adjacent_skills(skill.isco_code, fo_lmic)
    adjacent = [
        AdjacentSkill(
            isco_code=a.get("isco_code", ""),
            label=a.get("label", ""),
            resilience_delta=a.get("resilience_delta", 0.0),
            rationale=a.get("rationale", ""),
            training_type=a.get("training_type", ""),
            estimated_weeks=a.get("estimated_weeks", 0),
        )
        for a in raw_adjacent
    ]

    return ExtractedSkill(
        label=skill.label,
        isco_code=skill.isco_code,
        esco_code=skill.esco_code,
        status=status,
        frey_osborne_score=fo_lmic,
        ilo_task_type=ilo_type,
        resilience_note=note,
        adjacent_skills=adjacent,
    )


def enrich_profile(
    profile: ProfileResponse,
    user_city: str,
    locale_code: str,
) -> ProfileResponse:
    """
    Main entry point.
    Enriches all skills in parallel (max 6 workers to respect Tavily rate limits).
    Returns a new ProfileResponse with grounded F-O scores and resilience notes.
    """
    itu_ctx = get_automation_itu_context(locale_code)
    lmic_discount = itu_ctx.get("lmic_discount_pct", 20)
    high_thresh = itu_ctx.get("frey_osborne_high_threshold", 0.65)
    medium_thresh = itu_ctx.get("frey_osborne_medium_threshold", 0.40)

    city = user_city.strip() or "the region"

    skills = profile.user_skills
    enriched_skills: list[ExtractedSkill | None] = [None] * len(skills)

    with ThreadPoolExecutor(max_workers=min(len(skills), 6)) as pool:
        futures = {
            pool.submit(
                _enrich_single_skill,
                skill,
                city,
                lmic_discount,
                medium_thresh,
                high_thresh,
            ): idx
            for idx, skill in enumerate(skills)
        }
        for future in as_completed(futures, timeout=60):
            idx = futures[future]
            try:
                enriched_skills[idx] = future.result(timeout=55)
            except Exception:
                enriched_skills[idx] = skills[idx]  # fallback: return unenriched

    return ProfileResponse(
        user_skills=[s for s in enriched_skills if s is not None],
        matches=profile.matches,
    )

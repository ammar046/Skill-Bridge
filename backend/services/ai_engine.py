"""
Skill extraction engine — powered by Google Gemini.

Gemini's role is ONLY:
  1. Parse the narrative and identify real skills
  2. Map each skill to the correct ISCO-08 4-digit code
  3. Classify ILO task type (cognitive / manual / routine)
  4. Extract the user's city from the narrative

Gemini does NOT guess Frey-Osborne scores — those come from the
Oxford 2013 lookup table in services/frey_osborne.py.
Resilience notes are grounded by Tavily live search in services/skill_enricher.py.
"""
import json
import os
import re

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import types as genai_types

try:
    from ..config.loader import get_econometric_signal
    from ..models.schemas import ExtractedSkill, OpportunityMatch, ProfileResponse
    from ..services.institutional_data import get_automation_itu_context
except (ImportError, ModuleNotFoundError):
    from config.loader import get_econometric_signal
    from models.schemas import ExtractedSkill, OpportunityMatch, ProfileResponse
    try:
        from services.institutional_data import get_automation_itu_context
    except Exception:
        def get_automation_itu_context(locale: str) -> dict:  # type: ignore[misc]
            return {}

load_dotenv()

# ─── System prompt ────────────────────────────────────────────────────────────
# Gemini is instructed to:
#   - extract the user's city from the narrative (for Tavily enrichment)
#   - assign ISCO-08 codes (not invent F-O scores)
#   - classify ILO task type only
#   - generate opportunities grounded in locale sector data
_SYSTEM_PROMPT_TEMPLATE = """
You are the UNMAPPED Skills Intelligence Engine — built for the World Bank UNMAPPED Protocol.

YOUR JOB:
1. Read the worker's narrative carefully.
2. Extract 3–6 real skills they have demonstrated.
3. Map each skill to the correct 4-digit ISCO-08 occupation code (mandatory).
4. Classify the ILO task type: "non_routine_cognitive" | "routine_cognitive" | "non_routine_manual_interpersonal" | "non_routine_manual_technical" | "routine_manual"
5. Extract the user's city/location from the narrative text (e.g. "Karachi", "Accra", "Kumasi"). If unclear, use the country capital.
6. Generate 2–3 job/opportunity matches grounded in the sectors below.

DO NOT GUESS automation scores — they are computed separately from the Frey-Osborne (2013) Oxford lookup table.

LIVE ECONOMETRIC CONTEXT (World Bank WDI · ILOSTAT 2024):
- Region: {context}
- Internet penetration: {internet_pct:.1f}% (ITU via World Bank WDI {internet_year})
  → Automation deployment delay vs OECD: ~{itu_delay} year(s)
- Wage floor (ILOSTAT 2024): {currency} {wage_floor}/month = {wage_floor_usd_ppp} USD PPP
- Informal economy share: {informal_economy_share_pct}%
- World Bank HCI: {hci_score}/1.0
- TVET system: {tvet_name} (RPL available: {rpl_pathway_exists})
- Top growth sectors by Wittgenstein 2025-2035 + ILOSTAT projections:
{top_sectors_text}
- ISCO codes durable in this LMIC context: {durable_isco_codes}
- ISCO codes at risk: {at_risk_isco_codes}

ILO TASK TYPE DEFINITIONS (ILO Future of Work 2020):
- non_routine_cognitive: planning, creativity, judgment, problem-solving (LOW automation risk)
- routine_cognitive: rule-following, data entry, pattern-matching (HIGH automation risk)
- non_routine_manual_interpersonal: personal care, teaching, social work (LOW risk — hard to automate)
- non_routine_manual_technical: craft, repair, trades — requires physical dexterity + judgment (MEDIUM risk)
- routine_manual: repetitive assembly, sorting, physical tasks (HIGH automation risk)

OPPORTUNITY MATCHING:
- Use wage floor from ILOSTAT above, adjusted for skill level
- Use growth_percent from the sector data above (do not invent numbers)
- ilostat_source: cite "ILOSTAT 2024" or "World Bank STEP 2023"

Return ONLY a raw JSON object — no markdown fences, no explanation, no trailing text:
{{"user_city":"<city>","skills":[{{"label":"<name>","isco_code":"<4-digit>","esco_code":"","ilo_task_type":"non_routine_manual_technical","resilience_placeholder":"<12 words max: demand signal for this skill in the user city>"}}],"opportunities":[{{"title":"<role>","wage_floor":"<{currency} amount>","growth_percent":"<pct>","match_strength":<int>,"ilostat_source":"ILOSTAT 2024","returns_to_education_note":"<10 words max>"}}]}}
""".strip()


def _build_system_prompt(signal: dict, itu_ctx: dict) -> str:
    top_sectors_text = "\n".join(
        f"  * {s['sector'].replace('_', ' ')}: +{s['growth_pct']}%/yr, {s['demand_gap_pct']}% demand gap"
        for s in signal["top_growth_sectors"]
    )
    return _SYSTEM_PROMPT_TEMPLATE.format(
        context=signal["context"],
        internet_pct=itu_ctx.get("internet_penetration_pct") or 50.0,
        internet_year=itu_ctx.get("internet_source", "ITU 2024").split("·")[0].strip(),
        itu_delay=itu_ctx.get("automation_delay_years", 0),
        currency=signal["currency"],
        wage_floor=signal["wage_floor"],
        wage_floor_usd_ppp=signal["wage_floor_usd_ppp"],
        informal_economy_share_pct=signal["informal_economy_share_pct"],
        hci_score=signal["hci_score"],
        tvet_name=signal["tvet_name"],
        rpl_pathway_exists=signal["rpl_pathway_exists"],
        top_sectors_text=top_sectors_text,
        durable_isco_codes=", ".join(signal["durable_isco_codes"]),
        at_risk_isco_codes=", ".join(signal["at_risk_isco_codes"]),
    )


def _extract_json_text(raw: str) -> str:
    """Strip markdown fences and extract the first complete JSON object."""
    raw = raw.strip()
    raw = re.sub(r"```[a-zA-Z]*\n?", "", raw)
    raw = raw.replace("```", "").strip()

    start = raw.find("{")
    if start == -1:
        raise ValueError("No JSON object found in Gemini response.")

    depth = 0
    for i, ch in enumerate(raw[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return raw[start: i + 1]

    raise ValueError("Incomplete JSON object — response was truncated.")


def extract_skills(narrative: str, locale: str) -> tuple[ProfileResponse, str]:
    """
    Returns (ProfileResponse, user_city).
    F-O scores are NOT assigned here — they are computed by skill_enricher.py
    from the Frey & Osborne (2013) lookup table after this function returns.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    signal = get_econometric_signal(locale)
    itu_ctx = get_automation_itu_context(locale)
    system_prompt = _build_system_prompt(signal, itu_ctx)

    user_message = f"Worker narrative:\n{narrative}"

    client = genai.Client(api_key=api_key)
    # gemini-2.5-flash is the primary model for this key.
    # gemini-2.0-flash variants are quota fallbacks.
    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]
    last_error: Exception | None = None
    response = None

    for model in models_to_try:
        try:
            config_kwargs: dict = dict(
                system_instruction=system_prompt,
                temperature=0.2,
                max_output_tokens=8192,
            )
            # For thinking models (2.5-flash), cap the thinking budget so
            # it doesn't consume the output token window.
            if "2.5" in model:
                try:
                    config_kwargs["thinking_config"] = genai_types.ThinkingConfig(
                        thinking_budget=512
                    )
                except Exception:
                    pass  # older SDK version without ThinkingConfig — skip
            response = client.models.generate_content(
                model=model,
                contents=user_message,
                config=genai_types.GenerateContentConfig(**config_kwargs),
            )
            break
        except Exception as exc:
            last_error = exc
            if any(code in str(exc) for code in ["429", "403", "RESOURCE_EXHAUSTED"]):
                continue
            raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}") from exc

    if response is None:
        raise HTTPException(
            status_code=429,
            detail=(
                "Gemini free-tier quota exhausted for all models. "
                "Generate a new API key at https://aistudio.google.com/apikey "
                f"Last error: {last_error}"
            ),
        )

    # gemini-2.5-flash (thinking model) sometimes returns text only via candidates
    raw_text = response.text or ""
    if not raw_text and response.candidates:
        for cand in response.candidates:
            if cand.content and cand.content.parts:
                for part in cand.content.parts:
                    if hasattr(part, "text") and part.text:
                        raw_text = part.text
                        break
            if raw_text:
                break

    try:
        json_str = _extract_json_text(raw_text)
        data = json.loads(json_str)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Gemini response: {exc}. Raw (first 400 chars): {raw_text[:400]}",
        ) from exc

    # Extract user city before building skills
    user_city: str = data.get("user_city", "").strip()

    skills_raw = data.get("skills", [])
    opps_raw = data.get("opportunities", [])

    # F-O scores are placeholders here — skill_enricher.py overwrites them
    profile = ProfileResponse(
        user_skills=[
            ExtractedSkill(
                label=s.get("label", "Unknown skill"),
                isco_code=s.get("isco_code", "0000"),
                esco_code=s.get("esco_code", ""),
                status=s.get("status", "durable"),
                frey_osborne_score=0.0,  # to be filled by enricher
                ilo_task_type=s.get("ilo_task_type", "non_routine_manual_technical"),
                resilience_note=s.get("resilience_placeholder", ""),  # enricher replaces this
            )
            for s in skills_raw
        ],
        matches=[
            OpportunityMatch(
                title=o.get("title", "Unnamed role"),
                wage_floor=str(o.get("wage_floor", signal["wage_floor"])),
                growth_percent=str(o.get("growth_percent", "3%")),
                match_strength=int(o.get("match_strength", 70)),
                ilostat_source=o.get("ilostat_source", "ILOSTAT 2024"),
                returns_to_education_note=o.get("returns_to_education_note", ""),
            )
            for o in opps_raw
        ],
    )

    return profile, user_city

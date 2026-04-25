import json
import os
import re

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import types as genai_types

try:
    from ..models.schemas import OpportunityMatch, ProfileResponse
    from ..utils.mock_data import get_locale_signal
except (ImportError, ModuleNotFoundError):
    from models.schemas import OpportunityMatch, ProfileResponse
    from utils.mock_data import get_locale_signal

load_dotenv()

MODEL_NAME = "gemini-2.0-flash-lite"  # fallback chain below handles quota

SYSTEM_PROMPT = """
You are a skills extraction AI for the World Bank UNMAPPED project.
Read an informal worker's narrative and extract their skills.

Return ONLY a raw JSON object — no markdown fences, no explanation, nothing else:
{"skills":[{"label":"<short name>","isco_code":"<4-digit ISCO-08>","esco_code":"","status":"durable"}],"opportunities":[{"title":"<role>","wage_floor":"<amount>","growth_percent":"<e.g. 12%>","match_strength":<0-100>}]}

Rules:
- Extract 3 to 6 skills maximum
- Use real 4-digit ISCO-08 codes (use "0000" only if unknown)
- Set esco_code to empty string ""
- status must be exactly "durable" or "at_risk"
- Generate 2 to 3 opportunity matches for the locale
- Output ONLY the JSON — no text before or after, no code fences
""".strip()


def _extract_json_text(raw: str) -> str:
    """Strip markdown fences and extract the first complete JSON object."""
    raw = raw.strip()
    # Remove any ```json ... ``` fences
    raw = re.sub(r"```[a-zA-Z]*\n?", "", raw)
    raw = raw.replace("```", "").strip()

    # Find the outermost { ... } by counting braces
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
                return raw[start : i + 1]

    raise ValueError("Incomplete JSON object in Gemini response — response was truncated.")


def extract_skills(narrative: str, locale: str) -> ProfileResponse:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    signal = get_locale_signal(locale)
    user_message = (
        f"Locale: {locale}\n"
        f"Econometric context: wage_floor={signal['wage_floor']}, "
        f"growth_percent={signal['growth_percent']}\n\n"
        f"Narrative:\n{narrative}"
    )

    client = genai.Client(api_key=api_key)

    # Try models in order — free-tier quota may be exhausted on some
    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ]
    last_error: Exception | None = None
    response = None

    for model in models_to_try:
        try:
            response = client.models.generate_content(
                model=model,
                contents=user_message,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.2,
                    max_output_tokens=4096,
                ),
            )
            break  # success
        except Exception as exc:
            last_error = exc
            err_str = str(exc)
            # Only retry on quota/permission errors
            if "429" in err_str or "403" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                continue
            raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}") from exc

    if response is None:
        raise HTTPException(
            status_code=429,
            detail=(
                "Gemini free-tier quota is exhausted for all available models. "
                "Please generate a new API key at https://aistudio.google.com/apikey "
                "or enable billing on your Google Cloud project. "
                f"Last error: {last_error}"
            ),
        )

    raw_text = response.text or ""
    try:
        json_str = _extract_json_text(raw_text)
        data = json.loads(json_str)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Gemini JSON response: {exc}. Raw: {raw_text[:300]}",
        ) from exc

    skills_raw = data.get("skills", [])
    opps_raw = data.get("opportunities", [])

    return ProfileResponse(
        user_skills=[
            {
                "label": s.get("label", "Unknown skill"),
                "isco_code": s.get("isco_code", "0000"),
                "esco_code": s.get("esco_code", ""),
                "status": s.get("status", "durable"),
            }
            for s in skills_raw
        ],
        matches=[
            OpportunityMatch(
                title=o.get("title", "Unnamed role"),
                wage_floor=str(o.get("wage_floor", signal["wage_floor"])),
                growth_percent=str(o.get("growth_percent", signal["growth_percent"])),
                match_strength=int(o.get("match_strength", 70)),
            )
            for o in opps_raw
        ],
    )

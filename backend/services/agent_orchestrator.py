"""
UNMAPPED Agent Orchestrator
============================
Gemini acts as the decision-making brain. It calls the existing pipeline
functions as tools — deciding order, skipping unnecessary steps, and asking
clarifying questions when needed.

The pipeline functions are UNCHANGED. The agent wraps them.

  ai_engine.extract_skills()      → extract_skills tool
  frey_osborne.get_fo_score()     → score_skill tool
  Tavily via search_engine        → search_market tool
  adjacency_engine.get_adjacent() → get_adjacent_skills tool
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import Optional

from google import genai
from google.genai import types as genai_types

try:
    from .agent_tools import PIPELINE_TOOLS
    from .ai_engine import extract_skills as _pipeline_extract_skills
    from .adjacency_engine import get_adjacent_skills as _pipeline_get_adjacent
    from .frey_osborne import classify, get_fo_score, get_ilo_task_type
    from .search_engine import build_hiring_query
except (ImportError, ModuleNotFoundError):
    from services.agent_tools import PIPELINE_TOOLS
    from services.ai_engine import extract_skills as _pipeline_extract_skills
    from services.adjacency_engine import get_adjacent_skills as _pipeline_get_adjacent
    from services.frey_osborne import classify, get_fo_score, get_ilo_task_type
    from services.search_engine import build_hiring_query

logger = logging.getLogger(__name__)

# ── Tavily import — graceful degradation ───────────────────────────────────────
try:
    from tavily import TavilyClient
    _TAVILY_AVAILABLE = True
except ImportError:
    _TAVILY_AVAILABLE = False


def _run_tavily_search(query: str) -> list[dict]:
    """Synchronous Tavily search — called via asyncio.to_thread."""
    api_key = os.getenv("TAVILY_API_KEY", "")
    if not api_key or not _TAVILY_AVAILABLE:
        return []
    try:
        client = TavilyClient(api_key=api_key)
        result = client.search(query=query, max_results=2, search_depth="basic")
        return result.get("results", [])
    except Exception:
        return []


# ── System prompt ──────────────────────────────────────────────────────────────
ORCHESTRATOR_SYSTEM_PROMPT = """
You are the UNMAPPED extraction agent. You orchestrate a pipeline of tools to
build a verified skills profile for an informal worker in a low-middle-income country.

You have five tools:
1. extract_skills       — parse the narrative (call FIRST, always)
2. ask_clarification    — get more info (only if narrative is unclear or < 30 words)
3. score_skill          — Frey-Osborne ISCO lookup (call for EVERY confirmed skill)
4. search_market        — live Tavily market search (call for 1-2 key skills ONLY)
5. get_adjacent_skills  — resilience pathways (call for EVERY scored skill)

YOUR DECISION RULES:
- If the narrative is fewer than 30 words or mentions only one very vague activity,
  call ask_clarification BEFORE extract_skills. Do this at most once.
- Call extract_skills with the full narrative text.
- Call score_skill for every skill returned by extract_skills.
- Call search_market ONLY for the skill most central to the worker's livelihood —
  not for secondary or low-confidence skills. Always provide a reason.
- Call get_adjacent_skills for every scored skill.
- Stop when all skills are scored and enriched. Do not repeat tool calls.

After all tool calls are complete, output ONLY the following JSON with no prose,
no markdown fences, no explanation — just the raw JSON object:

{
  "user_city": "City extracted from the narrative",
  "skills": [
    {
      "label": "Skill name",
      "isco_code": "7421",
      "esco_code": "",
      "status": "durable",
      "frey_osborne_score": 0.29,
      "ilo_task_type": "non_routine_manual_technical",
      "resilience_note": "Live evidence or empty string if not searched",
      "adjacent_skills": [
        {
          "isco_code": "3511",
          "label": "ICT Operations Technician",
          "resilience_delta": 0.14,
          "rationale": "...",
          "training_type": "Vocational (TVET)",
          "estimated_weeks": 10
        }
      ]
    }
  ],
  "agent_summary": "One sentence describing what this worker does and their primary livelihood skill.",
  "clarification_asked": false,
  "tool_calls_made": 7,
  "search_decisions": [
    {
      "skill": "Electronics Repair",
      "searched": true,
      "reason": "Primary livelihood skill — market evidence critical for assessment"
    },
    {
      "skill": "Basic Accounting",
      "searched": false,
      "reason": "Secondary skill — Frey-Osborne score sufficient, no live search needed"
    }
  ]
}

Status values: "durable" (score < 0.40), "transitioning" (0.40 to 0.65), "at_risk" (> 0.65).
Include EVERY skill from extract_skills in the output, even if search_market was not called for it.
""".strip()


# ── Main agent entrypoint ──────────────────────────────────────────────────────

async def run_agent(
    narrative: str,
    city: str,
    locale_code: str,
    clarifying_answer: Optional[str],
    gemini_client,
) -> dict:
    """
    Runs the agentic orchestration loop.

    Returns one of:
      {"status": "complete",  "result": {...}}
      {"status": "awaiting_clarification", "clarifying_question": "..."}
      {"status": "error", "error": "..."}
    """
    # Context shared across tool calls (avoids global state)
    agent_context: dict = {
        "matches": [],       # filled by extract_skills tool
        "user_city": city,   # overwritten if Gemini extracts a better city
    }

    user_message = f'Narrative: "{narrative}"\nCity: {city}\nLocale: {locale_code}'
    if clarifying_answer:
        user_message += f'\nWorker clarification to previous question: "{clarifying_answer}"'

    messages: list = [
        genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=user_message)],
        )
    ]

    tool_call_count = 0
    max_tool_calls = 20  # safety ceiling

    while tool_call_count < max_tool_calls:
        # ── Call Gemini ──────────────────────────────────────────────────────
        try:
            config_kwargs: dict = dict(
                system_instruction=ORCHESTRATOR_SYSTEM_PROMPT,
                tools=[PIPELINE_TOOLS],
                temperature=0.1,
                max_output_tokens=8192,
            )
            try:
                config_kwargs["thinking_config"] = genai_types.ThinkingConfig(
                    thinking_budget=512
                )
            except Exception:
                pass  # older SDK — skip thinking config

            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=messages,
                config=genai_types.GenerateContentConfig(**config_kwargs),
            )
        except Exception as exc:
            logger.warning(f"Agent Gemini call failed: {exc}")
            return {"status": "error", "error": str(exc)}

        candidate = response.candidates[0]

        # Check whether this turn contains tool calls
        has_tool_calls = any(
            hasattr(p, "function_call") and p.function_call is not None
            for p in candidate.content.parts
        )

        # ── Agent finished — extract final JSON ──────────────────────────────
        if not has_tool_calls:
            text = "".join(
                p.text
                for p in candidate.content.parts
                if hasattr(p, "text") and p.text
            )
            try:
                result = _extract_json(text)
            except Exception as exc:
                logger.warning(
                    f"Agent final JSON parse failed: {exc}. Raw (first 400): {text[:400]}"
                )
                return {"status": "error", "error": f"Agent JSON parse error: {exc}"}

            result["agent_ran"] = True
            result["tool_calls_made"] = tool_call_count
            result["matches"] = agent_context["matches"]
            result["user_city"] = (
                result.get("user_city")
                or agent_context["user_city"]
                or city
            )
            return {"status": "complete", "result": result}

        # ── Execute each tool call in this turn ──────────────────────────────
        tool_results: list = []
        for part in candidate.content.parts:
            if not (hasattr(part, "function_call") and part.function_call is not None):
                continue

            name = part.function_call.name
            args = dict(part.function_call.args)
            tool_call_count += 1
            logger.info(f"Agent tool call #{tool_call_count}: {name}({list(args.keys())})")

            # Clarification — return immediately; no tool result needed
            if name == "ask_clarification":
                return {
                    "status": "awaiting_clarification",
                    "clarifying_question": args.get(
                        "question",
                        "Could you describe your main work activities in more detail?",
                    ),
                }

            tool_result = await _execute_tool(
                name, args, city, locale_code, agent_context
            )
            tool_results.append(
                genai_types.Part.from_function_response(
                    name=name,
                    response=tool_result,
                )
            )

        # Append model turn + tool results before next iteration
        messages.append(candidate.content)
        messages.append(
            genai_types.Content(role="tool", parts=tool_results)
        )

    return {"status": "error", "error": f"Agent exceeded {max_tool_calls} tool calls"}


# ── Tool router — calls existing pipeline functions ────────────────────────────

async def _execute_tool(
    name: str,
    args: dict,
    city: str,
    locale_code: str,
    agent_context: dict,
) -> dict:
    """
    Routes each tool call to the appropriate existing pipeline function.
    This is the ONLY place pipeline functions are called from the agent.
    None of the underlying files are modified.
    """

    # ── 1. extract_skills ────────────────────────────────────────────────────
    if name == "extract_skills":
        try:
            profile, gemini_city = await asyncio.to_thread(
                _pipeline_extract_skills,
                args["narrative"],
                locale_code,
            )
            # Store opportunity matches for inclusion in final response
            agent_context["matches"] = profile.matches
            if gemini_city and not agent_context.get("user_city"):
                agent_context["user_city"] = gemini_city

            return {
                "status": "ok",
                "user_city": gemini_city or city,
                "skills": [
                    {
                        "label": s.label,
                        "isco_code": s.isco_code,
                        "esco_code": s.esco_code,
                        "ilo_task_type": s.ilo_task_type,
                    }
                    for s in profile.user_skills
                ],
                "count": len(profile.user_skills),
            }
        except Exception as exc:
            logger.warning(f"extract_skills tool error: {exc}")
            return {"status": "error", "message": str(exc), "skills": [], "count": 0}

    # ── 2. score_skill ───────────────────────────────────────────────────────
    elif name == "score_skill":
        try:
            isco_code = str(args.get("isco_code", "")).strip()
            fo_score = get_fo_score(isco_code, lmic_discount_pct=20)
            skill_status = classify(fo_score)
            ilo_type = get_ilo_task_type(isco_code)
            return {
                "status": "ok",
                "frey_osborne_score": fo_score,
                "automation_probability_pct": round(fo_score * 100),
                "skill_status": skill_status,       # "durable" | "transitioning" | "at_risk"
                "ilo_task_type": ilo_type,
            }
        except Exception as exc:
            logger.warning(f"score_skill tool error: {exc}")
            return {
                "status": "fallback",
                "frey_osborne_score": 0.5,
                "skill_status": "transitioning",
                "message": str(exc),
            }

    # ── 3. search_market ─────────────────────────────────────────────────────
    elif name == "search_market":
        try:
            skill_label = args.get("skill_label", "")
            isco_code = args.get("isco_code", "")
            search_city = args.get("city", city)
            query = build_hiring_query(
                isco_label=skill_label,
                city=search_city,
                locale_code=locale_code,
            )
            results = await asyncio.to_thread(_run_tavily_search, query)
            if results:
                best = results[0]
                snippet = (
                    best.get("content") or best.get("snippet") or ""
                )[:200].strip()
                url = best.get("url", "")
                domain = (
                    url.split("/")[2]
                    if url.startswith("http") and len(url.split("/")) > 2
                    else url
                )
                note = (
                    f'Live evidence from {search_city}: "{snippet}..." — {domain}.'
                    if snippet
                    else ""
                )
                return {
                    "status": "ok",
                    "note": note,
                    "source": domain,
                    "search_reason_logged": args.get("reason", ""),
                }
            return {
                "status": "no_results",
                "note": "",
                "source": "",
                "search_reason_logged": args.get("reason", ""),
            }
        except Exception as exc:
            logger.warning(f"search_market tool error: {exc}")
            return {"status": "error", "note": "", "source": "", "message": str(exc)}

    # ── 4. get_adjacent_skills ───────────────────────────────────────────────
    elif name == "get_adjacent_skills":
        try:
            isco_code = str(args.get("isco_code", "")).strip()
            fo_score = float(args.get("automation_score", 0.5))
            adjacent = await asyncio.to_thread(
                _pipeline_get_adjacent, isco_code, fo_score
            )
            return {"status": "ok", "adjacent": adjacent}
        except Exception as exc:
            logger.warning(f"get_adjacent_skills tool error: {exc}")
            return {"status": "empty", "adjacent": [], "message": str(exc)}

    # ── Unknown tool ─────────────────────────────────────────────────────────
    return {"status": "unknown_tool", "name": name}


# ── JSON extraction helper ─────────────────────────────────────────────────────

def _extract_json(text: str) -> dict:
    """Extract first complete JSON object from agent text output."""
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in agent response")
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start : i + 1])
    raise ValueError("Unbalanced braces — agent response was truncated")

"""
Config-as-Infrastructure loader.
All locale econometric parameters are read from locales.json —
no hardcoded values in application code.
"""
import json
import os
from functools import lru_cache
from typing import Any

_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "locales.json")


@lru_cache(maxsize=1)
def _load_all() -> dict[str, Any]:
    with open(_CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def get_locale(locale_code: str) -> dict[str, Any]:
    """Return the full locale config dict for a given code (e.g. 'gh', 'pk')."""
    data = _load_all()
    key = locale_code.lower().strip()
    if key not in data:
        # Graceful fallback to 'gh' so the system never hard-crashes
        key = "gh"
    return data[key]


def get_econometric_signal(locale_code: str) -> dict[str, Any]:
    """Return the lightweight signal dict used by the AI engine prompt."""
    locale = get_locale(locale_code)
    ilo = locale["ilo_econometrics"]
    wb = locale["world_bank"]
    wit = locale["wittgenstein_projections"]
    fo = locale["frey_osborne_lmic_calibration"]
    edu = locale["education_taxonomy"]

    top_sectors = sorted(
        ilo["sector_growth_indices"].items(),
        key=lambda x: x[1]["annual_growth_pct"],
        reverse=True,
    )[:3]

    return {
        "context": locale["context"],
        "currency": locale["currency"],
        "wage_floor": ilo["wage_floor_local"],
        "wage_floor_usd_ppp": ilo["wage_floor_usd_ppp"],
        "informal_economy_share_pct": ilo["informal_economy_share_pct"],
        "returns_to_vocational_pct": ilo["returns_to_vocational_pct"],
        "hci_score": wb["hci_score"],
        "tvet_name": edu["name"],
        "rpl_pathway_exists": edu["rpl_pathway_exists"],
        "top_growth_sectors": [
            {"sector": k, "growth_pct": v["annual_growth_pct"], "demand_gap_pct": v["demand_gap_pct"]}
            for k, v in top_sectors
        ],
        "wittgenstein_note": wit["note"],
        "automation_calibration_note": fo["calibration_note"],
        "durable_isco_codes": fo["durable_isco_codes"],
        "at_risk_isco_codes": fo["at_risk_isco_codes"],
        "high_risk_threshold": fo["high_risk_threshold"],
        "medium_risk_threshold": fo["medium_risk_threshold"],
    }


def get_all_locales() -> dict[str, Any]:
    """Return all locale configs (excluding _meta)."""
    data = _load_all()
    return {k: v for k, v in data.items() if not k.startswith("_")}

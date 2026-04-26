"""
Occupation- and location-adjusted wage estimates for opportunity matches.

Gemini returns illustrative wage strings that are often wrong (e.g. Ghana-sized
figures with Pakistan currency). We replace them with transparent arithmetic on:

  1. National mean monthly earnings — ILO ILOSTAT (live SDMX when available)
     or ILO Global Wage Report / ILOSTAT tables from locales.json.
  2. ISCO-08 major group (1st digit) — relative position vs economy-wide mean,
     from ILO occupational earnings dispersion (Global Wage Report 2022–23:
     managers and professionals typically ~1.8–2.2× craft/elementary; elementary
     ~0.55–0.65× mean). Factors are rounded and conservative.
  3. City / labour-market density — illustrative urban premia (ILO urban wage
     gaps, country typologies); secondary cities use modest premia or discounts.

Sources are concatenated on each OpportunityMatch.ilostat_source for UI badges.
"""

from __future__ import annotations

import re

try:
    from ..config.loader import get_locale
    from ..models.schemas import ExtractedSkill, ProfileResponse
    from ..services.institutional_data import get_live_indicators
except (ImportError, ModuleNotFoundError):
    from config.loader import get_locale
    from models.schemas import ExtractedSkill, ProfileResponse
    from services.institutional_data import get_live_indicators

# ISCO-08 major group → multiplier vs national mean monthly earnings
# Normalized so major groups 7–8 (craft, plant) sit near 1.0 (typical informal LMIC mix).
_ISCO_MAJOR_FACTOR: dict[int, float] = {
    0: 1.05,  # Armed forces
    1: 2.05,  # Managers
    2: 1.85,  # Professionals
    3: 1.42,  # Technicians & associate professionals
    4: 1.08,  # Clerical / administrative
    5: 0.92,  # Services & sales
    6: 0.68,  # Skilled agricultural
    7: 0.98,  # Craft & related trades
    8: 0.88,  # Plant / machine operators
    9: 0.62,  # Elementary occupations
}

# City name substring (lowercase) → premium vs national mean (illustrative)
_CITY_PREMIUM: dict[str, dict[str, float]] = {
    "pk": {
        "karachi": 1.14,
        "lahore": 1.10,
        "islamabad": 1.16,
        "rawalpindi": 1.06,
        "faisalabad": 1.02,
        "multan": 0.98,
        "peshawar": 1.00,
        "quetta": 0.96,
        "hyderabad": 1.04,
        "sialkot": 1.05,
        "gujranwala": 1.03,
        "jhang": 0.94,
        "bahawalpur": 0.93,
        "_default": 0.94,
    },
    "gh": {
        "accra": 1.16,
        "kumasi": 1.02,
        "tamale": 0.90,
        "tema": 1.08,
        "sekondi": 0.95,
        "cape coast": 0.96,
        "_default": 0.93,
    },
}


def _isco_major_factor(isco_code: str) -> float:
    code = re.sub(r"\D", "", (isco_code or "")[:4])
    if not code:
        return 1.0
    try:
        d = int(code[0])
    except ValueError:
        return 1.0
    return _ISCO_MAJOR_FACTOR.get(d, 1.0)


def _city_factor(locale_code: str, city: str) -> tuple[float, str]:
    lc = locale_code.lower().strip()
    tab = _CITY_PREMIUM.get(lc, {})
    if not tab:
        return 1.0, "national average"
    c = (city or "").lower().strip()
    for name, fac in tab.items():
        if name.startswith("_"):
            continue
        if name in c:
            return fac, name.title()
    return float(tab.get("_default", 1.0)), "other areas"


def _pick_skill(matches_idx: int, title: str, skills: list[ExtractedSkill]) -> ExtractedSkill | None:
    if not skills:
        return None
    tl = (title or "").lower()
    for s in skills:
        if s.label and s.label.lower() in tl:
            return s
    for s in skills:
        w = s.label.lower().split()[0] if s.label else ""
        if w and len(w) > 3 and w in tl:
            return s
    return skills[matches_idx % len(skills)]


def apply_calibrated_wages(profile: ProfileResponse, locale_code: str, user_city: str) -> None:
    """Mutate profile.matches wage_floor and ilostat_source in place."""
    if not profile.matches:
        return

    lc = locale_code.lower().strip()
    live = get_live_indicators(lc)
    wf_block = live.get("wage_floor_local") or {}
    anchor = float(wf_block.get("value") or 0)
    bench_src = str(wf_block.get("source") or "ILO ILOSTAT / ILO Global Wage Report")

    if anchor <= 0:
        loc = get_locale(lc)
        ilo = loc.get("ilo_econometrics", {})
        anchor = float(ilo.get("wage_floor_local", 0))
        bench_src = f"ILO Global Wage Report 2024 · ILOSTAT published tables · {ilo.get('source', 'ILOSTAT')}"

    if anchor <= 0:
        return

    loc_cfg = get_locale(lc)
    symbol = str(loc_cfg.get("currency_symbol", ""))
    currency = str(loc_cfg.get("currency", ""))
    city = (user_city or profile.user_city or "").strip()
    city_f, city_label = _city_factor(lc, city)
    skills = profile.user_skills or []

    for i, m in enumerate(profile.matches):
        sk = _pick_skill(i, m.title, skills)
        isco = sk.isco_code if sk else ""
        occ_f = _isco_major_factor(isco)
        maj_digits = re.sub(r"\D", "", (isco or "")[:4])
        maj_grp = maj_digits[0] if maj_digits else "—"
        amount = max(round(anchor * occ_f * city_f), 0)
        m.wage_floor = f"{symbol}{amount:,.0f}/month"
        m.ilostat_source = (
            f"Modelled: ILO national mean monthly earnings ({symbol}{anchor:,.0f} {currency}/mo) "
            f"× ISCO-08 major-group factor ({occ_f:.2f} for major group {maj_grp}) "
            f"× location ({city_label}: ×{city_f:.2f}). Benchmark data: {bench_src}. "
            f"Not a statutory minimum wage; illustrative estimate for role and place."
        )

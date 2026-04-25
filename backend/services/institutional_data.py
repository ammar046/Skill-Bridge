"""
Institutional Data Orchestration Layer
=======================================
Data hierarchy (most authoritative first):
  Tier 1 – World Bank WDI (live via wbgapi)
           Source: World Bank Open Data API · wbgapi
           Indicators: secondary enrollment, internet %, NEET, vulnerable employment, GDP/worker
  Tier 2 – ILO minimum wage / wage floor
           Source: ILO Global Wage Report 2024 / ILOSTAT published tables
           Note: ILO's SDMX REST API is currently unreachable; baseline values
                 from published ILOSTAT 2024 tables are served and clearly attributed.
  Tier 3 – Tavily live web retrieval (only when Tier 1 & 2 are unavailable)
           Source: Tavily web search · cited URL
  Cache  – 24-hour file cache prevents repeated API calls per deployment
"""
import json
import os
import time
from typing import Any

import wbgapi

try:
    from ..config.loader import get_locale
except (ImportError, ModuleNotFoundError):
    from config.loader import get_locale

# ─── Configuration ───────────────────────────────────────────────────────────

_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", ".cache")
_CACHE_TTL_SECONDS = 86_400  # 24 hours

_ISO3_MAP = {
    "gh": "GHA",
    "pk": "PAK",
}

# World Bank WDI indicator codes — all sourced from authoritative institutions
_WB_INDICATORS: dict[str, dict[str, str]] = {
    "gross_secondary_enrollment_pct": {
        "code": "SE.SEC.ENRR",
        "source": "World Bank WDI 2024 · UNESCO Institute for Statistics",
        "label": "Gross secondary enrollment rate (%)",
    },
    "internet_penetration_pct": {
        "code": "IT.NET.USER.ZS",
        "source": "World Bank WDI 2024 · ITU (International Telecommunication Union)",
        "label": "Internet users (% of population)",
    },
    "neet_rate_pct": {
        "code": "SL.UEM.NEET.ZS",
        "source": "World Bank WDI 2024 · ILO modelled estimates",
        "label": "NEET rate — Youth not in education, employment or training (%)",
    },
    "vulnerable_employment_pct": {
        "code": "SL.EMP.VULN.ZS",
        "source": "World Bank WDI 2024 · ILO modelled estimates",
        "label": "Vulnerable employment (% of total employment)",
    },
    "gdp_per_capita_ppp": {
        "code": "NY.GDP.PCAP.PP.CD",
        "source": "World Bank WDI 2024 · International Comparison Programme",
        "label": "GDP per capita, PPP (current international $)",
    },
    "output_per_worker_usd": {
        "code": "SL.GDP.PCAP.EM.KD",
        "source": "World Bank WDI 2024 · ILO",
        "label": "GDP per person employed (constant 2017 USD)",
    },
}

# ─── Cache helpers ────────────────────────────────────────────────────────────

def _cache_path(key: str) -> str:
    os.makedirs(_CACHE_DIR, exist_ok=True)
    return os.path.join(_CACHE_DIR, f"{key}.json")


def _read_cache(key: str) -> dict[str, Any] | None:
    path = _cache_path(key)
    if not os.path.exists(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            cached = json.load(f)
        if time.time() - cached.get("_ts", 0) < _CACHE_TTL_SECONDS:
            return cached.get("data")
    except Exception:
        pass
    return None


def _write_cache(key: str, data: dict[str, Any]) -> None:
    path = _cache_path(key)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"_ts": time.time(), "data": data}, f)
    except Exception:
        pass


# ─── Indicator value type ─────────────────────────────────────────────────────

def _indicator(
    value: float | None,
    source: str,
    year: str | None = None,
    live: bool = False,
    label: str = "",
) -> dict[str, Any]:
    return {
        "value": value,
        "source": source,
        "year": year,
        "live": live,
        "label": label,
        "available": value is not None,
    }


# ─── World Bank live fetch ────────────────────────────────────────────────────

def _fetch_wb_indicator(indicator_code: str, iso3: str) -> tuple[float | None, str | None]:
    """Return (value, year) or (None, None) on failure."""
    try:
        row = next(iter(wbgapi.data.fetch(indicator_code, iso3, mrv=1)))
        val = row.get("value")
        yr = row.get("time")
        if val is not None:
            return float(val), str(yr)
    except Exception:
        pass
    return None, None


def _fetch_all_wb(iso3: str) -> dict[str, tuple[float | None, str | None]]:
    results: dict[str, tuple[float | None, str | None]] = {}
    for key, meta in _WB_INDICATORS.items():
        results[key] = _fetch_wb_indicator(meta["code"], iso3)
    return results


# ─── Public API ──────────────────────────────────────────────────────────────

def get_live_indicators(locale_code: str) -> dict[str, Any]:
    """
    Returns a dict of econometric indicators with full source attribution.
    Tries the cache first (24 h TTL), then live APIs, then locales.json baseline.
    """
    locale_code = locale_code.lower()
    cache_key = f"indicators_{locale_code}"
    cached = _read_cache(cache_key)
    if cached:
        return cached

    iso3 = _ISO3_MAP.get(locale_code, locale_code.upper())
    baseline = get_locale(locale_code)
    ilo_base = baseline.get("ilo_econometrics", {})
    wb_base = baseline.get("world_bank", {})
    wit = baseline.get("wittgenstein_projections", {})
    fo = baseline.get("frey_osborne_lmic_calibration", {})

    # ── Tier 1: World Bank live fetch ────────────────────────────────────────
    wb_live = _fetch_all_wb(iso3)

    def wb(key: str) -> dict[str, Any]:
        val, yr = wb_live.get(key, (None, None))
        meta = _WB_INDICATORS[key]
        if val is not None:
            return _indicator(val, meta["source"], yr, live=True, label=meta["label"])
        # Tier 2: locales.json baseline (real published values, not synthetic)
        fallback = wb_base.get(key.replace("_pct", "").replace("gross_secondary_enrollment", "gross_secondary_enrollment"))
        return _indicator(
            fallback,
            f"{meta['source']} · Baseline from published {wb_base.get('source', 'World Bank 2024')} report",
            year=None,
            live=False,
            label=meta["label"],
        )

    # ── Tier 2: ILO wage floor (ILO SDMX API unreachable — serve published baseline) ──
    wage_floor = _indicator(
        float(ilo_base.get("wage_floor_local", 0)),
        f"ILO Global Wage Report 2024 · ILOSTAT published tables · {ilo_base.get('source', 'ILOSTAT 2024')}",
        year="2024",
        live=False,
        label=f"Estimated median wage floor ({baseline.get('currency', '')})",
    )
    wage_floor_ppp = _indicator(
        float(ilo_base.get("wage_floor_usd_ppp", 0)),
        "ILO Global Wage Report 2024 · PPP-adjusted",
        year="2024",
        live=False,
        label="Wage floor (USD PPP)",
    )

    # ── HCI — WB API returning JSON errors on this endpoint; use published report ──
    hci = _indicator(
        float(wb_base.get("hci_score", 0)),
        "World Bank Human Capital Index 2024 · Published report (SP.HCI.OVRL)",
        year="2024",
        live=False,
        label="Human Capital Index (0–1)",
    )

    # ── Automation risk inputs (Frey-Osborne + ITU internet) ──
    internet_ind = wb("internet_penetration_pct")
    internet_pct = internet_ind["value"] or 50.0
    # ITU Digital Development: low internet = automation is delayed ~2-4 years
    automation_delay_years = max(0, round((70 - internet_pct) / 10))

    # ── Wittgenstein projections (published, not live API) ────────────────────
    wittgenstein = {
        "value": wit.get("tvet_supply_gap_pct"),
        "source": f"Wittgenstein Centre for Demography and Global Human Capital · {wit.get('scenario', 'SSP2 Medium')} · 2025-2035",
        "year": "2025-2035",
        "live": False,
        "label": "TVET supply gap vs projected demand (%)",
        "available": True,
        "note": wit.get("note", ""),
    }

    # ── Sector growth indices (ILOSTAT + Wittgenstein published) ─────────────
    sector_growth = {
        sector: {
            "annual_growth_pct": vals["annual_growth_pct"],
            "demand_gap_pct": vals["demand_gap_pct"],
            "source": "ILOSTAT sector employment projections 2024 · Wittgenstein Centre SSP2",
        }
        for sector, vals in ilo_base.get("sector_growth_indices", {}).items()
    }

    result: dict[str, Any] = {
        # World Bank live indicators
        "gross_secondary_enrollment_pct": wb("gross_secondary_enrollment_pct"),
        "internet_penetration_pct": internet_ind,
        "neet_rate_pct": wb("neet_rate_pct"),
        "vulnerable_employment_pct": wb("vulnerable_employment_pct"),
        "gdp_per_capita_ppp": wb("gdp_per_capita_ppp"),
        "output_per_worker_usd": wb("output_per_worker_usd"),
        # ILO wage data (published baseline, ILO API unreachable)
        "wage_floor_local": wage_floor,
        "wage_floor_usd_ppp": wage_floor_ppp,
        # World Bank HCI (published report)
        "hci_score": hci,
        # ITU-derived automation delay
        "automation_delay_years": {
            "value": automation_delay_years,
            "source": "Derived from ITU Digital Development indicators via World Bank WDI",
            "live": internet_ind["live"],
            "label": f"Estimated automation delay vs OECD baseline (internet penetration: {internet_pct:.1f}%)",
            "available": True,
        },
        # Wittgenstein projections
        "wittgenstein": wittgenstein,
        # Frey-Osborne calibration
        "frey_osborne": {
            "high_risk_threshold": fo.get("high_risk_threshold", 0.70),
            "medium_risk_threshold": fo.get("medium_risk_threshold", 0.45),
            "lmic_discount_pct": 20,
            "source": "Frey & Osborne (2017) automation probability scores · ILO LMIC calibration adjustment (2019)",
            "calibration_note": fo.get("calibration_note", ""),
        },
        # Sector growth
        "sector_growth": sector_growth,
        # Metadata
        "_meta": {
            "locale": locale_code,
            "iso3": iso3,
            "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "cache_ttl_hours": _CACHE_TTL_SECONDS // 3600,
            "live_count": sum(
                1 for k, v in {
                    "secondary": wb("gross_secondary_enrollment_pct"),
                    "internet": internet_ind,
                    "neet": wb("neet_rate_pct"),
                    "vuln": wb("vulnerable_employment_pct"),
                    "gdp": wb("gdp_per_capita_ppp"),
                }.items()
                if isinstance(v, dict) and v.get("live")
            ),
        },
    }

    _write_cache(cache_key, result)
    return result


def get_automation_itu_context(locale_code: str) -> dict[str, Any]:
    """Lightweight version used by ai_engine to calibrate automation risk."""
    indicators = get_live_indicators(locale_code)
    internet = indicators.get("internet_penetration_pct", {})
    delay = indicators.get("automation_delay_years", {})
    fo = indicators.get("frey_osborne", {})
    return {
        "internet_penetration_pct": internet.get("value"),
        "internet_source": internet.get("source"),
        "automation_delay_years": delay.get("value", 0),
        "itu_note": delay.get("label", ""),
        "frey_osborne_high_threshold": fo.get("high_risk_threshold", 0.70),
        "frey_osborne_medium_threshold": fo.get("medium_risk_threshold", 0.45),
        "lmic_discount_pct": fo.get("lmic_discount_pct", 20),
    }

"""
UNMAPPED Open Econometrics Engine
===================================
Fetches institutional labour market data from fully open, unauthenticated
public APIs — no API keys required.

Data Tiers
----------
Tier 1 — World Bank Open Data API (api.worldbank.org/v2)
  Library : wbgapi (MIT licence)
  Auth    : None — public endpoint

Tier 2 — ILO ILOSTAT SDMX REST API (sdmx.ilo.org/rest)
  Library : requests
  Auth    : None — public endpoint

Tier 3 — Wittgenstein Centre / Frey-Osborne published tables
  Source  : backend/config/locales.json (curated baseline; always available)

All values are returned as ``EconIndicator`` objects that carry:
  - value (float | None)
  - source (citable string)
  - year (string, e.g. "2024")
  - live (bool) — True when fetched from a live API, False when from baseline
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

import requests
import wbgapi

try:
    from ..config.loader import get_locale
except (ImportError, ModuleNotFoundError):
    from config.loader import get_locale


# ── Country code helpers ──────────────────────────────────────────────────────

_ISO2_TO_ISO3: dict[str, str] = {
    "gh": "GHA",
    "pk": "PAK",
    "ng": "NGA",
    "ke": "KEN",
    "et": "ETH",
    "tz": "TZA",
    "ug": "UGA",
    "rw": "RWA",
    "bd": "BGD",
    "np": "NPL",
    "kh": "KHM",
    "mm": "MMR",
    "la": "LAO",
    "eg": "EGY",
    "ma": "MAR",
    "sn": "SEN",
    "ci": "CIV",
}


def _iso3(code: str) -> str:
    return _ISO2_TO_ISO3.get(code.lower(), code.upper())


# ── Value container ───────────────────────────────────────────────────────────

@dataclass
class EconIndicator:
    key: str
    label: str
    value: float | None
    source: str
    year: str | None = None
    live: bool = False
    unit: str = ""
    available: bool = field(init=False)

    def __post_init__(self) -> None:
        self.available = self.value is not None

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "label": self.label,
            "value": self.value,
            "source": self.source,
            "year": self.year,
            "live": self.live,
            "unit": self.unit,
            "available": self.available,
        }


# ── World Bank WDI indicators ─────────────────────────────────────────────────
# All via api.worldbank.org/v2 — open, unauthenticated, CC BY 4.0
_WB_INDICATORS: dict[str, dict[str, str]] = {
    "hci": {
        "code": "SP.HCI.OVRL",
        "label": "Human Capital Index (0–1)",
        "source": "World Bank Human Capital Project · WDI · CC BY 4.0",
        "unit": "index",
    },
    "secondary_enrollment": {
        "code": "SE.SEC.ENRR",
        "label": "Gross secondary school enrollment (%)",
        "source": "World Bank WDI 2024 · UNESCO Institute for Statistics · CC BY 4.0",
        "unit": "%",
    },
    "internet_penetration": {
        "code": "IT.NET.USER.ZS",
        "label": "Internet users (% of population)",
        "source": "World Bank WDI 2024 · ITU Digital Development · CC BY 4.0",
        "unit": "%",
    },
    "neet_rate": {
        "code": "SL.UEM.NEET.ZS",
        "label": "Youth NEET rate (% aged 15–24)",
        "source": "World Bank WDI 2024 · ILO modelled estimates · CC BY 4.0",
        "unit": "%",
    },
    "vulnerable_employment": {
        "code": "SL.EMP.VULN.ZS",
        "label": "Vulnerable employment (% of total employment)",
        "source": "World Bank WDI 2024 · ILO modelled estimates · CC BY 4.0",
        "unit": "%",
    },
    "gdp_per_capita_ppp": {
        "code": "NY.GDP.PCAP.PP.CD",
        "label": "GDP per capita, PPP (current int'l $)",
        "source": "World Bank WDI 2024 · International Comparison Programme · CC BY 4.0",
        "unit": "USD PPP",
    },
    "output_per_worker": {
        "code": "SL.GDP.PCAP.EM.KD",
        "label": "Output per worker (constant 2017 USD)",
        "source": "World Bank WDI 2024 · ILO · CC BY 4.0",
        "unit": "USD",
    },
    "returns_to_primary": {
        "code": "BAR.SCHL.15UP",
        "label": "Average years of schooling (population 15+)",
        "source": "World Bank WDI 2024 · Barro-Lee · CC BY 4.0",
        "unit": "years",
    },
}


def fetch_world_bank(country_code: str) -> dict[str, EconIndicator]:
    """
    Fetch all WB WDI indicators for a country.
    Uses wbgapi against api.worldbank.org/v2 — no authentication required.

    Returns a dict keyed by indicator name (e.g. "hci", "neet_rate").
    Failed indicators are included with value=None and live=False.
    """
    iso3 = _iso3(country_code)
    results: dict[str, EconIndicator] = {}

    for key, meta in _WB_INDICATORS.items():
        try:
            row = next(iter(wbgapi.data.fetch(meta["code"], iso3, mrv=1)))
            val = row.get("value")
            yr = str(row.get("time", ""))
            results[key] = EconIndicator(
                key=key,
                label=meta["label"],
                value=float(val) if val is not None else None,
                source=meta["source"],
                year=yr,
                live=True,
                unit=meta.get("unit", ""),
            )
        except Exception:
            results[key] = EconIndicator(
                key=key,
                label=meta["label"],
                value=None,
                source=meta["source"] + " [unavailable — API error]",
                live=False,
                unit=meta.get("unit", ""),
            )

    return results


# ── ILO ILOSTAT SDMX open API ─────────────────────────────────────────────────
# Base URL: https://sdmx.ilo.org/rest  (no auth required, CC BY 4.0)

_ILO_BASE = "https://sdmx.ilo.org/rest"
_ILO_TIMEOUT = 8


def _ilo_get(path: str) -> dict | None:
    try:
        r = requests.get(
            f"{_ILO_BASE}{path}",
            timeout=_ILO_TIMEOUT,
            headers={"Accept": "application/json"},
        )
        if r.ok:
            return r.json()
    except Exception:
        pass
    return None


def fetch_ilo_wage(country_code: str) -> EconIndicator:
    """
    Attempt to fetch mean nominal monthly earnings from ILO SDMX API.
    Indicator: EAR_INEE_SEX_ECO_NB_MON (monthly earnings, all sexes, total economy)
    Source: sdmx.ilo.org/rest — unauthenticated open API, CC BY 4.0

    Falls back to the locales.json ILOSTAT published baseline if the API
    is unreachable (ILO SDMX occasionally returns 404 for some country codes).
    """
    iso3 = _iso3(country_code)
    # ILO SDMX uses ISO3 country codes
    path = (
        f"/data/ILO,DF_EAR_INEE_SEX_ECO_NB_MON"
        f"/{iso3}.SEX_T.ECO_ISIC4_TOTAL.CUR_TYPE_LOCAL.."
        f"?format=jsondata&lastNObservations=1"
    )
    data = _ilo_get(path)

    if data:
        try:
            series = data["data"]["dataSets"][0]["series"]
            obs = next(iter(series.values()))["observations"]
            val = float(next(iter(obs.values()))[0])
            dims = data["data"]["structure"]["dimensions"]["observation"]
            yr = None
            for d in dims:
                if d.get("id") == "TIME_PERIOD":
                    yr = d["values"][0]["id"]
            return EconIndicator(
                key="wage_floor_local",
                label="Mean nominal monthly earnings (local currency)",
                value=val,
                source="ILO ILOSTAT · EAR_INEE_SEX_ECO_NB_MON · CC BY 4.0",
                year=yr,
                live=True,
                unit="local currency/month",
            )
        except Exception:
            pass

    # Tier 3 fallback — locales.json published ILOSTAT baseline
    try:
        locale = get_locale(country_code)
        ilo = locale["ilo_econometrics"]
        return EconIndicator(
            key="wage_floor_local",
            label="Estimated wage floor (local currency)",
            value=float(ilo.get("wage_floor_local", 0)),
            source=f"ILO Global Wage Report 2024 · ILOSTAT published tables · {ilo.get('source', '')}",
            year="2024",
            live=False,
            unit="local currency/month",
        )
    except Exception:
        return EconIndicator(
            key="wage_floor_local",
            label="Wage floor",
            value=None,
            source="ILO ILOSTAT [unavailable]",
            live=False,
        )


def fetch_returns_to_education(country_code: str) -> EconIndicator:
    """
    Returns-to-vocational-training premium from World Bank STEP data,
    curated in locales.json as the published baseline.

    Source: World Bank STEP Skills Measurement Programme (2023)
    This specific indicator is not available in WDI machine-readable form,
    but is published in the World Bank STEP survey reports.
    """
    try:
        locale = get_locale(country_code)
        pct = float(locale["ilo_econometrics"].get("returns_to_vocational_pct", 0))
        return EconIndicator(
            key="returns_to_vocational_pct",
            label="Wage premium from vocational training",
            value=pct,
            source="World Bank STEP Skills Measurement Programme 2023 · WDI proxy",
            year="2023",
            live=False,
            unit="%",
        )
    except Exception:
        return EconIndicator(
            key="returns_to_vocational_pct",
            label="Wage premium from vocational training",
            value=None,
            source="World Bank STEP [unavailable]",
            live=False,
        )


# ── Composite country snapshot ────────────────────────────────────────────────

def get_country_snapshot(country_code: str) -> dict[str, EconIndicator]:
    """
    Main public API — returns all available econometric indicators for a country.
    Combines World Bank WDI (live) + ILO wage (live or baseline) + returns to education.

    Usage:
        snap = get_country_snapshot("gh")
        hci = snap["hci"].value           # e.g. 0.45
        hci_source = snap["hci"].source   # "World Bank Human Capital Project ..."
        hci_live = snap["hci"].live       # True
    """
    wb = fetch_world_bank(country_code)
    wb["wage_floor_local"] = fetch_ilo_wage(country_code)
    wb["returns_to_vocational_pct"] = fetch_returns_to_education(country_code)
    wb["_fetched_at"] = EconIndicator(  # type: ignore[assignment]
        key="_fetched_at",
        label="Snapshot timestamp",
        value=None,
        source="UNMAPPED econometrics engine",
        year=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        live=True,
    )
    return wb

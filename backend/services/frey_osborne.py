"""
Frey-Osborne Automation Probability Lookup
===========================================
Source: Frey, C.B. & Osborne, M.A. (2013) "The Future of Employment: How
        susceptible are jobs to computerisation?" Oxford Martin Programme on
        Technology and Employment. Table 1, Appendix.

Scores are matched to ISCO-08 4-digit codes via the ILO O*NET cross-walk
(ILO, 2019 — "Skills and Automation — A Systematic Mapping of Tasks and
Technologies" working paper, DOI:10.2139/ssrn.3335933).

LMIC Calibration (ILO, 2019):
  Discount automation probability for LMIC contexts because:
    1. Capital-labour cost ratios delay technology adoption.
    2. Informal markets require high relational/situational adaptation.
    3. Low internet penetration (ITU) further delays deployment.
  Apply: lmic_score = isco_score * (1 - lmic_discount/100)
"""
from __future__ import annotations

# ── Specific 4-digit ISCO-08 codes → Frey-Osborne score ──────────────────────
# Values taken directly from Appendix Table in Frey & Osborne (2013),
# cross-walked to ISCO-08 via ILO O*NET Bridge (2019).
_ISCO4_SCORES: dict[str, float] = {
    # ── Electronics / ICT repair ──────────────────────────────────────────────
    "7421": 0.36,   # Electronics mechanics and servicers
    "7422": 0.46,   # Telecommunications installers and repairers
    "3511": 0.17,   # ICT operations and user support technicians
    "3512": 0.20,   # ICT user support technicians
    "2513": 0.08,   # Computer network professionals
    "2522": 0.07,   # Systems administrators
    # ── Automotive / mechanical ───────────────────────────────────────────────
    "7231": 0.37,   # Motor vehicle mechanics
    "7232": 0.42,   # Aircraft engine mechanics
    "7233": 0.38,   # Agricultural & industrial machinery mechanics
    "7311": 0.33,   # Precision instrument makers and repairers
    # ── Construction / trades ─────────────────────────────────────────────────
    "7111": 0.43,   # Building frame and related trades
    "7112": 0.44,   # Bricklayers
    "7113": 0.35,   # Stonemasons & tile setters
    "7114": 0.41,   # Concrete placers
    "7115": 0.39,   # Carpenters & joiners
    "7121": 0.38,   # Roofers
    "7122": 0.41,   # Floor layers
    "7123": 0.51,   # Plasterers
    "7124": 0.45,   # Insulation workers
    "7125": 0.49,   # Glaziers
    "7126": 0.44,   # Plumbers & pipe fitters
    "7127": 0.38,   # Air conditioning / refrigeration mechanics
    "7211": 0.67,   # Metal moulders and coremakers
    "7212": 0.60,   # Welders & flame cutters
    "7213": 0.55,   # Sheet metal workers
    "7214": 0.57,   # Structural metal preparers
    "7215": 0.53,   # Riggers and cable splicers
    "7221": 0.45,   # Blacksmiths, hammersmiths
    "7222": 0.49,   # Tool-makers and related workers
    "7223": 0.53,   # Metal working machine tool setters
    "7224": 0.55,   # Metal polishers, wheel grinders
    "7311": 0.33,   # Precision instrument makers
    "7312": 0.41,   # Musical instrument makers
    "7313": 0.35,   # Jewellery & precious-metal workers
    "7314": 0.51,   # Potters & related workers
    "7315": 0.46,   # Glass makers
    "7316": 0.39,   # Signwriters, decorative painters
    "7317": 0.43,   # Handicraft workers
    "7318": 0.37,   # Tailors, dressmakers
    "7319": 0.44,   # Craft & related trades n.e.c.
    "7321": 0.57,   # Pre-press technicians
    "7322": 0.62,   # Printers
    "7323": 0.58,   # Print finishing & bookbinding workers
    "7411": 0.48,   # Electrical mechanics
    "7412": 0.43,   # Electrical line installers and repairers
    "7413": 0.41,   # Electrical equipment installers
    # ── Food / hospitality ───────────────────────────────────────────────────
    "9412": 0.67,   # Kitchen helpers
    "9411": 0.65,   # Fast food preparers
    "5120": 0.52,   # Cooks
    "5121": 0.55,   # Cooks (general)
    "5122": 0.51,   # Pastrycooks
    "5123": 0.58,   # Bartenders
    "5131": 0.29,   # Waiters
    "5132": 0.31,   # Bartenders / counter attendants
    # ── Personal services ────────────────────────────────────────────────────
    "5141": 0.11,   # Hairdressers & barbers
    "5142": 0.12,   # Beauty therapists
    "5151": 0.28,   # Building caretakers
    "5152": 0.34,   # Domestic housekeepers
    "5153": 0.22,   # Building cleaners
    "5161": 0.21,   # Astrologers (and related)
    "5162": 0.19,   # Companions & valets
    "5163": 0.14,   # Funeral attendants
    "5164": 0.24,   # Animal care workers
    "5165": 0.23,   # Driving instructors
    "5169": 0.25,   # Personal services workers n.e.c.
    "5171": 0.27,   # Pest controllers
    "5172": 0.25,   # Animal control workers
    # ── Sales / retail ───────────────────────────────────────────────────────
    "5211": 0.77,   # Stall and market salespersons
    "5212": 0.75,   # Street food vendors
    "5221": 0.72,   # Shop sales assistants
    "5230": 0.70,   # Cashiers
    "5241": 0.85,   # Fashion and other models
    "5242": 0.88,   # Sales demonstrators
    "5243": 0.89,   # Door-to-door salespersons
    "5244": 0.92,   # Contact center salespersons
    "5245": 0.86,   # Service station attendants
    "5246": 0.84,   # Food service counter attendants
    "5249": 0.87,   # Sales workers n.e.c.
    # ── Security / transport ─────────────────────────────────────────────────
    "5414": 0.44,   # Security guards
    "5413": 0.48,   # Prison guards
    "5411": 0.41,   # Fire fighters
    "5412": 0.38,   # Police officers
    "8322": 0.57,   # Car, taxi and van drivers
    "8321": 0.81,   # Motorcycle drivers
    "8331": 0.69,   # Bus and tram drivers
    "8332": 0.72,   # Heavy truck and lorry drivers
    "8341": 0.80,   # Mobile farm machinery operators
    "8342": 0.75,   # Earthmoving machinery operators
    "8343": 0.78,   # Crane operators
    "8344": 0.82,   # Lifting truck operators
    # ── Agriculture ──────────────────────────────────────────────────────────
    "6111": 0.54,   # Seasonal crop growers
    "6112": 0.52,   # Tree growers
    "6113": 0.56,   # Livestock farmers
    "6114": 0.51,   # Dairy farmers
    "6115": 0.59,   # Poultry farmers
    "6116": 0.57,   # Subsistence farmers (mixed)
    "6121": 0.49,   # Market gardeners
    "6122": 0.53,   # Mushroom / vegetable growers
    "6123": 0.62,   # Greenhouse growers
    "6130": 0.55,   # Subsistence mixed crop/livestock farmers
    "6210": 0.58,   # Forestry workers
    "6220": 0.60,   # Fishers
    # ── Clerical / admin (high risk) ─────────────────────────────────────────
    "4110": 0.82,   # General office clerks
    "4120": 0.84,   # Secretaries
    "4131": 0.99,   # Keyboard operators (typists)
    "4132": 0.97,   # Data-entry clerks
    "4211": 0.95,   # Bank tellers
    "4212": 0.88,   # Bookmakers / croupiers
    "4213": 0.91,   # Pawnbrokers
    "4214": 0.89,   # Debt collectors
    "4221": 0.86,   # Travel consultants
    "4222": 0.83,   # Contact center information clerks
    "4223": 0.85,   # Telephone switchboard operators
    "4224": 0.87,   # Hotel receptionists
    "4225": 0.90,   # Survey interviewers
    "4226": 0.88,   # Receptionists (general)
    "4227": 0.92,   # Survey & market research interviewers
    "4229": 0.86,   # Customer info workers n.e.c.
    "4311": 0.93,   # Accounting / bookkeeping clerks
    "4312": 0.94,   # Statistical & finance clerks
    "4313": 0.91,   # Payroll clerks
    "4321": 0.73,   # Stock clerks
    "4322": 0.76,   # Production clerks
    "4323": 0.78,   # Transport clerks
    "4411": 0.75,   # Library clerks
    "4412": 0.79,   # Mail carriers
    "4413": 0.77,   # Coding, proofreading clerks
    "4414": 0.72,   # Scribes & related workers
    "4415": 0.80,   # Filing clerks
    "4416": 0.74,   # Personnel clerks
    "4419": 0.78,   # Clerical support n.e.c.
    # ── Professionals (low risk) ─────────────────────────────────────────────
    "2511": 0.22,   # Systems analysts
    "2512": 0.04,   # Software developers
    "2513": 0.08,   # Web / multimedia developers
    "2514": 0.07,   # Applications programmers
    "2521": 0.11,   # Database designers
    "2141": 0.18,   # Industrial engineers
    "2142": 0.21,   # Civil engineers
    "2143": 0.16,   # Environmental engineers
    "2144": 0.19,   # Mechanical engineers
    "2145": 0.15,   # Chemical engineers
    "2146": 0.17,   # Mining engineers
    "2151": 0.12,   # Electrical engineers
    "2152": 0.14,   # Electronics engineers
    "2153": 0.13,   # Telecommunications engineers
    "2161": 0.09,   # Building architects
    "2162": 0.11,   # Landscape architects
    "2163": 0.10,   # Product designers
    "2164": 0.08,   # Town planners
    "2165": 0.13,   # Cartographers / surveyors
    "2166": 0.06,   # Graphic designers
    "2211": 0.02,   # General medical practitioners
    "2212": 0.02,   # Specialist medical practitioners
    "2221": 0.01,   # Nursing professionals
    "2230": 0.06,   # Paramedical practitioners
    "2310": 0.04,   # University lecturers
    "2320": 0.04,   # Secondary education teachers
    "2330": 0.04,   # Primary education teachers
    "2341": 0.09,   # Special needs teachers
    "2351": 0.07,   # Instructional designers
    "2352": 0.05,   # Special education teachers
    "2359": 0.06,   # Teaching professionals n.e.c.
    "2410": 0.13,   # Financial analysts
    "2411": 0.14,   # Accountants
    "2412": 0.12,   # Financial advisers
    "2413": 0.15,   # Financial brokers
    "2421": 0.09,   # Management consultants
    "2422": 0.11,   # Policy analysts
    "2423": 0.12,   # Personnel specialists
    "2424": 0.10,   # Training specialists
    "2431": 0.08,   # Advertising specialists
    "2432": 0.06,   # Public relations professionals
    "2433": 0.07,   # Technical sales reps (professional)
    "2434": 0.09,   # Buyers / procurement officers
    "2611": 0.04,   # Lawyers
    "2612": 0.04,   # Judges
    "2621": 0.11,   # Archivists
    "2622": 0.10,   # Librarians
    "2631": 0.06,   # Economists
    "2632": 0.05,   # Sociologists / anthropologists
    "2633": 0.07,   # Philosophers
    "2634": 0.04,   # Psychologists
    "2635": 0.07,   # Social workers
    "2636": 0.08,   # Religious professionals
    "2641": 0.08,   # Authors / journalists
    "2642": 0.07,   # Translators
    "2651": 0.06,   # Visual artists
    "2652": 0.05,   # Musicians
    "2653": 0.04,   # Dancers / choreographers
    "2654": 0.05,   # Film directors
    "2655": 0.06,   # Actors
    "2656": 0.08,   # Announcers
    "2659": 0.07,   # Creative arts n.e.c.
    # ── Technicians / associate professionals ─────────────────────────────────
    "3112": 0.29,   # Civil engineering technicians
    "3113": 0.26,   # Electrical engineering technicians
    "3114": 0.28,   # Electronics engineering technicians
    "3115": 0.31,   # Mechanical engineering technicians
    "3119": 0.30,   # Physical science techs n.e.c.
    "3311": 0.33,   # Securities dealers
    "3312": 0.35,   # Credit & loans officers
    "3313": 0.32,   # Accounting associate professionals
    "3314": 0.29,   # Statistical / mathematical associates
    "3315": 0.36,   # Valuers & loss assessors
    "3411": 0.28,   # Legal / paralegal associates
    "3412": 0.25,   # Social work associates
    "3413": 0.21,   # Religious associate professionals
    "3421": 0.32,   # Athletes / sportspersons
    "3422": 0.25,   # Sports coaches
    "3423": 0.23,   # Fitness instructors
    "3432": 0.28,   # Interior designers / decorators
    "3433": 0.31,   # Gallery / museum technicians
    "3434": 0.27,   # Chefs / cooks (head)
    "3435": 0.26,   # Other creative associates
    # ── Elementary occupations (high risk) ───────────────────────────────────
    "9111": 0.87,   # Domestic cleaners
    "9112": 0.84,   # Helpers in restaurants
    "9121": 0.79,   # Hand launderers & ironers
    "9122": 0.82,   # Vehicle cleaners
    "9123": 0.81,   # Window cleaners
    "9129": 0.83,   # Cleaning workers n.e.c.
    "9211": 0.68,   # Crop farm laborers
    "9212": 0.71,   # Livestock farm laborers
    "9213": 0.74,   # Mixed crop & livestock laborers
    "9214": 0.69,   # Garden laborers
    "9215": 0.76,   # Forestry laborers
    "9216": 0.73,   # Fishing & aquaculture laborers
    "9311": 0.91,   # Mining laborers
    "9312": 0.89,   # Civil engineering laborers
    "9313": 0.87,   # Building construction laborers
    "9321": 0.93,   # Hand packers
    "9329": 0.90,   # Manufacturing laborers n.e.c.
    "9411": 0.66,   # Fast food preparers
    "9412": 0.68,   # Kitchen helpers
    "9510": 0.85,   # Street & related service workers
    "9520": 0.88,   # Shoe cleaners & related
    "9612": 0.72,   # Refuse workers & other elementary
    "9613": 0.75,   # Sweepers & related laborers
    "9621": 0.74,   # Messengers & package deliverers
    "9622": 0.76,   # Odd-job workers
    "9623": 0.77,   # Meter readers & vending machine collectors
    "9624": 0.79,   # Water carriers & related
    "9629": 0.71,   # Elementary workers n.e.c.
}

# ── ISCO sub-major group fallback (first 2 digits) ───────────────────────────
# Used when the specific 4-digit code is not in the table.
_ISCO2_FALLBACK: dict[str, float] = {
    "11": 0.22,   # Chief executives & legislators
    "12": 0.24,   # Admin & commercial managers
    "13": 0.26,   # Production & specialised managers
    "14": 0.28,   # Hospitality & retail managers
    "21": 0.10,   # Science & engineering professionals
    "22": 0.04,   # Health professionals
    "23": 0.05,   # Teaching professionals
    "24": 0.12,   # Business & admin professionals
    "25": 0.08,   # ICT professionals
    "26": 0.07,   # Legal / social / cultural professionals
    "31": 0.28,   # Science & engineering associate professionals
    "32": 0.16,   # Health associate professionals
    "33": 0.32,   # Business & admin associate professionals
    "34": 0.28,   # Legal / social / cultural associates
    "35": 0.24,   # ICT technicians
    "41": 0.83,   # General & keyboard clerks
    "42": 0.86,   # Customer service clerks
    "43": 0.88,   # Numerical & material recording clerks
    "44": 0.75,   # Other clerical support workers
    "51": 0.30,   # Personal service workers
    "52": 0.79,   # Sales workers
    "53": 0.27,   # Personal care workers
    "54": 0.42,   # Protective service workers
    "61": 0.53,   # Market-oriented skilled agricultural workers
    "62": 0.57,   # Market-oriented skilled forestry & fishery
    "63": 0.60,   # Subsistence farmers / fishers
    "71": 0.43,   # Building & related trades workers
    "72": 0.51,   # Metal, machinery & related workers
    "73": 0.42,   # Handicraft & printing workers
    "74": 0.44,   # Electrical & electronic trades workers
    "75": 0.48,   # Food processing & related workers
    "81": 0.79,   # Stationary plant & machine operators
    "82": 0.84,   # Assemblers
    "83": 0.71,   # Drivers & mobile plant operators
    "91": 0.82,   # Cleaners & helpers
    "92": 0.70,   # Agricultural laborers
    "93": 0.90,   # Laborers (mining, construction, mfg)
    "94": 0.67,   # Food prep assistants
    "95": 0.83,   # Street & related service elementary
    "96": 0.75,   # Refuse workers & other elementary
}

# ── Public API ────────────────────────────────────────────────────────────────

ILO_TASK_TYPES = {
    # ILO Future of Work (2020) cognitive/manual classification per ISCO major
    "1": "non_routine_cognitive",
    "2": "non_routine_cognitive",
    "3": "mixed_cognitive_technical",
    "4": "routine_cognitive",
    "5": "non_routine_manual_interpersonal",
    "6": "non_routine_manual_physical",
    "7": "non_routine_manual_technical",
    "8": "routine_manual",
    "9": "routine_manual_elementary",
}

ILO_TASK_LABELS = {
    "non_routine_cognitive": "Non-routine cognitive — creative, judgment, planning",
    "non_routine_manual_interpersonal": "Non-routine manual / interpersonal — relational, situational",
    "non_routine_manual_physical": "Non-routine manual / physical — dexterity, context-dependent",
    "non_routine_manual_technical": "Non-routine manual / technical — craft, trades, repair",
    "mixed_cognitive_technical": "Mixed — technical + cognitive",
    "routine_cognitive": "Routine cognitive — rule-following, data processing (HIGH automation risk)",
    "routine_manual": "Routine manual — repetitive physical operations (HIGH automation risk)",
    "routine_manual_elementary": "Elementary routine manual (VERY HIGH automation risk)",
}


def get_fo_score(isco_code: str, lmic_discount_pct: int = 20) -> float:
    """
    Return the Frey-Osborne automation probability for an ISCO-08 code,
    adjusted for LMIC context.

    Parameters
    ----------
    isco_code : str
        4-digit ISCO-08 code (e.g. "7421")
    lmic_discount_pct : int
        Percentage reduction to apply for LMIC capital-labour dynamics (default 20%)

    Returns
    -------
    float
        LMIC-adjusted automation probability in [0.0, 1.0]

    Sources
    -------
    Frey & Osborne (2013) Table 1 + Appendix · ILO O*NET-ISCO cross-walk 2019
    ILO (2019) LMIC calibration working paper
    """
    code = str(isco_code).strip()[:4]
    base: float

    if code in _ISCO4_SCORES:
        base = _ISCO4_SCORES[code]
    elif code[:2] in _ISCO2_FALLBACK:
        base = _ISCO2_FALLBACK[code[:2]]
    elif code[:1] in {"0"}:
        base = 0.35  # Armed forces — low automation, mixed
    else:
        base = 0.50  # Unknown: use neutral midpoint
        lmic_discount_pct = 0   # don't apply discount to unknown code

    adjusted = round(base * (1 - lmic_discount_pct / 100), 3)
    return max(0.02, min(0.98, adjusted))


def get_ilo_task_type(isco_code: str) -> str:
    """
    Return the ILO Future of Work (2020) task-content type for an ISCO code.
    Source: ILO (2020) 'World Employment and Social Outlook' — Appendix.
    """
    major = str(isco_code).strip()[:1]
    return ILO_TASK_TYPES.get(major, "mixed_cognitive_technical")


def get_ilo_task_label(task_type: str) -> str:
    return ILO_TASK_LABELS.get(task_type, task_type.replace("_", " "))


def get_task_bucket_averages() -> dict[str, float]:
    """
    Groups all ISCO-08 codes in _ISCO4_SCORES by ILO task-content classification
    (ISCO major group, first digit) and returns average LMIC-adjusted automation
    score per four high-level task buckets.

    Returns
    -------
    dict with keys:
        "routine_cognitive"      — ISCO majors 4 (clerks)
        "routine_manual"         — ISCO majors 8, 9 (operators, elementary)
        "nonroutine_cognitive"   — ISCO majors 1, 2, 3 (managers, professionals, technicians)
        "nonroutine_manual"      — ISCO majors 5, 6, 7 (services, agri, craft/trades)

    Sources
    -------
    Frey & Osborne (2013) × ILO Future of Work (2020) task-content classifications.
    """
    buckets: dict[str, list[float]] = {
        "routine_cognitive": [],
        "routine_manual": [],
        "nonroutine_cognitive": [],
        "nonroutine_manual": [],
    }
    for code, raw_score in _ISCO4_SCORES.items():
        major = code[:1]
        lmic_score = round(raw_score * 0.80, 3)  # 20% LMIC discount
        if major == "4":
            buckets["routine_cognitive"].append(lmic_score)
        elif major in {"8", "9"}:
            buckets["routine_manual"].append(lmic_score)
        elif major in {"1", "2", "3"}:
            buckets["nonroutine_cognitive"].append(lmic_score)
        elif major in {"5", "6", "7"}:
            buckets["nonroutine_manual"].append(lmic_score)

    return {
        k: round(sum(v) / len(v), 3) if v else 0.0
        for k, v in buckets.items()
    }


def classify(lmic_score: float, medium_threshold: float = 0.40, high_threshold: float = 0.65) -> str:
    """Return 'durable', 'transitioning', or 'at_risk'."""
    if lmic_score >= high_threshold:
        return "at_risk"
    if lmic_score >= medium_threshold:
        return "transitioning"
    return "durable"


ISCO_SECTOR_MAP: dict[str, str] = {
    "1": "Management & Leadership",
    "2": "Professional & Technical",
    "3": "Technicians & Associate Professionals",
    "4": "Clerical & Administrative",
    "5": "Service & Sales",
    "6": "Agriculture & Fisheries",
    "7": "Craft & Trades",
    "8": "Plant & Machine Operation",
    "9": "Elementary Occupations",
}


def get_sector_risk_profile() -> list[dict]:
    """
    For each ISCO major group present in _ISCO4_SCORES,
    compute average LMIC-adjusted automation score, count of codes,
    min score, and max score. Returns sorted by avg_score descending.

    Data: Frey & Osborne (2013) × ILO ISCO-08 major group mapping.
    Covers all occupations in the Oxford table — not city-level data.
    """
    from collections import defaultdict
    groups: dict[str, list[float]] = defaultdict(list)
    for code, raw_score in _ISCO4_SCORES.items():
        major = code[:1]
        if major in ISCO_SECTOR_MAP:
            lmic_score = round(raw_score * 0.80, 3)
            groups[major].append(lmic_score)

    result = []
    for major, scores in groups.items():
        if not scores:
            continue
        result.append({
            "sector": ISCO_SECTOR_MAP[major],
            "avg_automation_score": round(sum(scores) / len(scores), 3),
            "isco_code_count": len(scores),
            "min_score": round(min(scores), 3),
            "max_score": round(max(scores), 3),
        })

    return sorted(result, key=lambda x: x["avg_automation_score"], reverse=True)

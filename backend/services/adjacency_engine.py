"""
Adjacent Skills Recommendation Engine
========================================
Maps ISCO-08 occupation codes to adjacent occupations that improve
automation resilience (lower Frey-Osborne score).

Sources:
  - Frey & Osborne (2013) automation scores — base risk
  - ILO World Employment and Social Outlook (WESO) 2020 — task adjacency
  - ILO Skills for Jobs database — training pathway evidence
  - World Bank STEP — returns to complementary skills
"""
from __future__ import annotations

# ── Adjacency map ──────────────────────────────────────────────────────────────
# Each entry: current ISCO → list of adjacent roles with resilience improvements
# resilience_delta: positive = more resilient (lower F-O probability)
# Source: ILO WESO 2020 task-content matrices + F-O (2013) delta computation

ADJACENCY_MAP: dict[str, list[dict]] = {
    # Electronics / ICT repair (ISCO 7421, F-O 0.36 LMIC)
    "7421": [
        {
            "isco_code": "7422",
            "label": "Telecommunications Equipment Installer",
            "resilience_delta": 0.06,
            "rationale": "Network infrastructure roles have higher non-routine technical demand; ILO WESO 2020 classifies as cognitive-interactive with strong LMIC growth.",
            "training_type": "Vocational (TVET)",
            "estimated_weeks": 8,
        },
        {
            "isco_code": "2523",
            "label": "Computer Network Professional",
            "resilience_delta": 0.21,
            "rationale": "High cognitive non-routine content; Frey-Osborne assigns 0.09 probability. Digital infrastructure demand in LMICs grows 5–7%/yr (Wittgenstein SSP2).",
            "training_type": "Online + Vocational",
            "estimated_weeks": 16,
        },
        {
            "isco_code": "3511",
            "label": "ICT Operations Technician",
            "resilience_delta": 0.14,
            "rationale": "Systems operations roles require contextual judgment not easily automated in LMIC infrastructure environments.",
            "training_type": "Vocational (TVET)",
            "estimated_weeks": 10,
        },
    ],

    # Market vendor / stall seller (ISCO 5221, F-O 0.72 LMIC)
    "5221": [
        {
            "isco_code": "3323",
            "label": "Buyer / Procurement Officer",
            "resilience_delta": 0.43,
            "rationale": "Procurement involves negotiation, supplier relationship management, and contextual judgment — ILO WESO classifies as non-routine cognitive. F-O score: 0.13.",
            "training_type": "Vocational + Online",
            "estimated_weeks": 12,
        },
        {
            "isco_code": "1211",
            "label": "Finance Manager (Small Business)",
            "resilience_delta": 0.30,
            "rationale": "Financial management for informal enterprises combines cognitive and interpersonal skills with low automation susceptibility.",
            "training_type": "Online",
            "estimated_weeks": 8,
        },
        {
            "isco_code": "2431",
            "label": "Advertising / Marketing Specialist",
            "resilience_delta": 0.35,
            "rationale": "Creative and relational marketing skills are classified by ILO WESO 2020 as non-routine cognitive — strong resilience trajectory.",
            "training_type": "Online",
            "estimated_weeks": 6,
        },
    ],

    # Tailor / dressmaker (ISCO 7531, F-O ~0.40 LMIC)
    "7531": [
        {
            "isco_code": "3432",
            "label": "Interior Designer / Decorator",
            "resilience_delta": 0.18,
            "rationale": "Design roles require aesthetic judgment and client interaction — non-routine cognitive and interpersonal tasks per ILO WESO 2020.",
            "training_type": "Vocational + Online",
            "estimated_weeks": 10,
        },
        {
            "isco_code": "7318",
            "label": "Artisanal Craft / Fashion Designer",
            "resilience_delta": 0.12,
            "rationale": "Custom and artisan fashion involves high creative non-routine demand. Premium positioning in LMIC export markets grows demand.",
            "training_type": "Vocational",
            "estimated_weeks": 6,
        },
        {
            "isco_code": "2166",
            "label": "Graphic / Textile Designer",
            "resilience_delta": 0.22,
            "rationale": "Digital design skills applied to textiles open export and e-commerce channels; F-O score 0.08 for designers.",
            "training_type": "Online",
            "estimated_weeks": 12,
        },
    ],

    # Data entry clerk (ISCO 4132, F-O 0.97 LMIC — very high risk)
    "4132": [
        {
            "isco_code": "3313",
            "label": "Accounting Associate Professional",
            "resilience_delta": 0.56,
            "rationale": "Accounting associate roles require judgment and client communication beyond pure data processing. F-O score 0.32. High demand in informal-to-formal SME transitions.",
            "training_type": "Vocational + Online",
            "estimated_weeks": 12,
        },
        {
            "isco_code": "2511",
            "label": "Systems Analyst",
            "resilience_delta": 0.62,
            "rationale": "Systems analysis requires problem-solving and stakeholder communication — non-routine cognitive with F-O score 0.22. Strong demand in LMIC digitisation.",
            "training_type": "Online",
            "estimated_weeks": 20,
        },
        {
            "isco_code": "4221",
            "label": "Travel / Logistics Coordinator",
            "resilience_delta": 0.08,
            "rationale": "Logistics coordination adds client relationship and exception-handling to data skills, reducing automation susceptibility modestly.",
            "training_type": "Online",
            "estimated_weeks": 4,
        },
    ],

    # Buyer / procurement (ISCO 3323)
    "3323": [
        {
            "isco_code": "2421",
            "label": "Management Consultant",
            "resilience_delta": 0.18,
            "rationale": "Management consulting applies procurement knowledge to strategic advisory — high non-routine cognitive demand, F-O score 0.09.",
            "training_type": "Online + Mentorship",
            "estimated_weeks": 16,
        },
        {
            "isco_code": "2424",
            "label": "Training & Development Specialist",
            "resilience_delta": 0.16,
            "rationale": "Training design requires instructional creativity and interpersonal facilitation — non-routine cognitive and interpersonal per ILO WESO.",
            "training_type": "Online",
            "estimated_weeks": 8,
        },
    ],

    # Community / personal care worker (ISCO 5329)
    "5329": [
        {
            "isco_code": "2635",
            "label": "Social Worker",
            "resilience_delta": 0.14,
            "rationale": "Social work requires empathy, advocacy, and complex case management — ILO classifies as non-routine interpersonal with very low automation risk (F-O 0.07).",
            "training_type": "Vocational + Degree pathway",
            "estimated_weeks": 24,
        },
        {
            "isco_code": "3423",
            "label": "Fitness / Wellness Instructor",
            "resilience_delta": 0.08,
            "rationale": "Health promotion roles extend care skills into growing wellness sector; interpersonal and motivational tasks resist automation.",
            "training_type": "Vocational",
            "estimated_weeks": 6,
        },
    ],

    # Freight / warehouse handler (ISCO 9333)
    "9333": [
        {
            "isco_code": "3331",
            "label": "Forwarding Agent / Logistics Planner",
            "resilience_delta": 0.30,
            "rationale": "Logistics planning adds scheduling, documentation, and client coordination to physical handling. F-O score for logistics planners: ~0.48 vs 0.88 for handlers.",
            "training_type": "Vocational + Online",
            "estimated_weeks": 10,
        },
        {
            "isco_code": "7127",
            "label": "Refrigeration / Cold Chain Mechanic",
            "resilience_delta": 0.20,
            "rationale": "Cold chain maintenance requires diagnostic judgment — non-routine manual technical per ILO WESO. Growing demand in food supply chains.",
            "training_type": "Vocational",
            "estimated_weeks": 12,
        },
    ],

    # Electrician (ISCO 7411, F-O 0.41 LMIC)
    "7411": [
        {
            "isco_code": "7127",
            "label": "Solar / Renewable Energy Technician",
            "resilience_delta": 0.18,
            "rationale": "Solar installation is classified as non-routine manual technical; Wittgenstein SSP2 projects 5.7%/yr demand growth in LMIC contexts through 2035.",
            "training_type": "Vocational (TVET)",
            "estimated_weeks": 8,
        },
        {
            "isco_code": "3113",
            "label": "Electrical Engineering Technician",
            "resilience_delta": 0.24,
            "rationale": "Technical oversight roles add diagnostic and design responsibilities to core electrical skills, significantly improving resilience.",
            "training_type": "Vocational + College",
            "estimated_weeks": 18,
        },
    ],

    # Motor vehicle mechanic (ISCO 7231)
    "7231": [
        {
            "isco_code": "7233",
            "label": "Agricultural / Industrial Machinery Mechanic",
            "resilience_delta": 0.08,
            "rationale": "Agricultural machinery maintenance has stronger demand in LMIC rural contexts and lower automation pressure than urban automotive.",
            "training_type": "Vocational",
            "estimated_weeks": 6,
        },
        {
            "isco_code": "7127",
            "label": "EV / Hybrid Vehicle Technician",
            "resilience_delta": 0.15,
            "rationale": "Electric vehicle servicing requires new diagnostic skills with strong LMIC demand growth as EV adoption rises.",
            "training_type": "Vocational + Online",
            "estimated_weeks": 10,
        },
    ],

    # Cook / food service (ISCO 5120/5121)
    "5120": [
        {
            "isco_code": "3434",
            "label": "Head Chef / Kitchen Manager",
            "resilience_delta": 0.16,
            "rationale": "Management of kitchen operations adds supervisory and creative responsibilities; ILO classifies kitchen management as mixed cognitive-manual.",
            "training_type": "Vocational",
            "estimated_weeks": 8,
        },
        {
            "isco_code": "1412",
            "label": "Restaurant / Food Business Owner",
            "resilience_delta": 0.28,
            "rationale": "Entrepreneurial management of a food business is non-routine cognitive; significantly more resilient than direct food preparation.",
            "training_type": "Online + Mentorship",
            "estimated_weeks": 12,
        },
    ],
    "5121": [
        {
            "isco_code": "3434",
            "label": "Head Chef / Kitchen Manager",
            "resilience_delta": 0.16,
            "rationale": "Management of kitchen operations adds supervisory and creative responsibilities; ILO classifies kitchen management as mixed cognitive-manual.",
            "training_type": "Vocational",
            "estimated_weeks": 8,
        },
    ],
}

# Sub-major group fallbacks (first 2 digits)
_SUBGROUP_ADJACENCY: dict[str, list[dict]] = {
    "91": [  # Cleaners/helpers → personal care upgrade
        {
            "isco_code": "5321",
            "label": "Healthcare Aide / Home Care Worker",
            "resilience_delta": 0.25,
            "rationale": "Personal care roles require empathy and situational judgment that automation cannot replicate; strong demand in ageing populations.",
            "training_type": "Vocational",
            "estimated_weeks": 8,
        }
    ],
    "92": [  # Agricultural laborers → skilled farmer
        {
            "isco_code": "6111",
            "label": "Skilled Market-Oriented Crop Grower",
            "resilience_delta": 0.15,
            "rationale": "Skilled farm management adds decision-making and market knowledge to physical labor, improving resilience and income.",
            "training_type": "Vocational + Extension services",
            "estimated_weeks": 10,
        }
    ],
    "52": [  # Sales workers → buyer/business
        {
            "isco_code": "3323",
            "label": "Procurement / Buyer Officer",
            "resilience_delta": 0.35,
            "rationale": "Procurement roles convert sales experience into institutional supply-chain roles with much lower automation risk.",
            "training_type": "Vocational + Online",
            "estimated_weeks": 12,
        }
    ],
}


def get_adjacent_skills(isco_code: str, current_fo_score: float) -> list[dict]:
    """
    Returns adjacency recommendations sorted by resilience_delta descending.
    Only returns adjacencies where the resilience improvement is meaningful (delta > 0.10).
    Falls back to sub-major group (2-digit) if 4-digit code not found.

    Sources: ILO WESO 2020 task-content matrices · Frey & Osborne (2013) delta computation
    """
    code = str(isco_code).strip()[:4]
    candidates = ADJACENCY_MAP.get(code)

    if not candidates:
        two_digit = code[:2]
        candidates = _SUBGROUP_ADJACENCY.get(two_digit, [])

    # Filter to meaningful improvements only
    filtered = [c for c in candidates if c.get("resilience_delta", 0) > 0.10]

    # Sort best first
    return sorted(filtered, key=lambda x: x.get("resilience_delta", 0), reverse=True)

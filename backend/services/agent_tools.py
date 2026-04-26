"""
Pipeline Tool Declarations for the UNMAPPED Agent Orchestrator.

These are thin Gemini function declaration wrappers — they define the schema
the agent uses to decide what to call. Actual implementations live in
agent_orchestrator.py which routes each call to the real pipeline functions.

None of the underlying pipeline files are modified:
  ai_engine.py · frey_osborne.py · skill_enricher.py · adjacency_engine.py
"""
from google.genai import types

PIPELINE_TOOLS = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="extract_skills",
            description=(
                "Parse the worker narrative and extract a structured "
                "list of skills with suggested ISCO-08 codes. "
                "Always call this first. Returns raw skill list and user city."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "narrative": types.Schema(
                        type=types.Type.STRING,
                        description="The worker's raw narrative text",
                    ),
                    "narrative_quality": types.Schema(
                        type=types.Type.STRING,
                        enum=["sufficient", "ambiguous", "too_short"],
                        description=(
                            "Your assessment of narrative quality before calling. "
                            "If ambiguous or too_short, call ask_clarification first."
                        ),
                    ),
                },
                required=["narrative", "narrative_quality"],
            ),
        ),
        types.FunctionDeclaration(
            name="ask_clarification",
            description=(
                "Ask the worker one targeted question when the narrative is too "
                "ambiguous or short to extract skills accurately. "
                "Only call this ONCE. Only call if narrative_quality is "
                "ambiguous or too_short."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "question": types.Schema(
                        type=types.Type.STRING,
                        description=(
                            "One specific question answerable in 1-2 sentences. "
                            "Example: 'Do you mainly fix phones, or also TVs and appliances?'"
                        ),
                    ),
                },
                required=["question"],
            ),
        ),
        types.FunctionDeclaration(
            name="score_skill",
            description=(
                "Look up the Frey-Osborne automation score for one skill by ISCO code. "
                "Call this for every skill extracted. "
                "Returns automation probability and LMIC-calibrated status."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "isco_code": types.Schema(
                        type=types.Type.STRING,
                        description="4-digit ISCO-08 code",
                    ),
                    "locale_code": types.Schema(
                        type=types.Type.STRING,
                        description="gh or pk",
                    ),
                },
                required=["isco_code", "locale_code"],
            ),
        ),
        types.FunctionDeclaration(
            name="search_market",
            description=(
                "Search for live job market evidence for one skill in the worker's city "
                "using Tavily. Do NOT call for every skill. "
                "Only call for the 1-2 most important skills where market evidence "
                "would meaningfully change the assessment. Skip routine or secondary skills."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "skill_label": types.Schema(
                        type=types.Type.STRING,
                        description="Human-readable skill name",
                    ),
                    "isco_code": types.Schema(
                        type=types.Type.STRING,
                        description="ISCO-08 code for this skill",
                    ),
                    "city": types.Schema(
                        type=types.Type.STRING,
                        description="Worker's city",
                    ),
                    "reason": types.Schema(
                        type=types.Type.STRING,
                        description=(
                            "Why you chose to search for this specific skill. "
                            "This is logged for transparency."
                        ),
                    ),
                },
                required=["skill_label", "city", "reason"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_adjacent_skills",
            description=(
                "Get adjacent ISCO codes that would improve resilience for a given skill. "
                "Call after scoring each skill. Returns training pathways and resilience delta."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "isco_code": types.Schema(
                        type=types.Type.STRING,
                        description="ISCO-08 code to find adjacencies for",
                    ),
                    "automation_score": types.Schema(
                        type=types.Type.NUMBER,
                        description="Current Frey-Osborne LMIC-adjusted score for this skill",
                    ),
                },
                required=["isco_code", "automation_score"],
            ),
        ),
    ]
)

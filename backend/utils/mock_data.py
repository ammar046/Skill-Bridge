"""
DEPRECATED — All econometric data now served from backend/config/locales.json
via backend/config/loader.py and live World Bank WDI via backend/services/institutional_data.py.

This file is kept only to avoid breaking any import that has not yet been migrated.
Do NOT add new data here.
"""

# Legacy stub — no synthetic values
def get_locale_signal(locale: str) -> dict:  # noqa: ARG001
    """
    DEPRECATED. Use config.loader.get_econometric_signal() instead.
    Returns an empty dict so callers surface an explicit missing-data error
    rather than silently using synthetic values.
    """
    return {}

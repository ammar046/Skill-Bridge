ILO_LOCALE_SIGNALS: dict[str, dict[str, str]] = {
    "gh": {
        "wage_floor": "GHS 1850",
        "growth_percent": "+3.8%",
    },
    "pk": {
        "wage_floor": "PKR 35000",
        "growth_percent": "+2.9%",
    },
}


def get_locale_signal(locale: str) -> dict[str, str]:
    locale_key = (locale or "").strip().lower()
    return ILO_LOCALE_SIGNALS.get(
        locale_key,
        {
            "wage_floor": "Local benchmark unavailable",
            "growth_percent": "N/A",
        },
    )

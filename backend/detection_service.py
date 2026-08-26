from schemas import AlertCreate


KEYWORD_RULES = {
    "smoke": (
        "Smoke Detected Near Generator",
        "critical",
        "Possible smoke plume seen close to generator housing.",
        "Trigger emergency ventilation check and inspect generator room immediately.",
    ),
    "leak": (
        "Fluid Leak Suspected",
        "high",
        "Potential fluid leakage pattern detected in bilge area.",
        "Inspect pipes and seals, isolate affected section, and deploy absorbent pads.",
    ),
    "overheat": (
        "Engine Overheating Signal",
        "high",
        "Thermal signature indicates overheating around main engine block.",
        "Reduce engine load and inspect cooling loop and circulation pumps.",
    ),
}


def analyze_frame(frame_label: str) -> AlertCreate | None:
    lower_label = frame_label.lower()

    for keyword, (title, severity, description, recommendations) in KEYWORD_RULES.items():
        if keyword in lower_label:
            return AlertCreate(
                title=title,
                severity=severity,
                source="engine-room-camera",
                description=description,
                recommendations=recommendations,
            )

    return None

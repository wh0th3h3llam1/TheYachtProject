def generate_explanation(
    anomaly_type: str, severity: str, confidence: float, camera_id: str
) -> tuple[str, str]:
    """
    Deterministic mock of a local LLM explanation generator.
    Returns (explanation, recommended_action).
    """
    normalized_type = anomaly_type.lower()
    normalized_severity = severity.upper()
    confidence_percent = round(confidence * 100, 1)

    templates = {
        "smoke": (
            "Local model analysis indicates possible smoke signature in camera "
            f"'{camera_id}', suggesting overheating or early fire risk "
            f"({confidence_percent}% confidence, severity {normalized_severity}).",
            "Perform immediate physical inspection, verify heat sources, and follow fire safety protocol.",
        ),
        "leak": (
            "Local model analysis indicates a possible fluid leak pattern in camera "
            f"'{camera_id}' ({confidence_percent}% confidence, severity {normalized_severity}).",
            "Check pipes, hoses, and the bilge area; isolate the suspected source and monitor spread.",
        ),
        "overheating": (
            "Local model analysis indicates a thermal anomaly in camera "
            f"'{camera_id}', consistent with overheating risk "
            f"({confidence_percent}% confidence, severity {normalized_severity}).",
            "Inspect cooling system flow, confirm engine temperature readings, and reduce load if necessary.",
        ),
        "abnormal_motion": (
            "Local model analysis detected unusual movement in camera "
            f"'{camera_id}' ({confidence_percent}% confidence, severity {normalized_severity}).",
            "Check for loose components, vibration sources, or unauthorized presence in the monitored zone.",
        ),
    }

    default_response = (
        "Local model analysis detected an unspecified anomaly in camera "
        f"'{camera_id}' ({confidence_percent}% confidence, severity {normalized_severity}).",
        "Inspect the area and verify sensor/camera context before taking corrective action.",
    )

    return templates.get(normalized_type, default_response)

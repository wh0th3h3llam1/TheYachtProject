from sqlalchemy.orm import Session

from llm_service import generate_explanation
from models import Alert
from schemas import AlertCreate

SEVERITY_ORDER = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}


def _base_severity_from_confidence(confidence: float) -> str:
    if confidence < 0.60:
        return "LOW"
    if confidence < 0.75:
        return "MEDIUM"
    if confidence < 0.90:
        return "HIGH"
    return "CRITICAL"


def _max_severity(current: str, minimum: str) -> str:
    if SEVERITY_ORDER[current] >= SEVERITY_ORDER[minimum]:
        return current
    return minimum


def classify_severity(anomaly_type: str, confidence: float) -> str:
    severity = _base_severity_from_confidence(confidence)
    normalized_type = anomaly_type.lower()

    if normalized_type == "smoke" and confidence >= 0.70:
        severity = _max_severity(severity, "HIGH")
    elif normalized_type == "overheating" and confidence >= 0.75:
        severity = _max_severity(severity, "HIGH")
    elif normalized_type == "leak" and confidence >= 0.60:
        severity = _max_severity(severity, "MEDIUM")
    elif normalized_type == "abnormal_motion" and confidence >= 0.60:
        severity = _max_severity(severity, "MEDIUM")

    return severity


def process_detection_event(detection: dict) -> dict:
    camera_id = detection["camera_id"]
    anomaly_type = detection["anomaly_type"]
    confidence = float(detection["confidence"])

    severity = classify_severity(anomaly_type=anomaly_type, confidence=confidence)
    explanation, recommended_action = generate_explanation(
        anomaly_type=anomaly_type,
        severity=severity,
        confidence=confidence,
        camera_id=camera_id,
    )

    return {
        "camera_id": camera_id,
        "anomaly_type": anomaly_type,
        "confidence": confidence,
        "severity": severity,
        "status": "ACTIVE",
        "explanation": explanation,
        "recommended_action": recommended_action,
    }


def process_detection(
    db: Session, camera_id: str, anomaly_type: str, confidence: float
) -> Alert:
    normalized_payload = process_detection_event(
        {
            "camera_id": camera_id,
            "anomaly_type": anomaly_type,
            "confidence": confidence,
        }
    )

    alert_data = AlertCreate(
        camera_id=normalized_payload["camera_id"],
        anomaly_type=normalized_payload["anomaly_type"],
        severity=normalized_payload["severity"].lower(),
        confidence=normalized_payload["confidence"],
        status=normalized_payload["status"].lower(),
        explanation=normalized_payload["explanation"],
        recommended_action=normalized_payload["recommended_action"],
    )

    alert = Alert(**alert_data.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

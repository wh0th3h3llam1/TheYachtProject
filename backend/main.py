import os
import shutil
from pathlib import Path

import cv2
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import Base, engine, get_db
from event_processor import process_detection
from schemas import AlertRead, HealthResponse, SimulateDetectionRequest

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Yacht Monitoring Prototype API")
SAMPLE_VIDEOS_DIR = Path(__file__).resolve().parent / "sample_videos"
SAMPLE_VIDEOS_DIR.mkdir(exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> HealthResponse:
    return {"status": "ok"}


@app.get("/alerts", response_model=list[AlertRead])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()


@app.get("/alerts/{alert_id}", response_model=AlertRead)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@app.post("/simulate-detection", response_model=AlertRead)
def simulate_detection(payload: SimulateDetectionRequest, db: Session = Depends(get_db)):
    return process_detection(
        db=db,
        camera_id=payload.camera_id,
        anomaly_type=payload.anomaly_type,
        confidence=payload.confidence,
    )


@app.put("/alerts/{alert_id}/acknowledge", response_model=AlertRead)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    db.commit()
    db.refresh(alert)
    return alert


@app.put("/alerts/{alert_id}/resolve", response_model=AlertRead)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "resolved"
    db.commit()
    db.refresh(alert)
    return alert


@app.post("/process-video")
def process_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    saved_path = SAMPLE_VIDEOS_DIR / file.filename

    with saved_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    capture = cv2.VideoCapture(str(saved_path))
    if not capture.isOpened():
        raise HTTPException(status_code=400, detail="Unable to open uploaded video")

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    smoke_threshold = int(total_frames * 0.30) if total_frames > 0 else 30
    leak_threshold = int(total_frames * 0.60) if total_frames > 0 else 60

    frames_processed = 0
    alerts_created = []
    smoke_created = False
    leak_created = False

    while True:
        success, _ = capture.read()
        if not success:
            break

        frames_processed += 1

        if not smoke_created and frames_processed >= smoke_threshold:
            smoke_alert = process_detection(
                db=db,
                camera_id="engine_room_cam_1",
                anomaly_type="smoke",
                confidence=0.86,
            )
            alerts_created.append(smoke_alert.id)
            smoke_created = True

        if not leak_created and frames_processed >= leak_threshold:
            leak_alert = process_detection(
                db=db,
                camera_id="engine_room_cam_1",
                anomaly_type="leak",
                confidence=0.72,
            )
            alerts_created.append(leak_alert.id)
            leak_created = True

    capture.release()
    file.file.close()

    return {
        "video_filename": os.path.basename(saved_path),
        "frames_processed": frames_processed,
        "alerts_created": len(alerts_created),
        "processing_status": "completed",
    }

import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  acknowledgeAlert,
  fetchAlert,
  fetchAlerts,
  fetchHealth,
  processVideo,
  resolveAlert,
  simulateDetection
} from "./api";

const SIMULATION_BUTTONS = [
  { label: "Simulate Smoke", anomalyType: "smoke", confidence: 0.86 },
  { label: "Simulate Leak", anomalyType: "leak", confidence: 0.72 },
  { label: "Simulate Overheating", anomalyType: "overheating", confidence: 0.91 },
  {
    label: "Simulate Abnormal Motion",
    anomalyType: "abnormal_motion",
    confidence: 0.67
  }
];

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [healthStatus, setHealthStatus] = useState("unknown");
  const [uploadFile, setUploadFile] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const activeCount = useMemo(
    () => alerts.filter((alert) => alert.status === "active").length,
    [alerts]
  );
  const acknowledgedCount = useMemo(
    () => alerts.filter((alert) => alert.status === "acknowledged").length,
    [alerts]
  );
  const resolvedCount = useMemo(
    () => alerts.filter((alert) => alert.status === "resolved").length,
    [alerts]
  );
  const latestAlerts = useMemo(() => alerts.slice(0, 5), [alerts]);
  const systemReadiness = useMemo(() => {
    if (healthStatus !== "ok") {
      return "Degraded";
    }
    if (activeCount >= 5) {
      return "Attention Required";
    }
    return "Operational";
  }, [activeCount, healthStatus]);
  const criticalCount = useMemo(
    () => alerts.filter((alert) => alert.severity === "critical").length,
    [alerts]
  );
  const avgConfidence = useMemo(() => {
    if (alerts.length === 0) {
      return "0.00";
    }
    const total = alerts.reduce((sum, alert) => sum + Number(alert.confidence || 0), 0);
    return (total / alerts.length).toFixed(2);
  }, [alerts]);

  async function refreshData() {
    const [health, fetchedAlerts] = await Promise.all([fetchHealth(), fetchAlerts()]);
    setHealthStatus(health.status);
    setAlerts(fetchedAlerts);
  }

  useEffect(() => {
    refreshData().catch((error) => setMessage(error.message));
    const intervalId = setInterval(() => {
      refreshData().catch(() => null);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  async function handleSimulate(anomalyType, confidence) {
    setLoading(true);
    setMessage("");
    try {
      const created = await simulateDetection({
        camera_id: "engine_room_cam_1",
        anomaly_type: anomalyType,
        confidence
      });
      await refreshData();
      setSelectedAlert(created);
      setMessage(`Created ${anomalyType} alert successfully.`);
    } catch (error) {
      setMessage(`Simulation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessVideo(event) {
    event.preventDefault();
    if (!uploadFile) {
      setMessage("Please select a video file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await processVideo(uploadFile);
      setVideoResult(result);
      await refreshData();
      setMessage("Video processed successfully.");
    } catch (error) {
      setMessage(`Video processing failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectAlert(alertId) {
    try {
      const detail = await fetchAlert(alertId);
      setSelectedAlert(detail);
    } catch (error) {
      setMessage(`Unable to load alert details: ${error.message}`);
    }
  }

  async function handleAcknowledge(alertId) {
    setLoading(true);
    try {
      const updated = await acknowledgeAlert(alertId);
      setSelectedAlert(updated);
      await refreshData();
    } catch (error) {
      setMessage(`Acknowledge failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(alertId) {
    setLoading(true);
    try {
      const updated = await resolveAlert(alertId);
      setSelectedAlert(updated);
      await refreshData();
    } catch (error) {
      setMessage(`Resolve failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function renderStatusCards() {
    return (
      <section className="status-grid">
        <article className="card stat-card">
          <p className="stat-label">Backend Health</p>
          <h3>{healthStatus.toUpperCase()}</h3>
        </article>
        <article className="card stat-card">
          <p className="stat-label">System Readiness</p>
          <h3>{systemReadiness}</h3>
        </article>
        <article className="card stat-card">
          <p className="stat-label">Active Alerts</p>
          <h3>{activeCount}</h3>
        </article>
        <article className="card stat-card">
          <p className="stat-label">Acknowledged / Resolved</p>
          <h3>
            {acknowledgedCount} / {resolvedCount}
          </h3>
        </article>
        <article className="card stat-card">
          <p className="stat-label">Critical Incidents</p>
          <h3>{criticalCount}</h3>
        </article>
        <article className="card stat-card">
          <p className="stat-label">Average Confidence</p>
          <h3>{avgConfidence}</h3>
        </article>
      </section>
    );
  }

  function renderAlertDetailCard() {
    if (!selectedAlert) {
      return <p className="muted">Select an alert from the table to inspect details.</p>;
    }

    return (
      <div className="detail-grid">
        <p>
          <strong>Anomaly Type:</strong> {selectedAlert.anomaly_type}
        </p>
        <p>
          <strong>Camera ID:</strong> {selectedAlert.camera_id}
        </p>
        <p>
          <strong>Severity:</strong>{" "}
          <span className={`badge badge-${selectedAlert.severity}`}>
            {selectedAlert.severity.toUpperCase()}
          </span>
        </p>
        <p>
          <strong>Confidence:</strong> {selectedAlert.confidence}
        </p>
        <p>
          <strong>Status:</strong> {selectedAlert.status.toUpperCase()}
        </p>
        <p>
          <strong>Timestamp:</strong>{" "}
          {new Date(selectedAlert.created_at).toLocaleString()}
        </p>
        <p className="full-width">
          <strong>Explanation:</strong> {selectedAlert.explanation}
        </p>
        <p className="full-width">
          <strong>Recommended Action:</strong> {selectedAlert.recommended_action}
        </p>
        <div className="button-row full-width">
          <button
            disabled={loading || selectedAlert.status !== "active"}
            onClick={() => handleAcknowledge(selectedAlert.id)}
          >
            Acknowledge Alert
          </button>
          <button
            className="secondary-button"
            disabled={loading || selectedAlert.status === "resolved"}
            onClick={() => handleResolve(selectedAlert.id)}
          >
            Resolve Alert
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="eyebrow">MARINE AI SUITE</p>
          <h1>AI-Powered Engine Room Monitoring System for Yachts</h1>
        </div>
        <nav className="topbar-nav">
          <NavLink to="/" end className="top-link">
            Home
          </NavLink>
          <NavLink to="/about" className="top-link">
            About
          </NavLink>
          <NavLink to="/demo" className="top-link">
            Demo
          </NavLink>
          <NavLink to="/alerts" className="top-link">
            Alerts
          </NavLink>
        </nav>
      </header>

      <main className="page-content">
        {message && <p className="message-banner">{message}</p>}
        {renderStatusCards()}

        <Routes>
          <Route
            path="/"
            element={
              <>
                <section className="card hero-card hero-home">
                  <div>
                    <p className="eyebrow">LIVE OPERATIONS</p>
                    <h2>Protect engine rooms with real-time AI anomaly intelligence</h2>
                    <p>
                      Monitor smoke, leaks, overheating, and abnormal motion through a
                      unified operational dashboard designed for rapid response.
                    </p>
                    <div className="hero-actions">
                      <NavLink to="/demo" className="button-link">
                        Start Live Demo
                      </NavLink>
                      <NavLink to="/alerts" className="button-link muted-link">
                        View Alert Center
                      </NavLink>
                    </div>
                  </div>
                  <div className="hero-metrics">
                    <p>
                      <strong>Monitoring Coverage:</strong> Engine Room Camera Cluster A
                    </p>
                    <p>
                      <strong>Last Refresh:</strong> Every 5 seconds
                    </p>
                    <p>
                      <strong>AI Mode:</strong> Deterministic local prototype
                    </p>
                  </div>
                </section>

                <section className="card trust-bar">
                  <span>Trusted prototype workflow for maritime safety demos</span>
                  <span>Real-time polling every 5 seconds</span>
                  <span>Alert lifecycle tracking: Active, Acknowledged, Resolved</span>
                </section>

                <section className="card">
                  <h2>Performance Snapshot</h2>
                  <div className="kpi-grid">
                    <div className="kpi-item">
                      <span>Total Alerts</span>
                      <strong>{alerts.length}</strong>
                    </div>
                    <div className="kpi-item">
                      <span>Open Risk</span>
                      <strong>{activeCount + acknowledgedCount}</strong>
                    </div>
                    <div className="kpi-item">
                      <span>Resolution Rate</span>
                      <strong>
                        {alerts.length
                          ? `${Math.round((resolvedCount / alerts.length) * 100)}%`
                          : "0%"}
                      </strong>
                    </div>
                    <div className="kpi-item">
                      <span>Critical Share</span>
                      <strong>
                        {alerts.length
                          ? `${Math.round((criticalCount / alerts.length) * 100)}%`
                          : "0%"}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="feature-grid">
                  <article className="card">
                    <h2>Real-Time Detection Intelligence</h2>
                    <p className="muted">
                      Severity scoring and AI explanations help operators understand risk
                      quickly, not just receive raw event notifications.
                    </p>
                  </article>
                  <article className="card">
                    <h2>Action-Oriented Workflow</h2>
                    <p className="muted">
                      Alert acknowledgement and resolution controls mirror real incident
                      triage operations in production monitoring systems.
                    </p>
                  </article>
                  <article className="card">
                    <h2>Demo-Ready System Design</h2>
                    <p className="muted">
                      Video simulation and synthetic anomaly triggers support clean,
                      repeatable demonstrations for reviews and presentations.
                    </p>
                  </article>
                </section>

                <section className="card">
                  <h2>Recent Alerts</h2>
                  {latestAlerts.length === 0 ? (
                    <p className="muted">No alerts yet. Run a simulation to create one.</p>
                  ) : (
                    <div className="recent-list">
                      {latestAlerts.map((alert) => (
                        <button
                          key={alert.id}
                          className="recent-item"
                          onClick={() => handleSelectAlert(alert.id)}
                        >
                          <span>
                            #{alert.id} - {alert.anomaly_type} - {alert.camera_id}
                          </span>
                          <span className={`badge badge-${alert.severity}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </>
            }
          />

          <Route
            path="/about"
            element={
              <>
                <section className="card hero-card">
                  <h2>About The Monitoring Platform</h2>
                  <p>
                    This prototype demonstrates an AI-assisted operational safety platform
                    for yacht engine room monitoring. It combines anomaly detection,
                    explainable alerts, and lifecycle actions in one professional interface.
                  </p>
                </section>

                <section className="two-column">
                  <article className="card">
                    <h2>Core Capabilities</h2>
                    <ul className="feature-list">
                      <li>Live alert generation from simulated detections and video runs</li>
                      <li>Severity-based risk prioritization with standardized badges</li>
                      <li>Operator workflow controls: acknowledge and resolve</li>
                      <li>Explainable AI outputs with recommended mitigation actions</li>
                    </ul>
                  </article>

                  <article className="card">
                    <h2>Architecture Overview</h2>
                    <ul className="feature-list">
                      <li>FastAPI backend with SQLite + SQLAlchemy persistence</li>
                      <li>Event processor handles severity logic and normalization</li>
                      <li>Mock local LLM service produces deterministic explanations</li>
                      <li>React dashboard provides an operator-ready UI experience</li>
                    </ul>
                  </article>
                </section>
              </>
            }
          />

          <Route
            path="/demo"
            element={
              <>
                <section className="card hero-card">
                  <h2>Interactive Demo Lab</h2>
                  <p>
                    Use this page during your presentation to create realistic incident
                    scenarios and show end-to-end alert handling in real time.
                  </p>
                </section>

                <section className="two-column">
                  <article className="card">
                    <h2>Video Upload and Processing</h2>
                    <form className="row" onSubmit={handleProcessVideo}>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(event) =>
                          setUploadFile(event.target.files?.[0] ?? null)
                        }
                      />
                      <button type="submit" disabled={loading}>
                        Process Video
                      </button>
                    </form>
                    {videoResult ? (
                      <div className="result-box">
                        <p>
                          <strong>Filename:</strong> {videoResult.video_filename}
                        </p>
                        <p>
                          <strong>Frames Processed:</strong> {videoResult.frames_processed}
                        </p>
                        <p>
                          <strong>Alerts Created:</strong> {videoResult.alerts_created}
                        </p>
                        <p>
                          <strong>Status:</strong> {videoResult.processing_status}
                        </p>
                      </div>
                    ) : (
                      <p className="muted">No video run in current session.</p>
                    )}
                  </article>

                  <article className="card">
                    <h2>Scenario Simulation Controls</h2>
                    <div className="button-grid">
                      {SIMULATION_BUTTONS.map((item) => (
                        <button
                          key={item.anomalyType}
                          className="control-button"
                          onClick={() =>
                            handleSimulate(item.anomalyType, item.confidence)
                          }
                          disabled={loading}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </article>
                </section>
              </>
            }
          />

          <Route
            path="/alerts"
            element={
              <section className="two-column alerts-view">
                <article className="card">
                  <h2>Alert Registry</h2>
                  {alerts.length === 0 ? (
                    <p className="muted">No alerts available.</p>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Anomaly</th>
                            <th>Camera</th>
                            <th>Severity</th>
                            <th>Confidence</th>
                            <th>Status</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alerts.map((alert) => (
                            <tr key={alert.id} onClick={() => handleSelectAlert(alert.id)}>
                              <td>{alert.anomaly_type}</td>
                              <td>{alert.camera_id}</td>
                              <td>
                                <span className={`badge badge-${alert.severity}`}>
                                  {alert.severity.toUpperCase()}
                                </span>
                              </td>
                              <td>{alert.confidence}</td>
                              <td>{alert.status.toUpperCase()}</td>
                              <td>{new Date(alert.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>

                <article className="card">
                  <h2>Alert Detail Panel</h2>
                  {renderAlertDetailCard()}
                </article>
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

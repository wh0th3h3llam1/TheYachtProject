import { useEffect, useState } from "react";
import { fetchStatus } from "../api";

export default function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStatus().then(setStatus).catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <h2>System Status</h2>
      {error && <p>Error: {error}</p>}
      {status ? (
        <div className="card">
          <p>Service: {status.service}</p>
          <p>Status: {status.status}</p>
          <p>Database Connected: {status.db_connected ? "Yes" : "No"}</p>
          <p>Active Alerts: {status.active_alerts}</p>
        </div>
      ) : (
        <p>Loading system status...</p>
      )}
    </section>
  );
}

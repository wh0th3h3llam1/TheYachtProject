import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAlerts } from "../api";

export default function AlertList() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAlerts().then(setAlerts).catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <h2>Alert List</h2>
      {error && <p>Error: {error}</p>}
      {alerts.length === 0 ? (
        <p>No alerts yet.</p>
      ) : (
        <ul className="list">
          {alerts.map((alert) => (
            <li key={alert.id} className="card">
              <strong>{alert.title}</strong>
              <p>Severity: {alert.severity}</p>
              <p>Acknowledged: {alert.acknowledged ? "Yes" : "No"}</p>
              <Link to={`/alerts/${alert.id}`}>View Details</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

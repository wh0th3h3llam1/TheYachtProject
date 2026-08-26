import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { acknowledgeAlert, fetchAlert } from "../api";

export default function AlertDetail() {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAlert(id).then(setAlert).catch((e) => setError(e.message));
  }, [id]);

  async function handleAcknowledge() {
    try {
      const updated = await acknowledgeAlert(id, true);
      setAlert(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!alert) {
    return <p>Loading alert...</p>;
  }

  return (
    <section>
      <h2>Alert Detail</h2>
      <div className="card">
        <h3>{alert.title}</h3>
        <p>Severity: {alert.severity}</p>
        <p>Source: {alert.source}</p>
        <p>{alert.description}</p>
        <p>Recommendation: {alert.recommendations}</p>
        <p>Status: {alert.acknowledged ? "Acknowledged" : "Active"}</p>
        {!alert.acknowledged && (
          <button onClick={handleAcknowledge}>Acknowledge</button>
        )}
      </div>
    </section>
  );
}

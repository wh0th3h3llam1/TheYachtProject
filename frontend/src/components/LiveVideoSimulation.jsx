import { useState } from "react";
import { simulateFrame } from "../api";

export default function LiveVideoSimulation() {
  const [frameLabel, setFrameLabel] = useState("normal operation");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  async function handleSimulate() {
    setMessage("");
    try {
      const data = await simulateFrame(frameLabel);
      if (data) {
        setResult(data);
        setMessage("Alert generated from simulated frame.");
      } else {
        setResult(null);
        setMessage("No anomaly detected in this frame.");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  return (
    <section>
      <h2>Live Video Simulation</h2>
      <p>Enter frame labels like: smoke, leak, overheat, or normal operation.</p>
      <div className="row">
        <input
          value={frameLabel}
          onChange={(e) => setFrameLabel(e.target.value)}
          placeholder="frame label"
        />
        <button onClick={handleSimulate}>Run Detection</button>
      </div>
      {message && <p>{message}</p>}
      {result && (
        <div className="card">
          <h3>{result.title}</h3>
          <p>Severity: {result.severity}</p>
          <p>{result.description}</p>
        </div>
      )}
    </section>
  );
}

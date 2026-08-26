import axios from "axios";

const client = axios.create({
  baseURL: "http://127.0.0.1:8000"
});

export async function fetchHealth() {
  const { data } = await client.get("/health");
  return data;
}

export async function fetchAlerts() {
  const { data } = await client.get("/alerts");
  return data;
}

export async function fetchAlert(id) {
  const { data } = await client.get(`/alerts/${id}`);
  return data;
}

export async function simulateDetection(payload) {
  const { data } = await client.post("/simulate-detection", payload);
  return data;
}

export async function processVideo(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await client.post("/process-video", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function acknowledgeAlert(id) {
  const { data } = await client.put(`/alerts/${id}/acknowledge`);
  return data;
}

export async function resolveAlert(id) {
  const { data } = await client.put(`/alerts/${id}/resolve`);
  return data;
}

import axios from "axios";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://fix-it-api.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

export default api;

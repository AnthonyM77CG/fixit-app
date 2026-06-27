import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL; // || "https://fix-it-api.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const rutasPublicas = [
      "/auth/login/correo",
      "/auth/login/facial",
      "/auth/registro",
      "/auth/verificar-cara",
    ];

    const esPublica = rutasPublicas.some((ruta) => config.url?.includes(ruta));

    if (!esPublica) {
      const data = await SecureStore.getItemAsync("usuario");
      if (data) {
        const usuario = JSON.parse(data);
        if (usuario.token) {
          config.headers.Authorization = `Bearer ${usuario.token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
export default api;

import { api } from "./api";
import {
  IncidenciaRequest,
  IncidenciaResponse,
} from "../models/incidencia.model";
import * as SecureStore from "expo-secure-store";

const getAuthHeader = async () => {
  const data = await SecureStore.getItemAsync("usuario");
  if (!data) throw new Error("No hay sesión activa");
  const usuario = JSON.parse(data);
  return { Authorization: `Bearer ${usuario.token}` };
};

export const incidenciaService = {
  todasLasIncidencias: async (): Promise<IncidenciaResponse[]> => {
    const headers = await getAuthHeader();
    const res = await api.get("/api/incidencias", { headers });
    return res.data;
  },
  crearIncidencia: async (
    request: IncidenciaRequest,
  ): Promise<{ mensaje: string; id: number }> => {
    const headers = await getAuthHeader();
    const res = await api.post("/api/incidencias", request, { headers });
    return res.data;
  },

  asignarTecnico: async (
    incidenciaId: number,
    tecnicoId: number,
  ): Promise<IncidenciaResponse> => {
    const headers = await getAuthHeader();
    const res = await api.put(
      `/api/incidencias/${incidenciaId}/asignar`,
      { tecnicoId },
      { headers },
    );
    return res.data;
  },

  getDashboard: async (): Promise<any> => {
    const headers = await getAuthHeader();
    const res = await api.get("/api/incidencias/dashboard", { headers });
    return res.data;
  },

  misIncidencias: async (): Promise<IncidenciaResponse[]> => {
    const headers = await getAuthHeader();
    const res = await api.get("/api/incidencias/mis-incidencias", { headers });
    return res.data;
  },

  misAsignaciones: async (): Promise<IncidenciaResponse[]> => {
    const headers = await getAuthHeader();
    const res = await api.get("/api/incidencias/mis-asignaciones", { headers });
    return res.data;
  },

  obtenerPorId: async (id: number): Promise<IncidenciaResponse> => {
    const headers = await getAuthHeader();
    const res = await api.get(`/api/incidencias/${id}`, { headers });
    return res.data;
  },

  tomarIncidencia: async (
    incidenciaId: number,
  ): Promise<IncidenciaResponse> => {
    const headers = await getAuthHeader();
    const res = await api.put(
      `/api/incidencias/${incidenciaId}/tomar`,
      {},
      { headers },
    );
    return res.data;
  },

  actualizarEstado: async (
    incidenciaId: number,
    estado: string,
    comentario: string,
    imagenesBase64?: string[], // ✅ lista en vez de una sola
  ): Promise<IncidenciaResponse> => {
    const headers = await getAuthHeader();
    const res = await api.put(
      `/api/incidencias/${incidenciaId}/estado`,
      {
        estado,
        comentario,
        imagenesBase64: imagenesBase64 ?? [],
      },
      { headers },
    );
    return res.data;
  },
};

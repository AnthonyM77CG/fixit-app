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
    const res = await api.get("/api/incidencias");
    return res.data;
  },
  crearIncidencia: async (
    request: IncidenciaRequest,
  ): Promise<{ mensaje: string; id: number }> => {
    const res = await api.post("/api/incidencias", request);
    return res.data;
  },

  asignarTecnico: async (
    incidenciaId: number,
    tecnicoId: number,
  ): Promise<IncidenciaResponse> => {
    const res = await api.put(`/api/incidencias/${incidenciaId}/asignar`, {
      tecnicoId,
    });
    return res.data;
  },

  getDashboard: async (): Promise<any> => {
    const res = await api.get("/api/incidencias/dashboard");
    return res.data;
  },

  misIncidencias: async (): Promise<IncidenciaResponse[]> => {
    const res = await api.get("/api/incidencias/mis-incidencias");
    return res.data;
  },

  misAsignaciones: async (): Promise<IncidenciaResponse[]> => {
    const res = await api.get("/api/incidencias/mis-asignaciones");
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
    imagenesBase64?: string[],
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

  actualizar: async (
    incidenciaId: number,
    request: IncidenciaRequest,
  ): Promise<IncidenciaResponse> => {
    const headers = await getAuthHeader();
    const res = await api.put(`/api/incidencias/${incidenciaId}`, request, {
      headers,
    });
    return res.data;
  },

  eliminar: async (incidenciaId: number): Promise<void> => {
    const headers = await getAuthHeader();
    await api.delete(`/api/incidencias/${incidenciaId}`, { headers });
  },
};

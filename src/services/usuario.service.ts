import { api } from "./api";
import * as SecureStore from "expo-secure-store";

export const usuarioService = {
  actualizarPerfil: async (
    usuarioId: number,
    correo: string,
    celular: string,
  ) => {
    const res = await api.put(`/api/usuarios/${usuarioId}`, {
      correo,
      celular,
    });
    return res.data;
  },

  obtenerTecnicos: async (): Promise<any[]> => {
    const res = await api.get("/api/usuarios/tecnicos");
    return res.data;
  },
};

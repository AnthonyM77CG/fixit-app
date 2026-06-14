import { api } from "./api";
import * as SecureStore from "expo-secure-store";

export const usuarioService = {
  actualizarPerfil: async (
    usuarioId: number,
    correo: string,
    celular: string,
  ) => {
    const data = await SecureStore.getItemAsync("usuario");
    if (!data) throw new Error("No hay sesión activa");
    const usuario = JSON.parse(data);

    const res = await api.put(
      `/api/usuarios/${usuarioId}`,
      {
        correo,
        celular,
      },
      {
        headers: { Authorization: `Bearer ${usuario.token}` },
      },
    );
    return res.data;
  },

  obtenerTecnicos: async (): Promise<any[]> => {
    const data = await SecureStore.getItemAsync("usuario");
    if (!data) throw new Error("No hay sesión activa");
    const usuario = JSON.parse(data);
    const res = await api.get("/api/usuarios/tecnicos", {
      headers: { Authorization: `Bearer ${usuario.token}` },
    });
    return res.data;
  },
};

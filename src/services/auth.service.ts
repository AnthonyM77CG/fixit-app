import { AuthResponse } from "../models/auth.model";
import { api } from "./api";

export const authService = {
  register: async (data: {
    nombre: string;
    apellido: string;
    correo: string;
    contraseña: string;
    celular: string;
    roleId: number;
    areaId: number;
    imagen: string;
  }): Promise<{ mensaje: string }> => {
    const res = await api.post("/auth/registro", data);
    return res.data;
  },

  loginCorreo: async (data: {
    correo: string;
    contraseña: string;
  }): Promise<AuthResponse> => {
    const res = await api.post("/auth/login/correo", data);
    return res.data;
  },

  loginFace: async (data: { imagen: string }): Promise<AuthResponse> => {
    const res = await api.post("/auth/login/facial", data);
    return res.data;
  },

  verificarCara: async (data: {
    imagen: string;
  }): Promise<{
    caraExistente: boolean;
    sinCara: boolean;
  }> => {
    const res = await api.post("/auth/verificar-cara", data);
    return res.data;
  },
};

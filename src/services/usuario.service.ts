import { api } from "./api";

export interface ActualizarUsuarioAdminParams {
  nombre?: string;
  apellido?: string;
  correo?: string;
  celular?: string;
  rolId?: number;
  areaId?: number;
}

export const usuarioService = {
  obtenerTodos: async (filtros?: {
    rol?: string;
    activo?: boolean;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filtros?.rol) params.append("rol", filtros.rol);
    if (filtros?.activo !== undefined)
      params.append("activo", String(filtros.activo));

    const queryString = params.toString();
    const url = `/api/usuarios${queryString ? `?${queryString}` : ""}`;

    const res = await api.get(url);
    return res.data;
  },

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

  obtenerPorId: async (id: number): Promise<any> => {
    const res = await api.get(`/api/usuarios/${id}`);
    return res.data;
  },

  actualizarUsuarioAdmin: async (
    id: number,
    data: ActualizarUsuarioAdminParams,
  ) => {
    const res = await api.put(`/api/usuarios/perfil/${id}`, data);
    return res.data;
  },

  // Activar/Inhabilitar usuario
  cambiarEstado: async (id: number, activo: boolean) => {
    const res = await api.patch(`/api/usuarios/${id}/estado`, { activo });
    return res.data;
  },
};

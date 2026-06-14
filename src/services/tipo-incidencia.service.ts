import { api } from "./api";
import { TipoIncidencia } from "../models/tipo-incidencia.model";

export const tipoIncidenciaService = {
  getTipos: async (): Promise<TipoIncidencia[]> => {
    const res = await api.get("/api/tipos");
    return res.data;
  },
};

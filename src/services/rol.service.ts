import { Rol } from "../models/rol.model";
import { api } from "./api";

export const rolService = {
  getRoles: async (): Promise<Rol[]> => {
    const res = await api.get("/api/roles");
    return res.data;
  },
};

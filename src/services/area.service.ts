import { Area } from "../models/area.model";
import { api } from "./api";

export const areaService = {
  getAreas: async (): Promise<Area[]> => {
    const res = await api.get("/api/areas");
    return res.data;
  },
};

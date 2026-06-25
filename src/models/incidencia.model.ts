export interface SeguimientoResponse {
  estado: string;
  fecha: string;
  comentario: string;
}

export interface IncidenciaResponse {
  id: number;
  tipo: string;
  prioridad: string;
  detalle: string;
  imagenesEmpleado: string[];
  imagenesTecnico: string[];
  estado: string;
  area: string;
  empleado: string;
  tecnico: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  seguimientos: SeguimientoResponse[];
}

export interface IncidenciaRequest {
  tipoId: number;
  prioridad: string;
  detalle: string;
  imagenesBase64: string[];
}

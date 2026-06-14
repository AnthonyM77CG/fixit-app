export interface AuthResponse {
  token: string;
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  rol: string;
  area: string;
  similitud?: string;
}

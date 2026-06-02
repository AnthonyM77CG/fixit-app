export interface AuthResponse {
  token: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  area: string;
  similitud?: string;
}

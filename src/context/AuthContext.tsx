import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

interface Usuario {
  token: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  area: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  guardarSesion: (data: Usuario) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    try {
      const data = await SecureStore.getItemAsync('usuario');
      if (data) setUsuario(JSON.parse(data));
    } catch (_) {}
    finally { setCargando(false); }
  };

  const guardarSesion = async (data: Usuario) => {
    await SecureStore.setItemAsync('usuario', JSON.stringify(data));
    setUsuario(data);
  };

  const cerrarSesion = async () => {
    await SecureStore.deleteItemAsync('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, guardarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
// src/context/NotificacionContext.tsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { crearWebSocket } from "../services/websocket.service";

interface NotificacionContextType {
  tieneNotificaciones: boolean;
  setTieneNotificaciones: (valor: boolean) => void;
  // Este callback es lo que usaremos para avisar a otras pantallas
  onDataUpdate: React.MutableRefObject<(() => void) | null>;
}

const NotificacionContext = createContext<NotificacionContextType>({} as any);

export const NotificacionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  console.log("Render NotificacionProvider");
  const [tieneNotificaciones, setTieneNotificaciones] = useState(false);
  const onDataUpdate = useRef<(() => void) | null>(null);

  useEffect(() => {
    const ws = crearWebSocket(() => {
      console.log("Callback ejecutado");
      console.log("LLEGÓ REFRESH");
      setTieneNotificaciones(true);

      if (onDataUpdate.current) {
        onDataUpdate.current();
      }
    });

    return () => ws.close();
  }, []);

  useEffect(() => {
    console.log("tieneNotificaciones =", tieneNotificaciones);
  }, [tieneNotificaciones]);

  return (
    <NotificacionContext.Provider
      value={{ tieneNotificaciones, setTieneNotificaciones, onDataUpdate }}
    >
      {children}
    </NotificacionContext.Provider>
  );
};

export const useNotificaciones = () => useContext(NotificacionContext);

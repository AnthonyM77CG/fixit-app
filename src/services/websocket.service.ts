const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

const WS_URL = API_URL.replace("http://", "ws://") + "/ws-incidencias";

export const crearWebSocket = (onRefresh: () => void): WebSocket => {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => console.log("WebSocket conectado");
  ws.onmessage = (event) => {
    if (event.data === "REFRESH_DATA") {
      onRefresh();
    }
  };
  ws.onerror = (e: any) => console.log("WebSocket error:", e.message);
  ws.onclose = () => console.log("WebSocket cerrado");

  return ws;
};

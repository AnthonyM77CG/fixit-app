import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "./api";
import * as SecureStore from "expo-secure-store";
import { Usuario } from "../models/usuario.model";

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  registrar: async (usuarioId: number) => {
    if (!Device.isDevice) {
      console.log("Las notificaciones solo funcionan en dispositivo físico");
      return;
    }

    // Pedir permisos
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permiso de notificaciones denegado");
      return;
    }

    // Obtener token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Push token:", token);

    // Guardar en backend
    const data = await SecureStore.getItemAsync("usuario");
    if (!data) return;
    const usuario = JSON.parse(data);

    await api.put(
      `/api/usuarios/${usuarioId}/push-token`,
      { pushToken: token },
      { headers: { Authorization: `Bearer ${usuario.token}` } },
    );

    // Configuración especial para Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#16a34a",
      });
    }

    return token;
  },

  obtenerPorUsuario: async (usuarioId: number) => {
    const { data } = await api.get(`/api/notificaciones/usuario/${usuarioId}`);
    return data;
  },
  marcarComoLeida: async (notificacionId: number) => {
    await api.put(`/api/notificaciones/${notificacionId}/leer`);
  },

  marcarTodasComoLeidas: async (usuarioId: number) => {
    await api.put(`/api/notificaciones/usuario/${usuarioId}/leer-todas`);
  },
};

import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "./api";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

// Configuración global del manejador de notificaciones (para que se muestren en primer plano)
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
    // Las notificaciones push requieren un dispositivo físico
    if (!Device.isDevice) {
      console.log(
        "Las notificaciones solo funcionan en un dispositivo físico.",
      );
      return;
    }

    try {
      // 1. Pedir permisos de notificación al usuario
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Permiso de notificaciones denegado por el usuario.");
        return;
      }

      // 2. Extraer el projectId de la configuración de Expo (CLAVE para evitar la pantalla roja en Expo Go)
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      // 3. Obtener el token de Expo Push
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      const token = tokenData.data;

      console.log("Push token obtenido exitosamente en Expo Go:", token);

      // 4. Configurar el canal para Android (necesario para sonidos/banners)
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#16a34a",
        });
      }

      // 5. Enviar el token a tu Backend Spring Boot
      const data = await SecureStore.getItemAsync("usuario");
      if (!data) return token;
      const usuario = JSON.parse(data);

      await api.put(
        `/api/usuarios/${usuarioId}/push-token`,
        { pushToken: token },
        { headers: { Authorization: `Bearer ${usuario.token}` } },
      );

      return token;
    } catch (error) {
      // Al atrapar el error aquí, EVITAMOS que React Native/Expo Go muestre la pantalla roja
      console.log("Aviso de notificaciones (capturado):", error);
    }
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

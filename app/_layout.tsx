import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { useEffect } from "react";
import { NotificacionProvider } from "../src/context/NotificacionContext";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "Expo Notifications:",
]);

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificacionProvider>
        <AppNavigator />
      </NotificacionProvider>
    </AuthProvider>
  );
}

function AppNavigator() {
  const router = useRouter();
  const { usuario } = useAuth();

  useEffect(() => {
    // listener de notificaciones
  }, [usuario]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

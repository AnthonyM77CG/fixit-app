import { Stack, Tabs, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { NotificacionProvider } from "../../src/context/NotificacionContext";

export default function AdminLayout() {
  const { usuario } = useAuth();
  const router = useRouter();

  if (!usuario) return <Redirect href="/auth/metodo-login" />;
  if (usuario.rol !== "Administrador")
    return <Redirect href="/auth/metodo-login" />;

  return (
    <NotificacionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </NotificacionProvider>
  );
}

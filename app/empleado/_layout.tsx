import { Stack, Tabs } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";

export default function EmpleadoLayout() {
  const { usuario } = useAuth();

  if (!usuario) return <Redirect href="/auth/metodo-login" />;
  if (usuario.rol !== "Empleado") return <Redirect href="/auth/metodo-login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

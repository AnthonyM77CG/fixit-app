import { Stack, Tabs } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";

export default function TecnicoLayout() {
  const { usuario } = useAuth();

  if (!usuario) return <Redirect href="/auth/metodo-login" />;
  if (usuario.rol !== "Tecnico") return <Redirect href="/auth/metodo-login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

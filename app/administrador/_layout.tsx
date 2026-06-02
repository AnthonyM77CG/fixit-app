import { Stack } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";

export default function AppLayout() {
  const { usuario } = useAuth();

  if (!usuario) return <Redirect href="/auth/metodo-login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

// app/index.tsx
import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!usuario) return <Redirect href="/auth/metodo-login" />;

  //Redirige según el rol
  switch (usuario.rol) {
    case "Administrador":
      return <Redirect href="/administrador/inicio" />;
    case "Tecnico":
      return <Redirect href="/tecnico/inicio" />;
    case "Empleado":
      return <Redirect href="/empleado/inicio" />;
    default:
      return <Redirect href="/auth/metodo-login" />;
  }
}

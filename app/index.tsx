import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function InicioScreen() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    if (!usuario) {
      router.replace("/auth/metodo-login");
      return;
    }

    switch (usuario.rol) {
      case "Administrador":
        router.replace("/administrador/inicio");
        break;
      case "Técnico":
        router.replace("/tecnico/inicio");
        break;
      case "Empleado":
        router.replace("/empleado/inicio");
        break;
      default:
        router.replace("/auth/metodo-login");
    }
  }, [usuario, cargando]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
      }}
    >
      <ActivityIndicator color="#16a34a" size="large" />
    </View>
  );
}

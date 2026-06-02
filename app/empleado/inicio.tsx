import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>Hola, {usuario?.nombre} 👋</Text>
      <Text style={styles.info}>Rol: Empleado</Text>
      <Text style={styles.info}>Área: {usuario?.area}</Text>

      <TouchableOpacity style={styles.boton} onPress={handleLogout}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  saludo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  info: { fontSize: 16, color: "#666", marginBottom: 4 },
  boton: {
    marginTop: 40,
    backgroundColor: "#FF3B30",
    padding: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

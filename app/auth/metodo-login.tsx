import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function MetodoLoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo + Branding */}
      <View style={styles.brandingContainer}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.titulo}>Bienvenido</Text>
        <Text style={styles.subtitulo}>
          Elige cómo deseas verificar tu identidad
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.opcionesContainer}>
        <TouchableOpacity
          style={styles.botonFacial}
          onPress={() => router.push("/auth/login-facial")}
          activeOpacity={0.85}
        >
          <Ionicons name="scan-outline" size={22} color="#fff" />
          <Text style={styles.botonTexto}>FACIAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonCorreo}
          onPress={() => router.push("/auth/login-correo")}
          activeOpacity={0.85}
        >
          <Ionicons name="lock-closed-outline" size={22} color="#fff" />
          <Text style={styles.botonTexto}>USUARIO Y CONTRASEÑA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonRegistro}
          onPress={() => router.push("/auth/registro")}
        >
          <Text style={styles.registroTexto}>
            [ <Text style={styles.registroDestacado}>Crear una cuenta</Text> ]
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spacer para centrar el contenido */}
      <View />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  brandingContainer: {
    alignItems: "center",
    marginTop: height * 0.06,
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
  },
  opcionesContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  botonFacial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    borderRadius: 14,
    height: 56,
    gap: 10,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  botonCorreo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
    borderRadius: 14,
    height: 56,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#374151",
  },
  botonTexto: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  botonRegistro: {
    alignItems: "center",
    paddingVertical: 8,
  },
  registroTexto: {
    color: "#6b7280",
    fontSize: 14,
  },
  registroDestacado: {
    color: "#16a34a",
    fontWeight: "700",
  },
});

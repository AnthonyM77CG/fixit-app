import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { authService } from "../../src/services/auth.service";

export default function LoginCorreoScreen() {
  const router = useRouter();
  const { guardarSesion } = useAuth();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [cargando, setCargando] = useState(false);
  const [isCorreoFocused, setIsCorreoFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [verContraseña, setVerContraseña] = useState(false);

  const handleLogin = async () => {
    if (!correo || !contraseña) {
      Alert.alert(
        "Campos Incompletos",
        "Por favor, completa todos los campos.",
      );
      return;
    }
    setCargando(true);
    try {
      const data = await authService.loginCorreo({ correo, contraseña });
      await guardarSesion(data);

      switch (data.rol) {
        case "Administrador":
          router.replace("/administrador/tabs/inicio");
          break;
        case "Tecnico":
          router.replace("/tecnico/tabs/inicio");
          break;
        case "Empleado":
          router.replace("/empleado/tabs/inicio");
          break;
        default:
          router.replace("/auth/metodo-login");
      }
    } catch (e: any) {
      Alert.alert(
        "Error de Credenciales",
        e.response?.data?.error || "El correo o la contraseña son incorrectos.",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fijo */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/auth/metodo-login")
          }
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Iniciar Sesión</Text>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ícono y título */}
          <View style={styles.brandingContainer}>
            <View style={styles.iconoContainer}>
              <Ionicons name="person-outline" size={40} color="#16a34a" />
            </View>
            <Text style={styles.titulo}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitulo}>
              Ingresa tus credenciales para acceder
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.card}>
            {/* Correo */}
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, isCorreoFocused && styles.inputFocused]}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#9ca3af"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setIsCorreoFocused(true)}
              onBlur={() => setIsCorreoFocused(false)}
              editable={!cargando}
            />

            {/* Contraseña */}
            <Text style={styles.label}>Contraseña</Text>
            <View
              style={[
                styles.inputContainer,
                isPassFocused && styles.inputFocused,
              ]}
            >
              <TextInput
                style={styles.inputContraseña}
                placeholder="••••••••••••"
                placeholderTextColor="#9ca3af"
                value={contraseña}
                onChangeText={setContraseña}
                secureTextEntry={false}
                onFocus={() => setIsPassFocused(true)}
                onBlur={() => setIsPassFocused(false)}
                editable={!cargando}
              />
              <TouchableOpacity
                style={styles.ojoBton}
                onPress={() => setVerContraseña(!verContraseña)}
              >
                <Ionicons
                  name={verContraseña ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Botón */}
            <TouchableOpacity
              style={[styles.boton, cargando && styles.botonDesactivado]}
              onPress={handleLogin}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  botonVolver: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 80,
  },
  botonVolverTexto: { fontSize: 15, color: "#374151", fontWeight: "500" },
  headerTitulo: { fontSize: 17, fontWeight: "700", color: "#111827" },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  brandingContainer: { alignItems: "center", gap: 8 },
  iconoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subtitulo: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  inputContraseña: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
  },
  ojoBton: { paddingHorizontal: 14, paddingVertical: 13 },
  inputFocused: { borderColor: "#16a34a" },
  boton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonDesactivado: { backgroundColor: "#9ca3af" },
  botonTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

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
import { SafeAreaView } from "react-native-safe-area-context"; // Evita colisiones con barras del sistema
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { authService } from "../../src/services/auth.service";

export default function LoginCorreoScreen() {
  const router = useRouter();
  const { guardarSesion } = useAuth();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [cargando, setCargando] = useState(false);

  // Estados para controlar el color del borde cuando el usuario interactúa con los inputs
  const [isCorreoFocused, setIsCorreoFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const handleLogin = async () => {
    if (!correo || !contraseña) {
      Alert.alert(
        "Campos Incompletos",
        "Por favor, completa todos los campos para continuar.",
      );
      return;
    }
    setCargando(true);
    try {
      const data = await authService.loginCorreo({ correo, contraseña });
      await guardarSesion(data);

      switch (data.rol) {
        case "Administrador":
          router.replace("/administrador/inicio");
          break;
        case "Tecnico":
          router.replace("/tecnico/inicio");
          break;
        case "Empleado":
          router.replace("/empleado/inicio");
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
      {/* KeyboardAvoidingView evita que el teclado del celular tape los inputs o el botón */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Encabezado e Ícono */}
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>👤</Text>
            </View>
            <Text style={styles.titulo}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitulo}>
              Ingresa tus credenciales para acceder
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, isCorreoFocused && styles.inputFocused]}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#555"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setIsCorreoFocused(true)}
              onBlur={() => setIsCorreoFocused(false)}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, isPassFocused && styles.inputFocused]}
              placeholder="••••••••••••"
              placeholderTextColor="#555"
              value={contraseña}
              onChangeText={setContraseña}
              secureTextEntry
              onFocus={() => setIsPassFocused(true)}
              onBlur={() => setIsPassFocused(false)}
            />

            {/* Botón de Acción Principal */}
            <TouchableOpacity
              style={[styles.boton, cargando && styles.botonDesactivado]}
              onPress={handleLogin}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Botón Volver Sólido y Protegido */}
          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("auth/metodo-login");
              }
            }}
          >
            <Text style={styles.link}>← Volver al método de login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // Fondo oscuro premium combinando con la pantalla facial
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoBadge: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  logoIcon: {
    fontSize: 32,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginTop: 6,
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#1E1E1E", // Contenedor tipo tarjeta para el formulario
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#121212",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#333",
    color: "#fff",
  },
  inputFocused: {
    borderColor: "#007AFF", // El borde se ilumina de azul al seleccionarlo
  },
  boton: {
    backgroundColor: "#007AFF",
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonDesactivado: {
    backgroundColor: "#333",
  },
  botonTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  botonVolver: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  link: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

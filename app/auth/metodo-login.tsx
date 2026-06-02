import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Evita que choque con la barra de estado y gestos
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function MetodoLoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Contenedor del Logo / Branding Superior */}
      <View style={styles.brandingContainer}>
        <View style={styles.logoContorno}>
          <Text style={styles.logoSimbolo}>🛡️</Text>
        </View>
        <Text style={styles.titulo}>Bienvenido</Text>
        <Text style={styles.subtitulo}>
          Elige cómo deseas verificar tu identidad
        </Text>
      </View>

      {/* Contenedor de Opciones de Inicio de Sesión */}
      <View style={styles.opcionesContainer}>
        {/* Opción 1: Reconocimiento Facial (Botón Principal Destacado) */}
        <TouchableOpacity
          style={styles.botonFacial}
          onPress={() => router.push("/auth/login-facial")}
        >
          <View style={styles.botonContenido}>
            <Text style={styles.botonIcono}>📷</Text>
            <Text style={styles.botonTexto}>Reconocimiento Facial</Text>
          </View>
        </TouchableOpacity>

        {/* Opción 2: Correo y Contraseña (Botón Secundario Estilizado) */}
        <TouchableOpacity
          style={styles.botonCorreo}
          onPress={() => router.push("/auth/login-correo")}
        >
          <View style={styles.botonContenido}>
            <Text style={styles.botonIcono}>✉️</Text>
            <Text style={[styles.botonTexto, styles.botonTextoCorreo]}>
              Correo y Contraseña
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer / Enlace de Registro */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.botonRegistro}
          onPress={() => router.push("/auth/registro")}
        >
          <Text style={styles.link}>
            ¿No tienes cuenta?{" "}
            <Text style={styles.linkDestacado}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // Fondo oscuro unificado con las demás pantallas
    paddingHorizontal: 24,
    justifyContent: "space-between", // Distribuye el contenido armónicamente (arriba, centro, abajo)
  },
  brandingContainer: {
    alignItems: "center",
    marginTop: width * 0.15, // Espaciado adaptativo según el tamaño del celular
  },
  logoContorno: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoSimbolo: {
    fontSize: 36,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 15,
    color: "#aaa",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  opcionesContainer: {
    width: "100%",
    backgroundColor: "#1E1E1E", // Caja tipo tarjeta contenedora
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  botonContenido: {
    flexDirection: "row", // Alinea el ícono y el texto en la misma línea
    alignItems: "center",
    justifyContent: "center",
  },
  botonIcono: {
    fontSize: 18,
    marginRight: 10, // Espacio entre el emoji y el texto
  },
  botonFacial: {
    width: "100%",
    height: 56,
    backgroundColor: "#007AFF", // Azul eléctrico
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  botonCorreo: {
    width: "100%",
    height: 56,
    backgroundColor: "#121212", // Fondo oscuro para contrastar con el principal
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#333",
  },
  botonTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  botonTextoCorreo: {
    color: "#ccc",
  },
  footerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  botonRegistro: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  link: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  linkDestacado: {
    color: "#007AFF", // Resalta el "Regístrate aquí" en azul
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

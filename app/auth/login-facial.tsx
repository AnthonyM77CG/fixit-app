import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Asegura que no choque con notches ni barras de botones
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { authService } from "../../src/services/auth.service";

const { width } = Dimensions.get("window");

export default function LoginFaceScreen() {
  const router = useRouter();
  const { guardarSesion } = useAuth();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cargando, setCargando] = useState(false);

  if (!permission) return <View style={styles.containerFondo} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.containerPermisos}>
        <View style={styles.cardPermisos}>
          <Text style={styles.iconoSeguridad}>🔒</Text>
          <Text style={styles.tituloPermisos}>Acceso Requerido</Text>
          <Text style={styles.textoPermisos}>
            Para iniciar sesión mediante reconocimiento facial, necesitamos
            permiso para utilizar la cámara frontal.
          </Text>
          <TouchableOpacity
            style={styles.botonPermiso}
            onPress={requestPermission}
          >
            <Text style={styles.botonTexto}>Conceder Permiso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogin = async () => {
    if (!cameraRef.current) return;
    setCargando(true);
    try {
      const foto = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });

      let base64 = foto.base64 ?? "";
      if (base64.includes(",")) base64 = base64.split(",")[1];

      let data;
      try {
        data = await authService.loginFace({ imagen: base64 });
      } catch (e: any) {
        if (e.response?.status === 400) {
          Alert.alert(
            "⚠️ Sin rostro detectado",
            "No se detectó ningún rostro. Asegúrate de centrar tu cara en la cámara e intenta de nuevo.",
          );
          return;
        }
        if (e.response?.status === 401) {
          Alert.alert(
            "Autenticación Fallida",
            "No se reconoció el rostro. Verifica que estés registrado e intenta de nuevo.",
          );
          return;
        }
        throw e;
      }

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
      console.log("Error status:", e.response?.status);
      console.log("Error data:", JSON.stringify(e.response?.data));
      console.log("Error message:", e.message);
      Alert.alert(
        "Error",
        "Ocurrió un problema al procesar la imagen. Intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Vista de la cámara que ocupa todo el fondo */}
      <CameraView
        ref={cameraRef}
        facing="front"
        style={StyleSheet.absoluteFillObject}
      />

      {/* Capa decorativa: Máscara de enfoque simulada para el rostro */}
      <View style={styles.overlayContenedor} pointerEvents="none">
        <View style={styles.guiaRostro} />
        <Text style={styles.textoInstruccion}>
          Coloca tu rostro dentro del recuadro
        </Text>
      </View>

      {/* Controles e Interfaz de usuario protegida por SafeAreaView */}
      <SafeAreaView style={styles.interfaceOverlay}>
        <View style={styles.controlesInferiores}>
          <TouchableOpacity
            style={[styles.botonCaptura, cargando && styles.botonDesactivado]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Iniciar Reconocimiento</Text>
            )}
          </TouchableOpacity>

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
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  containerFondo: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Capa para centrar la guía de escaneo
  overlayContenedor: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)", // Oscurece sutilmente la cámara para dar contraste
  },
  guiaRostro: {
    width: width * 0.7,
    height: width * 0.9,
    borderWidth: 2,
    borderColor: "#007AFF", // Color azul tecnológico
    borderRadius: 150, // Forma ovalada para simular contorno facial
    borderStyle: "dashed",
    backgroundColor: "transparent",
    marginBottom: 20,
  },
  textoInstruccion: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  // Contenedor UI flotante encima de la cámara
  interfaceOverlay: {
    flex: 1,
    justifyContent: "flex-end", // Todo el contenido se empuja hacia abajo de forma segura
  },
  controlesInferiores: {
    paddingHorizontal: 24,
    paddingBottom: 10, // Ajuste extra fino para pantallas sin notch inferior
  },
  botonCaptura: {
    height: 56,
    backgroundColor: "#007AFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  // Estilos para la pantalla de solicitud de permisos
  containerPermisos: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cardPermisos: {
    backgroundColor: "#1E1E1E",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  iconoSeguridad: {
    fontSize: 50,
    marginBottom: 16,
  },
  tituloPermisos: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  textoPermisos: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  botonPermiso: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
});

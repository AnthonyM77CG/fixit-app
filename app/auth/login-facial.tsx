import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { authService } from "../../src/services/auth.service";

const { width } = Dimensions.get("window");

export default function LoginFaceScreen() {
  const router = useRouter();
  const { guardarSesion } = useAuth();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cargando, setCargando] = useState(false);

  // Bandera de seguridad para evitar actualizar estado si el usuario sale de la pantalla
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (!permission)
    return <View style={{ flex: 1, backgroundColor: "#f3f4f6" }} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permisoContainer}>
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
          <Text style={styles.headerTitulo}>Reconocimiento Facial</Text>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.permisoContenido}>
          <View style={styles.permisoCard}>
            <Ionicons name="camera-outline" size={48} color="#16a34a" />
            <Text style={styles.permisoTitulo}>Acceso Requerido</Text>
            <Text style={styles.permisoTexto}>
              Para iniciar sesión mediante reconocimiento facial necesitamos
              permiso para usar la cámara frontal.
            </Text>
            <TouchableOpacity
              style={styles.botonPermiso}
              onPress={requestPermission}
            >
              <Text style={styles.botonPermisoTexto}>Conceder Permiso</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogin = async () => {
    // 🛡️ Blindaje 1: Validar si la referencia de la cámara existe antes de usarla
    if (!cameraRef.current) {
      Alert.alert(
        "Atención",
        "La cámara no está lista todavía. Espera un momento.",
      );
      return;
    }

    if (cargando) return; // Evitar doble pulsación

    if (isMounted.current) setCargando(true);

    try {
      const foto = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });

      // 🛡️ Blindaje 2: Validar que la foto se haya tomado correctamente
      if (!foto || !foto.base64) {
        throw new Error("No se pudo capturar la imagen de la cámara.");
      }

      let base64 = foto.base64;
      if (base64.includes(",")) base64 = base64.split(",")[1];

      let data;
      try {
        data = await authService.loginFace({ imagen: base64 });
      } catch (e: any) {
        if (!isMounted.current) return;

        if (e.response?.status === 400) {
          Alert.alert(
            "⚠️ Sin rostro detectado",
            "No se detectó ningún rostro. Centra tu cara e intenta de nuevo.",
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

      if (!isMounted.current) return;
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
      if (isMounted.current) {
        Alert.alert(
          "Error",
          "Ocurrió un problema al procesar la imagen. Intenta de nuevo.",
        );
      }
    } finally {
      if (isMounted.current) {
        setCargando(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Cámara de fondo */}
      <CameraView
        ref={cameraRef}
        facing="front"
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay con guía de rostro */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.guiaRostro} />
        <Text style={styles.textoInstruccion}>
          Coloca tu rostro dentro del recuadro
        </Text>
      </View>

      {/* Controles */}
      <SafeAreaView style={styles.interfaceOverlay}>
        {/* Botón volver arriba */}
        <TouchableOpacity
          style={styles.botonVolverOverlay}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/auth/metodo-login")
          }
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.botonVolverOverlayTexto}>Volver</Text>
        </TouchableOpacity>

        {/* Botón captura abajo */}
        <View style={styles.controlesInferiores}>
          <TouchableOpacity
            style={[styles.botonCaptura, cargando && styles.botonDesactivado]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Ionicons name="scan-outline" size={22} color="#fff" />
                <Text style={styles.botonCapturaTexto}>
                  Iniciar Reconocimiento
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  guiaRostro: {
    width: width * 0.7,
    height: width * 0.9,
    borderWidth: 2,
    borderColor: "#16a34a",
    borderRadius: 150,
    borderStyle: "dashed",
    backgroundColor: "transparent",
    marginBottom: 20,
  },
  textoInstruccion: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  interfaceOverlay: { flex: 1, justifyContent: "space-between" },
  botonVolverOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    margin: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  botonVolverOverlayTexto: { color: "#fff", fontSize: 14, fontWeight: "600" },
  controlesInferiores: { paddingHorizontal: 24, paddingBottom: 16 },
  botonCaptura: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  botonDesactivado: { backgroundColor: "rgba(0,0,0,0.5)" },
  botonCapturaTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  permisoContainer: { flex: 1, backgroundColor: "#f3f4f6" },
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
  permisoContenido: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permisoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  permisoTitulo: { fontSize: 20, fontWeight: "700", color: "#111827" },
  permisoTexto: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  botonPermiso: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  botonPermisoTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

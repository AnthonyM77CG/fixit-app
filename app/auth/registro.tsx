import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Rol } from "../../src/models/rol.model";
import { Area } from "../../src/models/area.model";
import { rolService } from "../../src/services/rol.service";
import { areaService } from "../../src/services/area.service";
import { authService } from "../../src/services/auth.service";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cargando, setCargando] = useState(false);
  const [fotoTomada, setFotoTomada] = useState(false);
  const [imagenBase64, setImagenBase64] = useState("");
  const [roles, setRoles] = useState<Rol[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // Estados independientes para el foco de los bordes de los inputs
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contraseña: "",
    celular: "",
    roleId: 0, // Inicia en 0 (Placeholder activo)
    areaId: 0, // Inicia en 0 (Placeholder activo)
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [rolesData, areasData] = await Promise.all([
        rolService.getRoles(),
        areaService.getAreas(),
      ]);
      setRoles(rolesData);
      setAreas(areasData);
    } catch (e: any) {
      console.log("Error status:", e.response?.status);
      console.log("Error data:", JSON.stringify(e.response?.data));
      console.log("Error message:", e.message);
      Alert.alert(
        "Error del Servidor",
        "No se pudieron cargar los catálogos de Roles y Áreas.",
      );
    }
  };

  const tomarFoto = async () => {
    if (!cameraRef.current) return;
    try {
      const foto = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      let base64 = foto.base64 ?? "";
      if (base64.includes(",")) base64 = base64.split(",")[1];

      setCargando(true);

      let resultado;
      try {
        resultado = await authService.verificarCara({ imagen: base64 });
      } catch (e: any) {
        if (e.response?.status === 400) {
          Alert.alert(
            "⚠️ Sin rostro detectado",
            "No se detectó ningún rostro en la foto. Asegúrate de centrar tu cara en la cámara e intenta de nuevo.",
          );
          return;
        }
        throw e;
      }

      if (resultado.caraExistente) {
        Alert.alert(
          "⚠️ Cara ya registrada",
          "Esta cara ya tiene una cuenta en el sistema. Intenta iniciar sesión.",
        );
        return;
      }

      setImagenBase64(base64);
      setFotoTomada(true);
    } catch (e: any) {
      Alert.alert(
        "Error",
        "Ocurrió un problema al procesar la imagen. Intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  };

  const handleRegister = async () => {
    if (
      !form.nombre ||
      !form.apellido ||
      !form.correo ||
      !form.contraseña ||
      !form.celular
    ) {
      Alert.alert(
        "Campos Vacíos",
        "Por favor, rellena todos los campos de texto.",
      );
      return;
    }
    if (form.celular.length !== 9) {
      Alert.alert(
        "Validación",
        "El número de celular debe contener exactamente 9 dígitos.",
      );
      return;
    }
    if (form.roleId === 0) {
      Alert.alert(
        "Validación",
        "Por favor, seleccione un rol funcional válido.",
      );
      return;
    }
    if (form.areaId === 0) {
      Alert.alert(
        "Validación",
        "Por favor, seleccione un área de trabajo válida.",
      );
      return;
    }
    if (!imagenBase64) {
      Alert.alert(
        "Biometría Requerida",
        "Es obligatorio registrar tu rostro para completar el alta.",
      );
      return;
    }

    setCargando(true);
    try {
      await authService.register({ ...form, imagen: imagenBase64 });
      Alert.alert(
        "¡Registro Exitoso!",
        "Tu cuenta ha sido creada correctamente.",
        [
          {
            text: "Ir al Login",
            onPress: () => router.replace("/auth/metodo-login"),
          },
        ],
      );
    } catch (e: any) {
      Alert.alert(
        "Error de Registro",
        e.response?.data?.error || "Ocurrió un fallo en el servidor.",
      );
    } finally {
      setCargando(false);
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.containerPermisos}>
        <View style={styles.cardPermisos}>
          <Text style={styles.iconoSeguridad}>📸</Text>
          <Text style={styles.tituloPermisos}>Acceso a la Cámara</Text>
          <Text style={styles.textoPermisos}>
            Para registrar tu perfil biométrico de reconocimiento facial,
            necesitamos acceso a tu cámara frontal.
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

  return (
    <SafeAreaView style={styles.containerPrincipal}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabecera */}
          <View style={styles.headerContainer}>
            <Text style={styles.titulo}>Crear Cuenta</Text>
            <Text style={styles.subtitulo}>
              Registra tus datos y vincula tu rostro
            </Text>
          </View>

          {/* Sección de la Cámara / Foto */}
          <View style={styles.cardSeccion}>
            <Text style={styles.labelSeccion}>Verificación Biométrica</Text>
            {!fotoTomada ? (
              <View style={styles.cameraWrapper}>
                <CameraView
                  ref={cameraRef}
                  facing="front"
                  style={styles.camara}
                />
                <View style={styles.overlayCamara} pointerEvents="none">
                  <View style={styles.guiaRostroOval} />
                </View>
                <TouchableOpacity
                  style={styles.botonFoto}
                  onPress={tomarFoto}
                  disabled={cargando}
                >
                  <Text style={styles.botonTextoFoto}>Capturar Rostro</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fotoOkContainer}>
                <Text style={styles.fotoOkIcono}>⚡</Text>
                <Text style={styles.fotoOkTexto}>
                  Rostro enlazado correctamente
                </Text>
                <TouchableOpacity
                  style={styles.botonReintentarFoto}
                  onPress={() => {
                    setFotoTomada(false);
                    setImagenBase64("");
                  }}
                  disabled={cargando}
                >
                  <Text style={styles.linkReintentar}>Volver a capturar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Sección de Datos Personales */}
          <View style={styles.cardSeccion}>
            <Text style={styles.labelSeccion}>Información Personal</Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "nombre" && styles.inputFocused,
              ]}
              placeholder="Nombre"
              placeholderTextColor="#555"
              value={form.nombre}
              onChangeText={(v) => setForm({ ...form, nombre: v })}
              onFocus={() => setFocusedField("nombre")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />

            <TextInput
              style={[
                styles.input,
                focusedField === "apellido" && styles.inputFocused,
              ]}
              placeholder="Apellido"
              placeholderTextColor="#555"
              value={form.apellido}
              onChangeText={(v) => setForm({ ...form, apellido: v })}
              onFocus={() => setFocusedField("apellido")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />

            <TextInput
              style={[
                styles.input,
                focusedField === "correo" && styles.inputFocused,
              ]}
              placeholder="Correo electrónico"
              placeholderTextColor="#555"
              value={form.correo}
              onChangeText={(v) => setForm({ ...form, correo: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField("correo")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />

            <TextInput
              style={[
                styles.input,
                focusedField === "contraseña" && styles.inputFocused,
              ]}
              placeholder="Contraseña"
              placeholderTextColor="#555"
              value={form.contraseña}
              onChangeText={(v) => setForm({ ...form, contraseña: v })}
              secureTextEntry
              onFocus={() => setFocusedField("contraseña")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />

            <TextInput
              style={[
                styles.input,
                focusedField === "celular" && styles.inputFocused,
              ]}
              placeholder="Celular (9 dígitos)"
              placeholderTextColor="#555"
              value={form.celular}
              onChangeText={(v) => setForm({ ...form, celular: v })}
              keyboardType="phone-pad"
              maxLength={9}
              onFocus={() => setFocusedField("celular")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />
          </View>

          {/* Sección de Clasificación Laboral */}
          <View style={styles.cardSeccion}>
            <Text style={styles.labelSeccion}>Asignación Laboral</Text>

            <Text style={styles.dropdownLabel}>Rol Funcional</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.roleId}
                onValueChange={(v) => {
                  if (v !== 0) setForm({ ...form, roleId: v }); // ✅ ignora si selecciona el placeholder
                }}
                style={styles.picker}
                dropdownIconColor="#fff"
                enabled={!cargando}
              >
                <Picker.Item
                  label="— Seleccione un rol —"
                  value={0}
                  color="#555"
                  enabled={false} // ✅ no seleccionable
                />
                {roles.map((r) => (
                  <Picker.Item
                    key={r.id}
                    label={r.nombre}
                    value={r.id}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.dropdownLabel}>Área de Trabajo</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.areaId}
                onValueChange={(v) => {
                  if (v !== 0) setForm({ ...form, areaId: v }); // ✅ ignora si selecciona el placeholder
                }}
                style={styles.picker}
                dropdownIconColor="#fff"
                enabled={!cargando}
              >
                <Picker.Item
                  label="— Seleccione un área —"
                  value={0}
                  color="#555"
                  enabled={false} // ✅ no seleccionable
                />
                {areas.map((a) => (
                  <Picker.Item
                    key={a.id}
                    label={a.nombre}
                    value={a.id}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[styles.botonEnviar, cargando && styles.botonDesactivado]}
            onPress={handleRegister}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.botonEnviarTexto}>Finalizar Registro</Text>
            )}
          </TouchableOpacity>

          {/* Botón Volver */}
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
            <Text style={styles.linkVolver}>← Volver al menú de inicio</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerPrincipal: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
    textAlign: "center",
  },
  cardSeccion: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  labelSeccion: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  cameraWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  camara: {
    height: 220,
  },
  overlayCamara: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    bottom: 40,
  },
  guiaRostroOval: {
    width: 120,
    height: 155,
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderRadius: 60,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  botonFoto: {
    backgroundColor: "#2a2a2a",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  botonTextoFoto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fotoOkContainer: {
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.3)",
  },
  fotoOkIcono: {
    fontSize: 28,
    marginBottom: 6,
  },
  fotoOkTexto: {
    fontSize: 15,
    color: "#4caf50",
    fontWeight: "700",
    textAlign: "center",
  },
  botonReintentarFoto: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  linkReintentar: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#121212",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#333",
    color: "#fff",
  },
  inputFocused: {
    borderColor: "#007AFF",
  },
  dropdownLabel: {
    color: "#ccc",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 2,
  },
  pickerContainer: {
    backgroundColor: "#121212",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#333",
    marginBottom: 16,
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  picker: {
    color: "#fff",
    backgroundColor: "transparent",
  },
  pickerItem: {
    fontSize: 15,
    backgroundColor: "#1E1E1E",
    color: "#fff",
  },
  botonEnviar: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    height: 56,
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
  botonEnviarTexto: {
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
  linkVolver: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
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
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  iconoSeguridad: {
    fontSize: 48,
    marginBottom: 16,
  },
  tituloPermisos: {
    color: "#fff",
    fontSize: 20,
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
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  botonTexto: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

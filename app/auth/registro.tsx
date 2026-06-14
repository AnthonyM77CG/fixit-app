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
import { Ionicons } from "@expo/vector-icons";
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [verContraseña, setVerContraseña] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contraseña: "",
    celular: "",
    roleId: 0,
    areaId: 0,
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
            "No se detectó ningún rostro. Centra tu cara e intenta de nuevo.",
          );
          return;
        }
        throw e;
      }

      if (resultado.caraExistente) {
        Alert.alert(
          "⚠️ Cara ya registrada",
          "Esta cara ya tiene una cuenta. Intenta iniciar sesión.",
        );
        return;
      }

      setImagenBase64(base64);
      setFotoTomada(true);
    } catch (e: any) {
      Alert.alert("Error", "Ocurrió un problema al procesar la imagen.");
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
      Alert.alert("Campos Vacíos", "Por favor, rellena todos los campos.");
      return;
    }
    if (form.celular.length !== 9) {
      Alert.alert("Validación", "El celular debe tener exactamente 9 dígitos.");
      return;
    }
    if (form.roleId === 0) {
      Alert.alert("Validación", "Selecciona un rol funcional.");
      return;
    }
    if (form.areaId === 0) {
      Alert.alert("Validación", "Selecciona un área de trabajo.");
      return;
    }
    if (!imagenBase64) {
      Alert.alert(
        "Biometría Requerida",
        "Debes registrar tu rostro para completar el registro.",
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
      <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitulo}>Crear Cuenta</Text>
          <View style={{ width: 80 }} />
        </View>
        <View style={styles.permisoContenido}>
          <View style={styles.permisoCard}>
            <Ionicons name="camera-outline" size={48} color="#16a34a" />
            <Text style={styles.permisoTitulo}>Acceso a la Cámara</Text>
            <Text style={styles.permisoTexto}>
              Para registrar tu perfil biométrico necesitamos acceso a tu cámara
              frontal.
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
        <Text style={styles.headerTitulo}>Crear Cuenta</Text>
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
          <Text style={styles.subtitulo}>
            Registra tus datos y vincula tu rostro
          </Text>

          {/* Verificación Biométrica */}
          <View style={styles.card}>
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
                  {cargando ? (
                    <ActivityIndicator color="#374151" size="small" />
                  ) : (
                    <Text style={styles.botonFotoTexto}>Capturar Rostro</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fotoOkContainer}>
                <Ionicons name="checkmark-circle" size={36} color="#16a34a" />
                <Text style={styles.fotoOkTexto}>
                  Rostro enlazado correctamente
                </Text>
                <TouchableOpacity
                  style={styles.botonReintentar}
                  onPress={() => {
                    setFotoTomada(false);
                    setImagenBase64("");
                  }}
                  disabled={cargando}
                >
                  <Text style={styles.botonReintentarTexto}>
                    Volver a capturar
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Información Personal */}
          <View style={styles.card}>
            <Text style={styles.labelSeccion}>Información Personal</Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "nombre" && styles.inputFocused,
              ]}
              placeholder="Nombre"
              placeholderTextColor="#9ca3af"
              value={form.nombre}
              onChangeText={(v) => setForm({ ...form, nombre: v })}
              autoCapitalize="words"
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
              placeholderTextColor="#9ca3af"
              value={form.apellido}
              onChangeText={(v) => setForm({ ...form, apellido: v })}
              autoCapitalize="words"
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
              placeholderTextColor="#9ca3af"
              value={form.correo}
              onChangeText={(v) => setForm({ ...form, correo: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField("correo")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />

            {/* Contraseña con ojo */}
            <View
              style={[
                styles.inputContraseñaContainer,
                focusedField === "contraseña" && styles.inputFocused,
              ]}
            >
              <TextInput
                style={styles.inputContraseñaField}
                placeholder="Contraseña"
                placeholderTextColor="#9ca3af"
                value={form.contraseña}
                onChangeText={(v) => setForm({ ...form, contraseña: v })}
                secureTextEntry={!verContraseña}
                onFocus={() => setFocusedField("contraseña")}
                onBlur={() => setFocusedField(null)}
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

            <TextInput
              style={[
                styles.input,
                focusedField === "celular" && styles.inputFocused,
                { marginBottom: 0 },
              ]}
              placeholder="Celular (9 dígitos)"
              placeholderTextColor="#9ca3af"
              value={form.celular}
              onChangeText={(v) => setForm({ ...form, celular: v })}
              keyboardType="phone-pad"
              maxLength={9}
              onFocus={() => setFocusedField("celular")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />
          </View>

          {/* Asignación Laboral */}
          <View style={styles.card}>
            <Text style={styles.labelSeccion}>Asignación Laboral</Text>

            <Text style={styles.pickerLabel}>Rol Funcional</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.roleId}
                onValueChange={(v) => {
                  if (v !== 0) setForm({ ...form, roleId: v });
                }}
                style={styles.picker}
                enabled={!cargando}
              >
                <Picker.Item
                  label="— Seleccione un rol —"
                  value={0}
                  enabled={false}
                  color="#9ca3af"
                />
                {roles.map((r) => (
                  <Picker.Item key={r.id} label={r.nombre} value={r.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.pickerLabel}>Área de Trabajo</Text>
            <View style={[styles.pickerContainer, { marginBottom: 0 }]}>
              <Picker
                selectedValue={form.areaId}
                onValueChange={(v) => {
                  if (v !== 0) setForm({ ...form, areaId: v });
                }}
                style={styles.picker}
                enabled={!cargando}
              >
                <Picker.Item
                  label="— Seleccione un área —"
                  value={0}
                  enabled={false}
                  color="#9ca3af"
                />
                {areas.map((a) => (
                  <Picker.Item key={a.id} label={a.nombre} value={a.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Botón registrar */}
          <TouchableOpacity
            style={[styles.botonEnviar, cargando && styles.botonDesactivado]}
            onPress={handleRegister}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonEnviarTexto}>Finalizar Registro</Text>
            )}
          </TouchableOpacity>
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
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  subtitulo: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  labelSeccion: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16a34a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  cameraWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camara: { height: 220 },
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
    borderColor: "#16a34a",
    borderRadius: 60,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  botonFoto: {
    backgroundColor: "#f3f4f6",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  botonFotoTexto: { color: "#374151", fontSize: 14, fontWeight: "600" },
  fotoOkContainer: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 8,
  },
  fotoOkTexto: { fontSize: 15, color: "#16a34a", fontWeight: "700" },
  botonReintentar: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  botonReintentarTexto: { color: "#374151", fontSize: 12, fontWeight: "600" },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  inputContraseñaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  inputContraseñaField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  ojoBton: { paddingHorizontal: 14, paddingVertical: 12 },
  inputFocused: { borderColor: "#16a34a" },
  pickerLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  pickerContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 14,
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  picker: { color: "#111827" },
  botonEnviar: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonDesactivado: { backgroundColor: "#9ca3af" },
  botonEnviarTexto: { color: "#fff", fontSize: 16, fontWeight: "700" },
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

import React, { useRef, useState, useEffect } from "react";
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
  Linking,
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

interface RegisterForm {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  celular: string;
  roleId: number;
  areaId: number;
}

const INITIAL_FORM: RegisterForm = {
  nombre: "",
  apellido: "",
  correo: "",
  contrasena: "",
  celular: "",
  roleId: 0,
  areaId: 0,
};

export default function RegisterScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cargando, setCargando] = useState(false);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const [fotoTomada, setFotoTomada] = useState(false);
  const [imagenBase64, setImagenBase64] = useState("");
  const [roles, setRoles] = useState<Rol[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [verContrasena, setVerContrasena] = useState(false);
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setCargandoCatalogos(true);
    try {
      const [rolesData, areasData] = await Promise.all([
        rolService.getRoles(),
        areaService.getAreas(),
      ]);

      const rolesPermitidos = rolesData.filter((r) => {
        const nombreRol = r.nombre.toUpperCase();
        return (
          nombreRol.includes("EMPLEADO") ||
          nombreRol.includes("TECNICO") ||
          nombreRol.includes("TÉCNICO")
        );
      });

      setRoles(rolesPermitidos);
      setAreas(areasData);
    } catch (e: any) {
      Alert.alert(
        "Error de Servidor",
        "No se pudieron cargar los roles y áreas. Intenta recargar la pantalla.",
      );
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const tomarFoto = async () => {
    if (!cameraRef.current) return;
    try {
      setCargando(true);
      const foto = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!foto?.base64) {
        throw new Error("No se pudo obtener el contenido en base64.");
      }

      let base64Clean = foto.base64;
      if (base64Clean.includes(",")) {
        base64Clean = base64Clean.split(",")[1];
      }

      // Verificación facial previa en backend
      const resultado = await authService.verificarCara({
        imagen: base64Clean,
      });

      if (resultado?.caraExistente) {
        Alert.alert(
          "Cara Registrada",
          "Este rostro ya está asociado a una cuenta existente.",
        );
        return;
      }

      setImagenBase64(base64Clean);
      setFotoTomada(true);
    } catch (e: any) {
      if (e.response?.status === 400) {
        Alert.alert(
          "Sin rostro detectado",
          "Por favor ubica tu cara dentro de la guía e intenta nuevamente.",
        );
      } else {
        Alert.alert(
          "Error de captura",
          e.response?.data?.message ||
            "Ocurrió un problema al procesar la imagen.",
        );
      }
    } finally {
      setCargando(false);
    }
  };

  const handleRegister = async () => {
    const { nombre, apellido, correo, contrasena, celular, roleId, areaId } =
      form;

    if (
      !nombre.trim() ||
      !apellido.trim() ||
      !correo.trim() ||
      !contrasena ||
      !celular
    ) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos.");
      return;
    }

    if (celular.length !== 9) {
      Alert.alert(
        "Validación",
        "El número de celular debe contener exactamente 9 dígitos.",
      );
      return;
    }

    if (roleId === 0) {
      Alert.alert("Validación", "Selecciona un rol funcional.");
      return;
    }

    if (areaId === 0) {
      Alert.alert("Validación", "Selecciona un área de trabajo.");
      return;
    }

    if (!imagenBase64) {
      Alert.alert(
        "Biometría Requerida",
        "Debes capturar y vincular tu rostro para continuar.",
      );
      return;
    }

    setCargando(true);
    try {
      await authService.register({
        ...form,
        contraseña: contrasena,
        imagen: imagenBase64,
      });

      Alert.alert(
        "¡Registro Exitoso!",
        "Tu cuenta ha sido creada. Ya puedes iniciar sesión.",
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
        e.response?.data?.error ||
          e.response?.data?.message ||
          "Error al conectar con el servidor.",
      );
    } finally {
      setCargando(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/auth/metodo-login");
    }
  };

  // --- Vista sin permisos de cámara ---
  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.botonVolver}>
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
              Requerimos acceso a tu cámara para validar tu identidad
              biométrica.
            </Text>

            {permission?.canAskAgain === false ? (
              <TouchableOpacity
                style={styles.botonPermiso}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.botonPermisoTexto}>
                  Abrir Configuración
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.botonPermiso}
                onPress={requestPermission}
              >
                <Text style={styles.botonPermisoTexto}>Conceder Permiso</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Formulario principal ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.botonVolver}>
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
            Completa tus datos personales y registra tu rostro
          </Text>

          {/* Sección Biometría */}
          <View style={styles.card}>
            <Text style={styles.labelSeccion}>1. Verificación Biométrica</Text>

            {!fotoTomada ? (
              <View style={styles.cameraWrapper}>
                {/* Contenedor exclusivo para la cámara y su overlay */}
                <View style={styles.cameraContainer}>
                  <CameraView
                    ref={cameraRef}
                    facing="front"
                    style={styles.camara}
                  />
                  <View style={styles.overlayCamara} pointerEvents="none">
                    <View style={styles.guiaRostroOval} />
                  </View>
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

          {/* Sección Información Personal */}
          <View style={styles.card}>
            <Text style={styles.labelSeccion}>2. Información Personal</Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "nombre" && styles.inputFocused,
              ]}
              placeholder="Nombre"
              placeholderTextColor="#9ca3af"
              value={form.nombre}
              onChangeText={(v) => setForm((prev) => ({ ...prev, nombre: v }))}
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
              onChangeText={(v) =>
                setForm((prev) => ({ ...prev, apellido: v }))
              }
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
              onChangeText={(v) => setForm((prev) => ({ ...prev, correo: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField("correo")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />

            {/* Contraseña */}
            <View
              style={[
                styles.inputContrasenaContainer,
                focusedField === "contrasena" && styles.inputFocused,
              ]}
            >
              <TextInput
                style={styles.inputContrasenaField}
                placeholder="Contraseña"
                placeholderTextColor="#9ca3af"
                value={form.contrasena}
                onChangeText={(v) =>
                  setForm((prev) => ({ ...prev, contrasena: v }))
                }
                secureTextEntry={false}
                onFocus={() => setFocusedField("contrasena")}
                onBlur={() => setFocusedField(null)}
                editable={!cargando}
              />
              <TouchableOpacity
                style={styles.ojoBton}
                onPress={() => setVerContrasena(!verContrasena)}
              >
                <Ionicons
                  name={verContrasena ? "eye-off-outline" : "eye-outline"}
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
              onChangeText={(v) =>
                setForm((prev) => ({
                  ...prev,
                  celular: v.replace(/[^0-9]/g, ""),
                }))
              }
              keyboardType="phone-pad"
              maxLength={9}
              onFocus={() => setFocusedField("celular")}
              onBlur={() => setFocusedField(null)}
              editable={!cargando}
            />
          </View>

          {/* Sección Asignación Laboral */}
          <View style={styles.card}>
            <Text style={styles.labelSeccion}>3. Asignación Laboral</Text>

            {cargandoCatalogos ? (
              <ActivityIndicator
                color="#16a34a"
                style={{ marginVertical: 12 }}
              />
            ) : (
              <>
                <Text style={styles.pickerLabel}>Rol Funcional</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.roleId}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, roleId: Number(v) }))
                    }
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
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, areaId: Number(v) }))
                    }
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
              </>
            )}
          </View>

          {/* Botón de Envió */}
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
    elevation: 2,
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
    alignItems: "center",
    justifyContent: "center",
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
  inputContrasenaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  inputContrasenaField: {
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
  cameraContainer: {
    height: 220,
    width: "100%",
    position: "relative",
  },
});

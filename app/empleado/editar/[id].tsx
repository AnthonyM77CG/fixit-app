import { useState, useEffect } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { incidenciaService } from "../../../src/services/incidencia.service";
import { tipoIncidenciaService } from "../../../src/services/tipo-incidencia.service";
import { TipoIncidencia } from "../../../src/models/tipo-incidencia.model";
import { IncidenciaResponse } from "../../../src/models/incidencia.model";

export default function EditarIncidenciaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incidencia, setIncidencia] = useState<IncidenciaResponse | null>(null);
  const [tipos, setTipos] = useState<TipoIncidencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [imagenesExistentes, setImagenesExistentes] = useState<string[]>([]);

  const [imagenesNuevas, setImagenesNuevas] = useState<string[]>([]);

  const [form, setForm] = useState({
    tipoId: 0,
    prioridad: "",
    detalle: "",
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [incData, tiposData] = await Promise.all([
        incidenciaService.obtenerPorId(Number(id)),
        tipoIncidenciaService.getTipos(),
      ]);

      if (incData.estado !== "PENDIENTE") {
        Alert.alert(
          "No permitido",
          "Solo se puede editar una incidencia pendiente.",
        );
        router.back();
        return;
      }

      setIncidencia(incData);
      setTipos(tiposData);
      setImagenesExistentes(incData.imagenesEmpleado ?? []);

      const tipoActual = tiposData.find((t) => t.nombre === incData.tipo);
      setForm({
        tipoId: tipoActual?.id ?? 0,
        prioridad: incData.prioridad,
        detalle: incData.detalle,
      });
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la incidencia");
      router.back();
    } finally {
      setCargando(false);
    }
  };

  const totalImagenes = imagenesExistentes.length + imagenesNuevas.length;

  const seleccionarImagen = async () => {
    if (totalImagenes >= 3) {
      Alert.alert("Límite", "Puedes tener máximo 3 imágenes");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImagenesNuevas([...imagenesNuevas, result.assets[0].base64]);
    }
  };

  const tomarFoto = async () => {
    if (totalImagenes >= 3) {
      Alert.alert("Límite", "Puedes tener máximo 3 imágenes");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImagenesNuevas([...imagenesNuevas, result.assets[0].base64]);
    }
  };

  const eliminarImagenExistente = (index: number) => {
    Alert.alert("Eliminar imagen", "¿Deseas eliminar esta imagen?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          setImagenesExistentes(
            imagenesExistentes.filter((_, i) => i !== index),
          ),
      },
    ]);
  };

  const eliminarImagenNueva = (index: number) => {
    setImagenesNuevas(imagenesNuevas.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (form.tipoId === 0) {
      Alert.alert("Validación", "Selecciona un tipo de incidencia");
      return;
    }
    if (!form.prioridad) {
      Alert.alert("Validación", "Selecciona una prioridad");
      return;
    }
    if (!form.detalle.trim()) {
      Alert.alert("Validación", "Describe el problema en detalle");
      return;
    }

    setGuardando(true);
    try {
      const imagenesParaEnviar =
        imagenesNuevas.length > 0 ||
        imagenesExistentes.length !==
          (incidencia?.imagenesEmpleado?.length ?? 0)
          ? imagenesNuevas
          : [];

      await incidenciaService.actualizar(Number(id), {
        tipoId: form.tipoId,
        prioridad: form.prioridad,
        detalle: form.detalle,
        imagenesBase64: imagenesParaEnviar,
      });

      Alert.alert("¡Listo!", "Incidencia actualizada correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error || "No se pudo actualizar");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Editar Incidencia</Text>
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
          <View style={styles.card}>
            {/* Tipo */}
            <Text style={styles.label}>Tipo de Incidencia</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.tipoId}
                onValueChange={(v) => {
                  if (v !== 0) setForm({ ...form, tipoId: v });
                }}
                style={styles.picker}
                enabled={!guardando}
              >
                <Picker.Item
                  label="— Seleccione un tipo —"
                  value={0}
                  enabled={false}
                  color="#9ca3af"
                />
                {tipos.map((t) => (
                  <Picker.Item key={t.id} label={t.nombre} value={t.id} />
                ))}
              </Picker>
            </View>

            {/* Prioridad */}
            <Text style={styles.label}>Prioridad</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.prioridad}
                onValueChange={(v) => {
                  if (v !== "") setForm({ ...form, prioridad: v });
                }}
                style={styles.picker}
                enabled={!guardando}
              >
                <Picker.Item
                  label="— Seleccione una prioridad —"
                  value=""
                  enabled={false}
                  color="#9ca3af"
                />
                <Picker.Item label="Baja" value="Baja" />
                <Picker.Item label="Media" value="Media" />
                <Picker.Item label="Alta" value="Alta" />
                <Picker.Item label="Critica" value="Critica" />
              </Picker>
            </View>

            {/* Detalle */}
            <Text style={styles.label}>Detalle del Problema</Text>
            <TextInput
              style={[
                styles.textarea,
                focusedField === "detalle" && styles.inputFocused,
              ]}
              placeholder="Describe el problema en detalle..."
              placeholderTextColor="#9ca3af"
              value={form.detalle}
              onChangeText={(v) => setForm({ ...form, detalle: v })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              onFocus={() => setFocusedField("detalle")}
              onBlur={() => setFocusedField(null)}
              editable={!guardando}
            />
          </View>

          {/* Imágenes */}
          <View style={styles.card}>
            <Text style={styles.labelSeccion}>
              IMÁGENES ({totalImagenes}/3)
            </Text>

            {/* Imágenes existentes */}
            {imagenesExistentes.length > 0 && (
              <View style={styles.imagenesContainer}>
                <Text style={styles.imagenSubLabel}>Imágenes actuales:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
                  {imagenesExistentes.map((url, index) => (
                    <View
                      key={index}
                      style={{ position: "relative", marginRight: 8 }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.imagenMiniatura}
                      />
                      <TouchableOpacity
                        style={styles.eliminarImagen}
                        onPress={() => eliminarImagenExistente(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Imágenes nuevas */}
            {imagenesNuevas.length > 0 && (
              <View style={styles.imagenesContainer}>
                <Text style={styles.imagenSubLabel}>Imágenes nuevas:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
                  {imagenesNuevas.map((img, index) => (
                    <View
                      key={index}
                      style={{ position: "relative", marginRight: 8 }}
                    >
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${img}` }}
                        style={styles.imagenMiniatura}
                      />
                      <TouchableOpacity
                        style={styles.eliminarImagen}
                        onPress={() => eliminarImagenNueva(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Botones agregar imagen */}
            {totalImagenes < 3 && (
              <View style={styles.botonesImagen}>
                <TouchableOpacity
                  style={styles.botonImagen}
                  onPress={tomarFoto}
                  disabled={guardando}
                >
                  <View style={styles.botonImagenIcono}>
                    <Ionicons name="camera-outline" size={24} color="#16a34a" />
                  </View>
                  <Text style={styles.botonImagenTexto}>Tomar Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonImagen}
                  onPress={seleccionarImagen}
                  disabled={guardando}
                >
                  <View style={styles.botonImagenIcono}>
                    <Ionicons name="image-outline" size={24} color="#16a34a" />
                  </View>
                  <Text style={styles.botonImagenTexto}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonDesactivado]}
            onPress={handleGuardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.botonGuardarTexto}>Guardar Cambios</Text>
              </>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelSeccion: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1,
    marginBottom: 4,
  },
  imagenSubLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  pickerContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  picker: { color: "#111827" },
  textarea: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  inputFocused: { borderColor: "#16a34a" },
  imagenesContainer: { marginTop: 4 },
  imagenMiniatura: { width: 80, height: 80, borderRadius: 8 },
  eliminarImagen: { position: "absolute", top: -6, right: -6 },
  botonesImagen: { flexDirection: "row", gap: 12, marginTop: 8 },
  botonImagen: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  botonImagenIcono: {
    width: 48,
    height: 48,
    backgroundColor: "#f0fdf4",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  botonImagenTexto: { fontSize: 12, color: "#374151", fontWeight: "600" },
  botonGuardar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    borderRadius: 12,
    height: 52,
    gap: 8,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonDesactivado: { backgroundColor: "#9ca3af" },
  botonGuardarTexto: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

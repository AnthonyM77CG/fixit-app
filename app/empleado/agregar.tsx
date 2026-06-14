import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../src/context/AuthContext";
import { incidenciaService } from "../../src/services/incidencia.service";
import { tipoIncidenciaService } from "../../src/services/tipo-incidencia.service";
import { TipoIncidencia } from "../../src/models/tipo-incidencia.model";

export default function AgregarScreen() {
  const router = useRouter();
  const { cerrarSesion, usuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [tipos, setTipos] = useState<TipoIncidencia[]>([]);
  const [imagenes, setImagenes] = useState<string[]>([]);

  const [form, setForm] = useState({
    tipoId: 0,
    prioridad: "",
    detalle: "",
  });

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    try {
      const data = await tipoIncidenciaService.getTipos();
      setTipos(data);
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar los tipos de incidencia");
    }
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const tomarFoto = async () => {
    if (imagenes.length >= 3) {
      Alert.alert("Límite", "Puedes subir máximo 3 imágenes");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImagenes([...imagenes, result.assets[0].base64]);
    }
  };

  const seleccionarImagen = async () => {
    if (imagenes.length >= 3) {
      Alert.alert("Límite", "Puedes subir máximo 3 imágenes");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImagenes([...imagenes, result.assets[0].base64]);
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
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
    if (imagenes.length === 0) {
      Alert.alert(
        "Falta evidencia",
        "Por favor, adjunta al menos una foto (cámara o galería) del problema antes de registrar la incidencia.",
      );
      return;
    }

    setCargando(true);
    try {
      await incidenciaService.crearIncidencia({
        tipoId: form.tipoId,
        prioridad: form.prioridad,
        detalle: form.detalle,
        imagenesBase64: imagenes,
      });

      Alert.alert("¡Listo!", "Incidencia registrada correctamente", [
        {
          text: "Ver historial",
          onPress: () => router.push("/empleado/historial"),
        },
      ]);

      // Limpiar formulario
      setForm({ tipoId: 0, prioridad: "", detalle: "" });
      setImagenes([]);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.error || "No se pudo registrar la incidencia",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <View style={styles.notifContainer}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonCerrar}
          onPress={handleCerrarSesion}
        >
          <Ionicons name="log-out-outline" size={16} color="#fff" />
          <Text style={styles.botonCerrarTexto}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título unificado con separación controlada */}
        <Text style={styles.titulo}>Registrar Incidencia</Text>

        <View style={styles.card}>
          {/* Tipo */}
          <Text style={styles.label}>Tipo:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.tipoId}
              onValueChange={(v) => {
                if (v !== 0) setForm({ ...form, tipoId: v });
              }}
              style={styles.picker}
              enabled={!cargando}
            >
              <Picker.Item
                label="Seleccionar..."
                value={0}
                enabled={false}
                color="#9ca3af"
              />
              {tipos.map((t) => (
                <Picker.Item key={t.id} label={t.nombre} value={t.id} />
              ))}
            </Picker>
          </View>

          {/* Área */}
          <Text style={styles.label}>Área:</Text>
          <View style={styles.areaContainer}>
            <Ionicons name="location-outline" size={18} color="#16a34a" />
            <Text style={styles.areaTexto}>{usuario?.area}</Text>
          </View>

          {/* Prioridad */}
          <Text style={styles.label}>Prioridad:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.prioridad}
              onValueChange={(v) => {
                if (v !== "") setForm({ ...form, prioridad: v });
              }}
              style={styles.picker}
              enabled={!cargando}
            >
              <Picker.Item
                label="Seleccionar..."
                value=""
                enabled={false}
                color="#9ca3af"
              />
              <Picker.Item label="Baja" value="Baja" />
              <Picker.Item label="Media" value="Media" />
              <Picker.Item label="Alta" value="Alta" />
              <Picker.Item label="Crítica" value="Critica" />
            </Picker>
          </View>

          {/* Detalle */}
          <Text style={styles.label}>Detalle Técnico:</Text>
          <TextInput
            style={[styles.textarea, cargando && { opacity: 0.5 }]}
            placeholder="Describe el problema en detalle..."
            placeholderTextColor="#9ca3af"
            value={form.detalle}
            onChangeText={(v) => setForm({ ...form, detalle: v })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!cargando}
          />

          {/* Sección de Imagenes */}
          <Text style={styles.label}>Evidencia Fotográfica:</Text>
          <View style={styles.botonesImagen}>
            <TouchableOpacity
              style={styles.botonImagen}
              onPress={tomarFoto}
              disabled={cargando}
            >
              <Ionicons name="camera-outline" size={28} color="#16a34a" />
              <Text style={styles.botonImagenTexto}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonImagen}
              onPress={seleccionarImagen}
              disabled={cargando}
            >
              <Ionicons name="image-outline" size={28} color="#16a34a" />
              <Text style={styles.botonImagenTexto}>Galería</Text>
            </TouchableOpacity>
          </View>

          {/* Preview imágenes */}
          {imagenes.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagenesRow}
            >
              {imagenes.map((img, index) => (
                <View key={index} style={styles.imagenPreview}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${img}` }}
                    style={styles.imagenMiniatura}
                  />
                  <TouchableOpacity
                    style={styles.eliminarImagen}
                    onPress={() => eliminarImagen(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Botón */}
          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDesactivado]}
            onPress={handleSubmit}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Agregar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  notifContainer: { position: "relative" },
  notifDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  botonCerrar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  areaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  areaTexto: {
    fontSize: 15,
    color: "#16a34a",
    fontWeight: "600",
  },
  botonCerrarTexto: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scroll: { padding: 20, paddingBottom: 40 },

  // Modificado para coincidir con tu módulo y dar espacio abajo
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18, // 👈 ¡ESTA línea empuja la card para que respire la interfaz!
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  picker: { color: "#1a1a1a" },
  textarea: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1a1a1a",
    minHeight: 100,
    marginBottom: 16,
  },
  imagenContainer: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 10,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  imagenTexto: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  imagenesRow: { marginBottom: 16 },
  imagenPreview: { position: "relative", marginRight: 8 },
  imagenMiniatura: { width: 70, height: 70, borderRadius: 8 },
  eliminarImagen: { position: "absolute", top: -6, right: -6 },
  boton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    height: 52,
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
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "700" },

  botonesImagen: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  botonImagen: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
  },
  botonImagenTexto: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
});

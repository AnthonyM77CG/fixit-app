import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { incidenciaService } from "../../../src/services/incidencia.service";
import { IncidenciaResponse } from "../../../src/models/incidencia.model";
import { crearWebSocket } from "../../../src/services/websocket.service";

export default function AtencionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incidencia, setIncidencia] = useState<IncidenciaResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tomando, setTomando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [comentario, setComentario] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  const cargarIncidencia = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await incidenciaService.obtenerPorId(Number(id));
      setIncidencia(data);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la tarea");
      router.back();
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        cargarIncidencia(true);
      }
      const ws = crearWebSocket(() => cargarIncidencia(false));
      return () => ws.close();
    }, [id]),
  );

  const handleTomarIncidencia = async () => {
    Alert.alert("Tomar Incidencia", "¿Confirmas que tomarás esta incidencia?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: tomarIncidencia },
    ]);
  };

  const tomarIncidencia = async () => {
    setTomando(true);
    try {
      const actualizada = await incidenciaService.tomarIncidencia(Number(id));
      setIncidencia(actualizada);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.error || "No se pudo tomar la incidencia",
      );
    } finally {
      setTomando(false);
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

  const eliminarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleCerrarTicket = async () => {
    const comentarioValido = comentario.trim().length > 0;
    const imagenesValidas = imagenes.length > 0;

    if (!comentarioValido && !imagenesValidas) {
      Alert.alert(
        "Validación",
        "Por favor, ingresa un comentario y  al menos una imagen de evidencia para cerrar el ticket.",
      );
      return;
    }

    if (!comentarioValido) {
      Alert.alert(
        "Validación",
        "Es necesario agregar un comentario técnico antes de cerrar.",
      );
      return;
    }

    if (!imagenesValidas) {
      Alert.alert(
        "Validación",
        "Debes adjuntar al menos una imagen de evidencia para cerrar el ticket.",
      );
      return;
    }

    Alert.alert(
      "Cerrar Ticket",
      "¿Estás seguro que deseas marcar esta incidencia como resuelta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", style: "destructive", onPress: cerrarTicket },
      ],
    );
  };

  const cerrarTicket = async () => {
    setGuardando(true);
    try {
      await incidenciaService.actualizarEstado(
        Number(id),
        "RESUELTO",
        comentario,
        imagenes,
      );
      Alert.alert(
        "¡Ticket Cerrado!",
        "La incidencia fue marcada como resuelta",
        [
          {
            text: "OK",
            onPress: () => router.replace("tecnico/asignados"),
          },
        ],
      );
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.error || "No se pudo cerrar el ticket",
      );
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

  if (!incidencia) return null;

  const esPendiente = incidencia.estado === "PENDIENTE";
  const esEnProceso = incidencia.estado === "EN_PROCESO";

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
        <Text style={styles.headerTitulo}>Detalle de Tarea</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Modal imagen ampliada */}
      <Modal
        visible={imagenAmpliada !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setImagenAmpliada(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setImagenAmpliada(null)}
          activeOpacity={1}
        >
          <Image
            source={{ uri: imagenAmpliada! }}
            style={styles.imagenAmpliada}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.cerrarModal}
            onPress={() => setImagenAmpliada(null)}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Problema reportado */}
        <View style={styles.card}>
          <Text style={styles.seccionLabel}>PROBLEMA REPORTADO</Text>
          <Text style={styles.detalleTexto}>{incidencia.detalle}</Text>
          <View style={styles.infoFila}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValor}>{incidencia.tipo}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Prioridad</Text>
              <Text style={styles.infoValor}>{incidencia.prioridad}</Text>
            </View>
          </View>
          <View style={styles.infoFila}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Área</Text>
              <Text style={styles.infoValor}>{incidencia.area}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Reportado por</Text>
              <Text style={styles.infoValor}>{incidencia.empleado}</Text>
            </View>
          </View>

          {/* ✅ Imágenes del empleado */}
          {incidencia.imagenesEmpleado &&
            incidencia.imagenesEmpleado.length > 0 && (
              <View style={styles.imagenesContainer}>
                <Text style={styles.imagenLabel}>Evidencia del empleado:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
                  {incidencia.imagenesEmpleado.map((url, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setImagenAmpliada(url)}
                      style={{ marginRight: 8 }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.imagenMiniatura}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

          {/* ✅ Imágenes del técnico — solo si está resuelto */}
          {incidencia.estado === "RESUELTO" &&
            incidencia.imagenesTecnico &&
            incidencia.imagenesTecnico.length > 0 && (
              <View style={styles.imagenesContainer}>
                <Text style={styles.imagenLabel}>Evidencia del técnico:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
                  {incidencia.imagenesTecnico.map((url, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setImagenAmpliada(url)}
                      style={{ marginRight: 8 }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.imagenMiniatura}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
        </View>

        {/* PENDIENTE — botón tomar incidencia */}
        {esPendiente && (
          <TouchableOpacity
            style={[styles.botonTomar, tomando && styles.botonDesactivado]}
            onPress={handleTomarIncidencia}
            disabled={tomando}
          >
            {tomando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="hand-left-outline" size={20} color="#fff" />
                <Text style={styles.botonTomarTexto}>Tomar Incidencia</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* EN_PROCESO — formulario de resolución */}
        {esEnProceso && (
          <>
            {/* Comentario técnico */}
            <View style={styles.card}>
              <Text style={styles.seccionLabel}>COMENTARIO TÉCNICO</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Describe las acciones realizadas, diagnóstico y solución aplicada..."
                placeholderTextColor="#9ca3af"
                value={comentario}
                onChangeText={setComentario}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                editable={!guardando}
              />
            </View>

            {/* Foto de evidencia */}
            <View style={styles.card}>
              <Text style={styles.seccionLabel}>FOTO DE EVIDENCIA</Text>
              <View style={styles.botonesImagen}>
                <TouchableOpacity
                  style={styles.botonImagen}
                  onPress={tomarFoto}
                  disabled={guardando}
                >
                  <View style={styles.botonImagenIcono}>
                    <Ionicons name="camera-outline" size={28} color="#16a34a" />
                  </View>
                  <Text style={styles.botonImagenTexto}>Tomar Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonImagen}
                  onPress={seleccionarImagen}
                  disabled={guardando}
                >
                  <View style={styles.botonImagenIcono}>
                    <Ionicons name="image-outline" size={28} color="#16a34a" />
                  </View>
                  <Text style={styles.botonImagenTexto}>Galería</Text>
                </TouchableOpacity>
              </View>

              {imagenes.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 12 }}
                >
                  {imagenes.map((img, index) => (
                    <View
                      key={index}
                      style={{ position: "relative", marginRight: 8 }}
                    >
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${img}` }}
                        style={{ width: 80, height: 80, borderRadius: 8 }}
                      />
                      <TouchableOpacity
                        style={{ position: "absolute", top: -6, right: -6 }}
                        onPress={() => eliminarImagen(index)}
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
              )}
            </View>

            {/* Botón cerrar ticket */}
            <TouchableOpacity
              style={[styles.botonCerrar, guardando && styles.botonDesactivado]}
              onPress={handleCerrarTicket}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.botonCerrarTexto}>Cerrar Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* RESUELTO — solo lectura */}
        {incidencia.estado === "RESUELTO" && (
          <View style={styles.card}>
            <View style={styles.resueltoBanner}>
              <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
              <Text style={styles.resueltoTexto}>Incidencia Resuelta</Text>
            </View>
          </View>
        )}
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
  },
  seccionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1,
    marginBottom: 12,
  },
  detalleTexto: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  infoFila: { flexDirection: "row", gap: 12, marginTop: 8 },
  infoItem: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValor: { fontSize: 13, color: "#374151", fontWeight: "600" },
  imagenesContainer: { marginTop: 12 },
  imagenLabel: { fontSize: 12, color: "#6b7280" },
  imagenMiniatura: { width: 80, height: 80, borderRadius: 8 },
  botonTomar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    borderRadius: 14,
    height: 56,
    gap: 8,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonTomarTexto: { color: "#fff", fontSize: 16, fontWeight: "700" },
  textarea: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1a1a1a",
    minHeight: 120,
  },
  botonesImagen: { flexDirection: "row", gap: 12 },
  botonImagen: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  botonImagenIcono: {
    width: 56,
    height: 56,
    backgroundColor: "#f0fdf4",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  botonImagenTexto: { fontSize: 13, color: "#374151", fontWeight: "600" },
  botonCerrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    borderRadius: 14,
    height: 56,
    gap: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonDesactivado: { backgroundColor: "#9ca3af" },
  botonCerrarTexto: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resueltoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 8,
  },
  resueltoTexto: { fontSize: 18, fontWeight: "700", color: "#16a34a" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagenAmpliada: { width: "90%", height: "70%" },
  cerrarModal: { position: "absolute", top: 50, right: 20 },
});

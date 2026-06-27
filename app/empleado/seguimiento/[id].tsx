import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { incidenciaService } from "../../../src/services/incidencia.service";
import { IncidenciaResponse } from "../../../src/models/incidencia.model";
import { crearWebSocket } from "../../../src/services/websocket.service";

const estadoConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  PENDIENTE: { color: "#92400e", bg: "#fef3c7", label: "Pendiente" },
  EN_PROCESO: { color: "#1e40af", bg: "#dbeafe", label: "En Proceso" },
  RESUELTO: { color: "#065f46", bg: "#d1fae5", label: "Resuelto" },
};

const prioridadConfig: Record<string, { color: string; bg: string }> = {
  Baja: { color: "#065f46", bg: "#d1fae5" },
  Media: { color: "#92400e", bg: "#fef3c7" },
  Alta: { color: "#991b1b", bg: "#fee2e2" },
  Critica: { color: "#fff", bg: "#ef4444" },
};

export default function EmpleadoDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incidencia, setIncidencia] = useState<IncidenciaResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      cargarDatos(true);

      const ws = crearWebSocket(() => cargarDatos(false));

      return () => {
        if (ws) ws.close();
      };
    }, [id]),
  );

  const cargarDatos = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await incidenciaService.obtenerPorId(Number(id));
      setIncidencia(data);
    } catch (e: any) {
      if (mostrarSpinner) {
        Alert.alert("Error", "No se pudo cargar la incidencia");
        router.back();
      }
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!incidencia) return null;

  const estadoActual =
    estadoConfig[incidencia.estado] ?? estadoConfig.PENDIENTE;
  const prioridad =
    prioridadConfig[incidencia.prioridad] ?? prioridadConfig.Media;

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
        <Text style={styles.headerTitulo}>Mi Incidencia</Text>
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
          style={styles.modalImagenOverlay}
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Detalles */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Detalles del Reporte</Text>

          <Text style={styles.label}>Tipo de Problema</Text>
          <Text style={styles.valor}>{incidencia.tipo}</Text>

          <Text style={styles.label}>Descripción</Text>
          <Text style={styles.valor}>{incidencia.detalle}</Text>

          <View style={styles.fila}>
            <View style={styles.filaItem}>
              <Text style={styles.label}>Prioridad Asignada</Text>
              <View style={[styles.badge, { backgroundColor: prioridad.bg }]}>
                <Text style={[styles.badgeTexto, { color: prioridad.color }]}>
                  {incidencia.prioridad}
                </Text>
              </View>
            </View>
            <View style={styles.filaItem}>
              <Text style={styles.label}>Estado Actual</Text>
              <View
                style={[styles.badge, { backgroundColor: estadoActual.bg }]}
              >
                <Text
                  style={[styles.badgeTexto, { color: estadoActual.color }]}
                >
                  {estadoActual.label}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Fecha de reporte</Text>
          <Text style={styles.valor}>
            {formatFecha(incidencia.fechaApertura)}
          </Text>

          <Text style={styles.label}>Área afectada</Text>
          <Text style={styles.valor}>{incidencia.area}</Text>

          {/* Imágenes adjuntadas por el empleado */}
          {incidencia.imagenesEmpleado &&
            incidencia.imagenesEmpleado.length > 0 && (
              <View style={styles.imagenesContainer}>
                <Text style={styles.imagenLabel}>Tus evidencias adjuntas:</Text>
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

          {/* Imágenes de resolución (Técnico) */}
          {incidencia.imagenesTecnico &&
            incidencia.imagenesTecnico.length > 0 && (
              <View style={styles.imagenesContainer}>
                <Text style={styles.imagenLabel}>
                  Evidencia de solución (Técnico):
                </Text>
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

        {/* Información del Técnico */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Técnico a Cargo</Text>

          {incidencia.tecnico ? (
            <View style={styles.tecnicoAsignadoContainer}>
              <View style={styles.tecnicoIcono}>
                <Ionicons name="person" size={24} color="#16a34a" />
              </View>
              <View style={styles.tecnicoInfo}>
                <Text style={styles.tecnicoNombre}>{incidencia.tecnico}</Text>
                <Text style={styles.tecnicoLabel}>Atendiendo tu solicitud</Text>
              </View>
              <Ionicons name="chatbubbles-outline" size={24} color="#16a34a" />
            </View>
          ) : (
            <View style={styles.sinTecnicoContainer}>
              <Ionicons name="warning-outline" size={32} color="#f59e0b" />
              <Text style={styles.sinTecnicoTexto}>
                Aún no tienes un técnico asignado
              </Text>
            </View>
          )}
        </View>

        {/* Seguimiento*/}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Historial de Seguimiento</Text>
          {incidencia.seguimientos.map((seg, index) => {
            const config = estadoConfig[seg.estado] ?? estadoConfig.PENDIENTE;
            const esUltimo = index === incidencia.seguimientos.length - 1;
            return (
              <View key={index} style={styles.seguimientoItem}>
                <View style={styles.seguimientoLateral}>
                  <View style={[styles.punto, esUltimo && styles.puntoActivo]}>
                    <Ionicons name="ellipse" size={10} color="#fff" />
                  </View>
                  {!esUltimo && <View style={styles.linea} />}
                </View>
                <View style={styles.seguimientoContenido}>
                  <Text
                    style={[
                      styles.seguimientoEstado,
                      esUltimo && { color: "#16a34a" },
                    ]}
                  >
                    {config.label}
                  </Text>
                  <Text style={styles.seguimientoFecha}>
                    {new Date(seg.fecha).toLocaleDateString("es-PE")} —{" "}
                    {new Date(seg.fecha).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {seg.comentario && (
                    <Text style={styles.seguimientoComentario}>
                      {seg.comentario}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Acciones */}
        {incidencia.estado === "PENDIENTE" && (
          <View style={styles.accionesContainer}>
            <TouchableOpacity
              style={[styles.botonAccion, styles.botonEditar]}
              onPress={() => router.push(`/empleado/editar/${incidencia.id}`)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.botonTexto}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonAccion, styles.botonEliminar]}
              onPress={() =>
                Alert.alert(
                  "Eliminar incidencia",
                  "¿Estás seguro de que deseas eliminar esta incidencia?",
                  [
                    {
                      text: "Cancelar",
                      style: "cancel",
                    },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await incidenciaService.eliminar(incidencia.id);
                          Alert.alert(
                            "Éxito",
                            "La incidencia fue eliminada correctamente.",
                          );
                          router.back();
                        } catch (error) {
                          Alert.alert(
                            "Error",
                            "No se pudo eliminar la incidencia.",
                          );
                        }
                      },
                    },
                  ],
                )
              }
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.botonTexto}>Eliminar</Text>
            </TouchableOpacity>
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
  scroll: { padding: 16, gap: 16 },
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
  cardTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 12,
  },
  valor: { fontSize: 14, color: "#374151", lineHeight: 20 },
  fila: { flexDirection: "row", gap: 16 },
  filaItem: { flex: 1 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeTexto: { fontSize: 12, fontWeight: "700" },
  imagenesContainer: { marginTop: 16 },
  imagenLabel: { fontSize: 13, color: "#4b5563", fontWeight: "600" },
  imagenMiniatura: { width: 80, height: 80, borderRadius: 8 },

  /* Contenedores de Técnico para Empleado */
  tecnicoAsignadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
  },
  tecnicoIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  tecnicoInfo: { flex: 1 },
  tecnicoNombre: { fontSize: 15, fontWeight: "700", color: "#111827" },
  tecnicoLabel: { fontSize: 12, color: "#16a34a", marginTop: 2 },
  sinTecnicoContainer: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
    marginBottom: 8,
  },
  sinTecnicoTexto: { fontSize: 14, color: "#f59e0b", fontWeight: "600" },

  /* Estilos de Seguimiento adaptados */
  seguimientoItem: { flexDirection: "row", gap: 12, marginBottom: 8 },
  seguimientoLateral: { alignItems: "center", width: 28 },
  punto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#9ca3af",
    justifyContent: "center",
    alignItems: "center",
  },
  puntoActivo: { backgroundColor: "#16a34a" },
  linea: { width: 2, flex: 1, backgroundColor: "#d1fae5", marginVertical: 4 },
  seguimientoContenido: { flex: 1, paddingBottom: 16 },
  seguimientoEstado: { fontSize: 15, fontWeight: "700", color: "#111827" },
  seguimientoFecha: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  seguimientoComentario: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    fontStyle: "italic",
  },

  /* Modal de Imagen */
  modalImagenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagenAmpliada: { width: "90%", height: "70%" },
  cerrarModal: { position: "absolute", top: 50, right: 20 },
  accionesContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },

  botonAccion: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  botonEditar: {
    backgroundColor: "#16a34a",
  },
  botonEliminar: {
    backgroundColor: "#ef4444",
  },
  botonTexto: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

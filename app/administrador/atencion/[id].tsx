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
import { usuarioService } from "../../../src/services/usuario.service";
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

interface Tecnico {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
}

export default function AdminDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incidencia, setIncidencia] = useState<IncidenciaResponse | null>(null);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [asignando, setAsignando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null); // ✅ agregar

  const cargarDatos = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const [incData, tecData] = await Promise.all([
        incidenciaService.obtenerPorId(Number(id)),
        usuarioService.obtenerTecnicos(),
      ]);
      setIncidencia(incData);
      setTecnicos(tecData);
    } catch (e: any) {
      Alert.alert("Error", "No se pudo cargar la incidencia");
      router.back();
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos(true);

      const ws = crearWebSocket(() => cargarDatos(false));
      return () => ws.close();
    }, [id]),
  );

  const handleAsignar = async (tecnicoId: number, tecnicoNombre: string) => {
    setModalVisible(false);
    setAsignando(true);
    try {
      const actualizada = await incidenciaService.asignarTecnico(
        Number(id),
        tecnicoId,
      );
      setIncidencia(actualizada);
      Alert.alert("¡Listo!", `Técnico ${tecnicoNombre} asignado correctamente`);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.error || "No se pudo asignar el técnico",
      );
    } finally {
      setAsignando(false);
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
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
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
          onPress={() => router.push("/administrador/incidencias")}
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Detalle</Text>
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
          <Text style={styles.cardTitulo}>Detalles de la Incidencia</Text>

          <Text style={styles.label}>Tipo</Text>
          <Text style={styles.valor}>{incidencia.tipo}</Text>

          <Text style={styles.label}>Detalle Técnico</Text>
          <Text style={styles.valor}>{incidencia.detalle}</Text>

          <View style={styles.fila}>
            <View style={styles.filaItem}>
              <Text style={styles.label}>Prioridad</Text>
              <View style={[styles.badge, { backgroundColor: prioridad.bg }]}>
                <Text style={[styles.badgeTexto, { color: prioridad.color }]}>
                  {incidencia.prioridad}
                </Text>
              </View>
            </View>
            <View style={styles.filaItem}>
              <Text style={styles.label}>Estado</Text>
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

          <Text style={styles.label}>Fecha de apertura</Text>
          <Text style={styles.valor}>
            {formatFecha(incidencia.fechaApertura)}
          </Text>

          <Text style={styles.label}>Reportado por</Text>
          <Text style={styles.valor}>{incidencia.empleado}</Text>

          <Text style={styles.label}>Área</Text>
          <Text style={styles.valor}>{incidencia.area}</Text>

          {/* Imágenes del empleado */}
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

          {/* Imágenes del técnico — siempre visible si existen */}
          {incidencia.imagenesTecnico &&
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

        {/* Asignación de técnico */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Asignación de Técnico</Text>

          {incidencia.tecnico ? (
            <View style={styles.tecnicoAsignadoContainer}>
              <View style={styles.tecnicoIcono}>
                <Ionicons name="person" size={24} color="#7c3aed" />
              </View>
              <View style={styles.tecnicoInfo}>
                <Text style={styles.tecnicoNombre}>{incidencia.tecnico}</Text>
                <Text style={styles.tecnicoLabel}>Técnico asignado</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            </View>
          ) : (
            <View style={styles.sinTecnicoContainer}>
              <Ionicons name="warning-outline" size={32} color="#f59e0b" />
              <Text style={styles.sinTecnicoTexto}>Sin técnico asignado</Text>
            </View>
          )}

          {/* ✅ Solo muestra el botón si está PENDIENTE */}
          {incidencia.estado === "PENDIENTE" ? (
            <TouchableOpacity
              style={[
                styles.botonAsignar,
                asignando && styles.botonDesactivado,
              ]}
              onPress={() => setModalVisible(true)}
              disabled={asignando}
            >
              {asignando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.botonAsignarTexto}>
                    {incidencia.tecnico ? "Cambiar Técnico" : "Asignar Técnico"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            // ✅ Mensaje informativo cuando ya no se puede cambiar
            <View style={styles.asignacionBloqueadaContainer}>
              <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" />
              <Text style={styles.asignacionBloqueadaTexto}>
                {incidencia.estado === "RESUELTO"
                  ? "Incidencia resuelta, no se puede reasignar"
                  : "El técnico ya tomó la incidencia"}
              </Text>
            </View>
          )}
        </View>

        {/* Seguimiento */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Seguimiento</Text>
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
                      esUltimo && { color: "#7c3aed" },
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
      </ScrollView>

      {/* Modal selección de técnico */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Seleccionar Técnico</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {tecnicos.length === 0 ? (
                <View style={styles.vacio}>
                  <Text style={styles.vacioTexto}>
                    No hay técnicos disponibles
                  </Text>
                </View>
              ) : (
                tecnicos.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.tecnicoItem}
                    onPress={() =>
                      handleAsignar(t.id, `${t.nombre} ${t.apellido}`)
                    }
                  >
                    <View style={styles.tecnicoAvatar}>
                      <Ionicons name="person" size={20} color="#7c3aed" />
                    </View>
                    <View style={styles.tecnicoItemInfo}>
                      <Text style={styles.tecnicoItemNombre}>
                        {t.nombre} {t.apellido}
                      </Text>
                      <Text style={styles.tecnicoItemCorreo}>{t.correo}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#d1d5db"
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  imagenesContainer: { marginTop: 12 },
  imagenLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  imagenMiniatura: { width: 80, height: 80, borderRadius: 8 },
  tecnicoAsignadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f5f3ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  tecnicoIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  tecnicoInfo: { flex: 1 },
  tecnicoNombre: { fontSize: 15, fontWeight: "700", color: "#111827" },
  tecnicoLabel: { fontSize: 12, color: "#7c3aed", marginTop: 2 },
  sinTecnicoContainer: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  sinTecnicoTexto: { fontSize: 14, color: "#f59e0b", fontWeight: "600" },
  botonAsignar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    height: 48,
    gap: 8,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonDesactivado: { backgroundColor: "#9ca3af" },
  botonAsignarTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
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
  puntoActivo: { backgroundColor: "#7c3aed" },
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
  modalImagenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagenAmpliada: { width: "90%", height: "70%" },
  cerrarModal: { position: "absolute", top: 50, right: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: "#111827" },
  tecnicoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tecnicoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  tecnicoItemInfo: { flex: 1 },
  tecnicoItemNombre: { fontSize: 15, fontWeight: "600", color: "#111827" },
  tecnicoItemCorreo: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  vacio: { paddingVertical: 40, alignItems: "center" },
  vacioTexto: { fontSize: 14, color: "#9ca3af" },
  asignacionBloqueadaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  asignacionBloqueadaTexto: {
    fontSize: 13,
    color: "#9ca3af",
    fontStyle: "italic",
    flex: 1,
  },
});

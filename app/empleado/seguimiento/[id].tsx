import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { incidenciaService } from "../../../src/services/incidencia.service";
import { IncidenciaResponse } from "../../../src/models/incidencia.model";

const estadoConfig: Record<
  string,
  { color: string; bg: string; label: string; icono: string }
> = {
  PENDIENTE: {
    color: "#92400e",
    bg: "#fef3c7",
    label: "Pendiente",
    icono: "time-outline",
  },
  EN_PROCESO: {
    color: "#1e40af",
    bg: "#dbeafe",
    label: "En Proceso",
    icono: "construct-outline",
  },
  RESUELTO: {
    color: "#065f46",
    bg: "#d1fae5",
    label: "Resuelto",
    icono: "checkmark-circle-outline",
  },
};

const prioridadConfig: Record<string, { color: string; bg: string }> = {
  Baja: { color: "#065f46", bg: "#d1fae5" },
  Media: { color: "#92400e", bg: "#fef3c7" },
  Alta: { color: "#991b1b", bg: "#fee2e2" },
  Critica: { color: "#fff", bg: "#ef4444" },
};

export default function SeguimientoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incidencia, setIncidencia] = useState<IncidenciaResponse | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarIncidencia();
  }, [id]);

  const cargarIncidencia = async () => {
    try {
      setCargando(true);
      const data = await incidenciaService.obtenerPorId(Number(id));
      setIncidencia(data);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la incidencia");
      router.back();
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          onPress={() => router.push("/empleado/historial")}
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Seguimiento</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Detalles de la incidencia */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Detalles de la Incidencia</Text>

          <Text style={styles.detalleLabel}>Detalle Técnico</Text>
          <Text style={styles.detalleTexto}>{incidencia.detalle}</Text>

          <View style={styles.fila}>
            <View style={styles.filaItem}>
              <Text style={styles.detalleLabel}>Prioridad</Text>
              <View style={[styles.badge, { backgroundColor: prioridad.bg }]}>
                <Text style={[styles.badgeTexto, { color: prioridad.color }]}>
                  {incidencia.prioridad}
                </Text>
              </View>
            </View>
            <View style={styles.filaItem}>
              <Text style={styles.detalleLabel}>Fecha de apertura</Text>
              <Text style={styles.detalleTexto}>
                {formatFecha(incidencia.fechaApertura)}
              </Text>
            </View>
          </View>

          <Text style={styles.detalleLabel}>Asignado a</Text>
          {incidencia.tecnico ? (
            <Text style={styles.detalleTexto}>
              {incidencia.tecnico} - Técnico
            </Text>
          ) : (
            <View style={styles.porAsignarContainer}>
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text style={styles.porAsignarTexto}>Por asignar</Text>
            </View>
          )}
        </View>

        {/* Estado actual y seguimiento */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Estado Actual:</Text>

          {incidencia.seguimientos.map((seg, index) => {
            const config = estadoConfig[seg.estado] ?? estadoConfig.PENDIENTE;
            const esUltimo = index === incidencia.seguimientos.length - 1;
            const esActual = esUltimo;

            return (
              <View key={index} style={styles.seguimientoItem}>
                {/* Línea y punto */}
                <View style={styles.seguimientoLateral}>
                  <View
                    style={[
                      styles.punto,
                      esActual
                        ? {
                            backgroundColor: "#fff",
                            borderWidth: 2,
                            borderColor: "#16a34a",
                          }
                        : { backgroundColor: "#16a34a" },
                    ]}
                  >
                    <Ionicons
                      name={config.icono as any}
                      size={14}
                      color={esActual ? "#16a34a" : "#fff"}
                    />
                  </View>
                  {!esUltimo && <View style={styles.linea} />}
                </View>

                {/* Contenido */}
                <View style={styles.seguimientoContenido}>
                  <Text
                    style={[
                      styles.seguimientoEstado,
                      esActual && { color: "#16a34a" },
                    ]}
                  >
                    {config.label}
                  </Text>
                  <Text style={styles.seguimientoFecha}>
                    {formatFecha(seg.fecha)}
                  </Text>
                  <Text style={styles.seguimientoHora}>
                    {formatHora(seg.fecha)}
                  </Text>

                  {esActual && (
                    <View style={styles.enProgresoTag}>
                      <Text style={styles.enProgresoTexto}>En progreso</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
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
  detalleLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 12,
  },
  detalleTexto: { fontSize: 14, color: "#374151", lineHeight: 20 },
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
  seguimientoItem: { flexDirection: "row", gap: 12, marginBottom: 8 },
  seguimientoLateral: { alignItems: "center", width: 28 },
  punto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  linea: { width: 2, flex: 1, backgroundColor: "#d1fae5", marginVertical: 4 },
  seguimientoContenido: { flex: 1, paddingBottom: 16 },
  seguimientoEstado: { fontSize: 16, fontWeight: "700", color: "#111827" },
  seguimientoFecha: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  seguimientoHora: { fontSize: 13, color: "#6b7280" },
  enProgresoTag: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 6,
  },
  enProgresoTexto: { fontSize: 12, color: "#1e40af", fontWeight: "600" },
  porAsignarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  porAsignarTexto: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});

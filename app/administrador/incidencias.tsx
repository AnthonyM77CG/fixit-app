import { useState, useCallback } from "react";
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
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { incidenciaService } from "../../src/services/incidencia.service";
import { IncidenciaResponse } from "../../src/models/incidencia.model";

type Tab = "pendientes" | "enProceso" | "resueltas";

const estadoConfig: Record<
  string,
  { color: string; bg: string; borde: string; label: string }
> = {
  PENDIENTE: {
    color: "#92400e",
    bg: "#fef3c7",
    borde: "#f59e0b",
    label: "Pendiente",
  },
  EN_PROCESO: {
    color: "#1e40af",
    bg: "#dbeafe",
    borde: "#3b82f6",
    label: "En Proceso",
  },
  RESUELTO: {
    color: "#065f46",
    bg: "#d1fae5",
    borde: "#10b981",
    label: "Resuelto",
  },
};

export default function AdminInicioScreen() {
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const [tab, setTab] = useState<Tab>("pendientes");
  const [incidencias, setIncidencias] = useState<IncidenciaResponse[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarIncidencias();
    }, []),
  );

  const cargarIncidencias = async () => {
    try {
      setCargando(true);
      const data = await incidenciaService.todasLasIncidencias();
      setIncidencias(data);
    } catch (e: any) {
      console.log("Error:", e.message);
      Alert.alert("Error", "No se pudieron cargar las incidencias");
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const pendientes = incidencias.filter((i) => i.estado === "PENDIENTE");
  const enProceso = incidencias.filter((i) => i.estado === "EN_PROCESO");
  const resueltas = incidencias.filter((i) => i.estado === "RESUELTO");
  const lista =
    tab === "pendientes"
      ? pendientes
      : tab === "enProceso"
        ? enProceso
        : resueltas;

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(["pendientes", "enProceso", "resueltas"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActivo]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabTexto, tab === t && styles.tabTextoActivo]}>
              {t === "pendientes"
                ? "Pendientes"
                : t === "enProceso"
                  ? "En Proceso"
                  : "Resueltas"}
            </Text>
            {tab === t && <View style={styles.tabIndicador} />}
          </TouchableOpacity>
        ))}
      </View>

      {cargando ? (
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
      ) : lista.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#d1d5db" />
          <Text style={styles.vacioTexto}>
            No hay incidencias en esta categoría
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {lista.map((inc) => {
            const config = estadoConfig[inc.estado] ?? estadoConfig.PENDIENTE;
            return (
              <TouchableOpacity
                key={inc.id}
                style={[styles.card, { borderLeftColor: config.borde }]}
                onPress={() => router.push(`/administrador/atencion/${inc.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitulo} numberOfLines={1}>
                    {inc.tipo}
                  </Text>
                  <Text style={styles.cardFecha}>
                    {formatFecha(inc.fechaApertura)}
                  </Text>
                </View>
                <Text style={styles.cardDetalle} numberOfLines={2}>
                  {inc.detalle}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardEmpleado}>
                    <Ionicons name="person-outline" size={12} color="#9ca3af" />{" "}
                    {inc.empleado}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.badgeTexto, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                </View>
                {inc.tecnico ? (
                  <Text style={styles.tecnicoAsignado}>
                    <Ionicons
                      name="construct-outline"
                      size={12}
                      color="#7c3aed"
                    />{" "}
                    {inc.tecnico}
                  </Text>
                ) : (
                  <Text style={styles.sinTecnico}>⚠ Sin técnico asignado</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
  botonCerrarTexto: { color: "#fff", fontSize: 12, fontWeight: "700" },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabActivo: {},
  tabTexto: { fontSize: 13, fontWeight: "600", color: "#9ca3af" },
  tabTextoActivo: { color: "#7c3aed", fontWeight: "700" },
  tabIndicador: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "60%",
    backgroundColor: "#7c3aed",
    borderRadius: 2,
  },
  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  cardFecha: { fontSize: 12, color: "#9ca3af" },
  cardDetalle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardEmpleado: { fontSize: 12, color: "#9ca3af" },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  badgeTexto: { fontSize: 12, fontWeight: "700" },
  tecnicoAsignado: { fontSize: 12, color: "#7c3aed", fontWeight: "600" },
  sinTecnico: { fontSize: 12, color: "#f59e0b", fontWeight: "600" },
  vacio: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  vacioTexto: { fontSize: 15, color: "#9ca3af", textAlign: "center" },
});

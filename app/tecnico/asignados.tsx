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
import { crearWebSocket } from "../../src/services/websocket.service";

type TabTecnico = "porAtender" | "enCurso" | "resueltos";

const estadoConfig: Record<
  string,
  { color: string; bg: string; borde: string; label: string }
> = {
  PENDIENTE: {
    color: "#92400e",
    bg: "#fef3c7",
    borde: "#f59e0b",
    label: "Por Atender",
  },
  EN_PROCESO: {
    color: "#1e40af",
    bg: "#dbeafe",
    borde: "#3b82f6",
    label: "En Curso",
  },
  RESUELTO: {
    color: "#065f46",
    bg: "#d1fae5",
    borde: "#10b981",
    label: "Resuelto",
  },
};

export default function AsignadasTecnicoScreen() {
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const [tab, setTab] = useState<TabTecnico>("porAtender");
  const [incidencias, setIncidencias] = useState<IncidenciaResponse[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarIncidenciasAsignadas(true);

      const ws = crearWebSocket(() => cargarIncidenciasAsignadas(false));
      return () => ws.close();
    }, []),
  );

  const cargarIncidenciasAsignadas = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await incidenciaService.misAsignaciones();
      setIncidencias(data);
    } catch (e: any) {
      console.log("Error status:", e.response?.status);
      console.log("Error data:", JSON.stringify(e.response?.data));
      console.log("Error message:", e.message);
      Alert.alert("Error", "No se pudieron cargar las tareas asignadas");
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  // Filtrado por el estado operacional del técnico
  const porAtender = incidencias.filter((i) => i.estado === "PENDIENTE");
  const enCurso = incidencias.filter((i) => i.estado === "EN_PROCESO");
  const resueltas = incidencias.filter((i) => i.estado === "RESUELTO");

  const listaFiltrada =
    tab === "porAtender" ? porAtender : tab === "enCurso" ? enCurso : resueltas;

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header Corporativo */}
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
        showsVerticalScrollIndicator={false}
      >
        {/* Título unificado idéntico a las otras pantallas */}
        <Text style={styles.titulo}>Mis Tareas</Text>

        {/* Triple Tab optimizado para el flujo de soporte */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === "porAtender" && styles.tabActivo]}
            onPress={() => setTab("porAtender")}
          >
            <Text
              style={[
                styles.tabTexto,
                tab === "porAtender" && styles.tabTextoActivo,
              ]}
            >
              Por Atender
            </Text>
            {tab === "porAtender" && <View style={styles.tabIndicador} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === "enCurso" && styles.tabActivo]}
            onPress={() => setTab("enCurso")}
          >
            <Text
              style={[
                styles.tabTexto,
                tab === "enCurso" && styles.tabTextoActivo,
              ]}
            >
              En Curso
            </Text>
            {tab === "enCurso" && <View style={styles.tabIndicador} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === "resueltos" && styles.tabActivo]}
            onPress={() => setTab("resueltos")}
          >
            <Text
              style={[
                styles.tabTexto,
                tab === "resueltos" && styles.tabTextoActivo,
              ]}
            >
              Resueltas
            </Text>
            {tab === "resueltos" && <View style={styles.tabIndicador} />}
          </TouchableOpacity>
        </View>

        {/* Contenido Dinámico de la Lista */}
        {cargando ? (
          <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
        ) : listaFiltrada.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={styles.vacioTexto}>
              {tab === "porAtender" &&
                "No tienes incidencias pendientes de asignación"}
              {tab === "enCurso" &&
                "No tienes trabajos en diagnóstico actualmente"}
              {tab === "resueltos" && "Aún no registras incidencias resueltas"}
            </Text>
          </View>
        ) : (
          <View style={styles.listaCardsContainer}>
            {listaFiltrada.map((inc) => {
              const config = estadoConfig[inc.estado] ?? estadoConfig.PENDIENTE;
              const colorPrioridad =
                inc.prioridad?.toLowerCase() === "critica"
                  ? "#ef4444"
                  : "#3b82f6";

              return (
                <TouchableOpacity
                  key={inc.id}
                  style={[styles.card, { borderLeftColor: config.borde }]}
                  onPress={() => router.push(`/tecnico/atencion/${inc.id}`)}
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
                    <View
                      style={[
                        styles.prioridadBadge,
                        { borderColor: colorPrioridad },
                      ]}
                    >
                      <Text
                        style={[
                          styles.prioridadTexto,
                          { color: colorPrioridad },
                        ]}
                      >
                        {inc.prioridad}
                      </Text>
                    </View>
                    <View
                      style={[styles.badge, { backgroundColor: config.bg }]}
                    >
                      <Text
                        style={[styles.badgeTexto, { color: config.color }]}
                      >
                        {config.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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

  scroll: { padding: 20, paddingBottom: 40 },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
    marginTop: 4,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabActivo: { backgroundColor: "#f9fafb" },
  tabTexto: { fontSize: 13, fontWeight: "600", color: "#9ca3af" },
  tabTextoActivo: { color: "#0891b2", fontWeight: "700" },
  tabIndicador: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "60%",
    backgroundColor: "#0891b2",
    borderRadius: 2,
  },

  listaCardsContainer: { gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
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
    marginBottom: 12,
    lineHeight: 18,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prioridadBadge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  prioridadTexto: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  badgeTexto: { fontSize: 12, fontWeight: "700" },

  vacio: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  vacioTexto: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 20,
  },
});

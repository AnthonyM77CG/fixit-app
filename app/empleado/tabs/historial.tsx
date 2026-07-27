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
import { useAuth } from "../../../src/context/AuthContext";
import { incidenciaService } from "../../../src/services/incidencia.service";
import { IncidenciaResponse } from "../../../src/models/incidencia.model";
import { crearWebSocket } from "../../../src/services/websocket.service";
import HeaderUsuario from "../../../src/components/headers/HeaderUsuario";
import { useNotificaciones } from "../../../src/context/NotificacionContext";

type Tab = "sinResolver" | "resueltos";

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
    label: "En proceso",
  },
  RESUELTO: {
    color: "#065f46",
    bg: "#d1fae5",
    borde: "#10b981",
    label: "Resuelto",
  },
};

export default function HistorialScreen() {
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const [tab, setTab] = useState<Tab>("sinResolver");
  const [incidencias, setIncidencias] = useState<IncidenciaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const { onDataUpdate } = useNotificaciones();

  const cargarIncidencias = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await incidenciaService.misIncidencias();
      setIncidencias(data);
    } catch (e: any) {
      console.log("Error status:", e.response?.status);
      console.log("Error data:", JSON.stringify(e.response?.data));
      console.log("Error message:", e.message);
      Alert.alert("Error", "No se pudieron cargar las incidencias");
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarIncidencias(true);

      onDataUpdate.current = () => cargarIncidencias(false);

      return () => {
        onDataUpdate.current = null;
      };
    }, []),
  );

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const sinResolver = incidencias.filter((i) => i.estado !== "RESUELTO");
  const resueltos = incidencias.filter((i) => i.estado === "RESUELTO");
  const lista = tab === "sinResolver" ? sinResolver : resueltos;

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <HeaderUsuario
        onNotifPress={() => router.push("/empleado/notificaciones")}
        onLogoutPress={handleCerrarSesion}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Título unificado idéntico a las otras pantallas */}
        <Text style={styles.titulo}>Historial Incidencias</Text>

        {/* Tabs - Ahora dentro del scroll para mejor flujo visual */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === "sinResolver" && styles.tabActivo]}
            onPress={() => setTab("sinResolver")}
          >
            <Text
              style={[
                styles.tabTexto,
                tab === "sinResolver" && styles.tabTextoActivo,
              ]}
            >
              Sin Resolver
            </Text>
            {tab === "sinResolver" && <View style={styles.tabIndicador} />}
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
              Resueltos
            </Text>
            {tab === "resueltos" && <View style={styles.tabIndicador} />}
          </TouchableOpacity>
        </View>

        {/* Contenido Dinámico Lista / Vacío / Cargando */}
        {cargando ? (
          <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
        ) : lista.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color="#d1d5db"
            />
            <Text style={styles.vacioTexto}>
              {tab === "sinResolver"
                ? "No tienes incidencias pendientes"
                : "No tienes incidencias resueltas"}
            </Text>
          </View>
        ) : (
          <View style={styles.listaCardsContainer}>
            {lista.map((inc) => {
              const config = estadoConfig[inc.estado] ?? estadoConfig.PENDIENTE;
              return (
                <TouchableOpacity
                  key={inc.id}
                  style={[styles.card, { borderLeftColor: config.borde }]}
                  onPress={() => router.push(`/empleado/seguimiento/${inc.id}`)}
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
  tabTexto: { fontSize: 15, fontWeight: "600", color: "#9ca3af" },
  tabTextoActivo: { color: "#16a34a", fontWeight: "700" },
  tabIndicador: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "60%",
    backgroundColor: "#16a34a",
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
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: { alignItems: "flex-end" },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  badgeTexto: { fontSize: 12, fontWeight: "700" },

  vacio: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  vacioTexto: {
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "500",
  },
});

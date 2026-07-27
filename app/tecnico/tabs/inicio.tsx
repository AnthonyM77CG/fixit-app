import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

const CYAN = "#0891b2";

export default function InicioTecnicoScreen() {
  const router = useRouter();
  const { usuario, cerrarSesion } = useAuth();
  const [incidencias, setIncidencias] = useState<IncidenciaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const { onDataUpdate } = useNotificaciones();

  const cargarTicketsAsignados = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await incidenciaService.misAsignaciones();
      setIncidencias(data);
    } catch (e) {
      Alert.alert(
        "Error",
        "No se pudieron sincronizar las órdenes de trabajo.",
      );
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarTicketsAsignados(true);

      onDataUpdate.current = () => cargarTicketsAsignados(false);
      return () => {
        onDataUpdate.current = null;
      };
    }, []),
  );

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const pendientes = incidencias.filter((i) => i.estado === "PENDIENTE").length;
  const enProceso = incidencias.filter((i) => i.estado === "EN_PROCESO").length;

  const ticketCritico = incidencias.find(
    (i) => i.prioridad?.toLowerCase() === "critica" && i.estado !== "RESUELTO",
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <HeaderUsuario
        onNotifPress={() => router.push("/tecnico/notificaciones")}
        onLogoutPress={handleCerrarSesion}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Bienvenida */}
        <View style={styles.bienvenidaContainer}>
          <Text style={styles.subtitulo}>
            Panel Técnico • {usuario?.area ?? "Soporte"}
          </Text>
          <Text style={styles.titulo}>
            Hola, {usuario?.nombre ?? "Técnico"}
          </Text>
        </View>

        {/* Alerta crítica */}
        {ticketCritico && (
          <TouchableOpacity
            style={styles.alertaCriticaCard}
            onPress={() => router.push(`/tecnico/atencion/${ticketCritico.id}`)}
          >
            <View style={styles.alertaCriticaIconContainer}>
              <Ionicons name="flash" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={styles.alertaCriticaTitulo}>
                ¡ATENCIÓN INMEDIATA!
              </Text>
              <Text style={styles.alertaCriticaMensaje} numberOfLines={1}>
                {ticketCritico.tipo}: {ticketCritico.detalle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fca5a5" />
          </TouchableOpacity>
        )}

        {/* Carga de trabajo */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Tu carga de trabajo:</Text>
          {cargando ? (
            <ActivityIndicator
              color={CYAN}
              size="large"
              style={{ marginVertical: 14 }}
            />
          ) : (
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: "#ecfeff" }]}>
                <Text style={[styles.statNumero, { color: CYAN }]}>
                  {pendientes}
                </Text>
                <Text style={styles.statLabel}>Por atender</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: "#dbeafe" }]}>
                <Text style={[styles.statNumero, { color: "#2563eb" }]}>
                  {enProceso}
                </Text>
                <Text style={styles.statLabel}>En diagnóstico</Text>
              </View>
            </View>
          )}
        </View>

        {/* Órdenes recientes */}
        <Text style={styles.seccionTitulo}>Órdenes de Trabajo Recientes</Text>

        {cargando ? (
          <ActivityIndicator
            color={CYAN}
            size="small"
            style={{ marginTop: 10 }}
          />
        ) : incidencias.length === 0 ? (
          <View style={styles.noTicketsBox}>
            <Ionicons name="build-outline" size={32} color="#9ca3af" />
            <Text style={styles.noTicketsTexto}>
              Al día. No tienes tareas pendientes.
            </Text>
          </View>
        ) : (
          <View style={styles.listaContainer}>
            {incidencias
              .filter((i) => i.estado !== "RESUELTO")
              .slice(0, 3)
              .map((ticket) => {
                const colorPrioridad =
                  ticket.prioridad?.toLowerCase() === "critica"
                    ? "#ef4444"
                    : CYAN;
                return (
                  <TouchableOpacity
                    key={ticket.id}
                    style={styles.ticketCard}
                    onPress={() =>
                      router.push(`/tecnico/atencion/${ticket.id}`)
                    }
                  >
                    <View
                      style={[styles.ticketBorde, { backgroundColor: CYAN }]}
                    />
                    <View style={{ flex: 1, gap: 4, paddingLeft: 12 }}>
                      <View style={styles.ticketHeaderRow}>
                        <Text style={styles.ticketTipo} numberOfLines={1}>
                          {ticket.tipo}
                        </Text>
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
                            {ticket.prioridad}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ticketDetalle} numberOfLines={1}>
                        {ticket.detalle}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#9ca3af"
                    />
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
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  bienvenidaContainer: { gap: 2, marginTop: 4 },
  subtitulo: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  alertaCriticaCard: {
    flexDirection: "row",
    backgroundColor: "#dc2626",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 12,
    elevation: 4,
  },
  alertaCriticaIconContainer: {
    backgroundColor: "#b91c1c",
    padding: 8,
    borderRadius: 10,
  },
  alertaCriticaTitulo: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  alertaCriticaMensaje: { color: "#fca5a5", fontSize: 12, fontWeight: "600" },
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
  cardTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  statsGrid: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumero: { fontSize: 26, fontWeight: "800" },
  statLabel: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "600",
    marginTop: 2,
  },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  listaContainer: { gap: 10 },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    paddingVertical: 14,
    paddingRight: 14,
  },
  ticketBorde: { width: 4, alignSelf: "stretch" },
  ticketHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketTipo: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  prioridadBadge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  prioridadTexto: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  ticketDetalle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  noTicketsBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    gap: 6,
  },
  noTicketsTexto: { color: "#9ca3af", fontSize: 14, fontWeight: "600" },
});

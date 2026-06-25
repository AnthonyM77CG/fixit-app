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
import { useAuth } from "../../src/context/AuthContext";
import { incidenciaService } from "../../src/services/incidencia.service";
import { IncidenciaResponse } from "../../src/models/incidencia.model";
import { crearWebSocket } from "../../src/services/websocket.service";

export default function InicioScreen() {
  const router = useRouter();
  const { usuario, cerrarSesion } = useAuth();
  const [incidencias, setIncidencias] = useState<IncidenciaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarAlerta, setMostrarAlerta] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarDatosDashboard(true);

      const ws = crearWebSocket(() => cargarDatosDashboard(false));

      return () => {
        if (ws) ws.close();
      };
    }, []),
  );

  const cargarDatosDashboard = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);

      const data = await incidenciaService.misIncidencias();
      setIncidencias(data);
    } catch (e) {
      console.error("Error al cargar datos del dashboard:", e);
      if (mostrarSpinner) {
        Alert.alert(
          "Error",
          "No se pudo sincronizar la información del servidor.",
        );
      }
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const pendientes = incidencias.filter((i) => i.estado === "PENDIENTE").length;
  const enProceso = incidencias.filter((i) => i.estado === "EN_PROCESO").length;
  const resueltas = incidencias.filter((i) => i.estado === "RESUELTO").length;

  const ultimaIncidencia = incidencias.length > 0 ? incidencias[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Idéntico al de Historial */}
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
        {/* Título de Bienvenida */}
        <View style={styles.bienvenidaContainer}>
          <Text style={styles.subtitulo}>Sistema de Incidencias</Text>
          <Text style={styles.titulo}>
            Hola, {usuario?.nombre || "Usuario"}
          </Text>
        </View>

        {/* Card de Resumen */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Resumen:</Text>

          {cargando ? (
            <ActivityIndicator
              color="#16a34a"
              size="large"
              style={{ marginVertical: 20 }}
            />
          ) : (
            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statFila,
                  styles.bordeAmarillo,
                  { backgroundColor: "#fef3c7" },
                ]}
              >
                <Text style={styles.statLabel}>Incidencias abiertas:</Text>
                <Text style={[styles.statNumero, { color: "#d97706" }]}>
                  {pendientes}
                </Text>
              </View>

              <View
                style={[
                  styles.statFila,
                  styles.bordeAzul,
                  { backgroundColor: "#dbeafe" },
                ]}
              >
                <Text style={styles.statLabel}>En proceso:</Text>
                <Text style={[styles.statNumero, { color: "#2563eb" }]}>
                  {enProceso}
                </Text>
              </View>

              <View
                style={[
                  styles.statFila,
                  styles.bordeVerde,
                  { backgroundColor: "#d1fae5" },
                ]}
              >
                <Text style={styles.statLabel}>Resueltas:</Text>
                <Text style={[styles.statNumero, { color: "#16a34a" }]}>
                  {resueltas}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Nueva Sección Potenciada: Última Incidencia Reportada */}
        <Text style={styles.seccionTitulo}>Último Reporte Activo</Text>

        {cargando ? (
          <ActivityIndicator
            color="#16a34a"
            size="small"
            style={{ marginTop: 10 }}
          />
        ) : !ultimaIncidencia ? (
          <View style={styles.noIncidenciaBox}>
            <Ionicons name="document-text-outline" size={32} color="#9ca3af" />
            <Text style={styles.noIncidenciaTexto}>
              No registras incidencias previas.
            </Text>
          </View>
        ) : (
          (() => {
            const esResuelto = ultimaIncidencia.estado === "RESUELTO";
            const esEnProceso = ultimaIncidencia.estado === "EN_PROCESO";

            const colorBorde = esResuelto
              ? "#10b981"
              : esEnProceso
                ? "#3b82f6"
                : "#f59e0b";
            const bgBadge = esResuelto
              ? "#d1fae5"
              : esEnProceso
                ? "#dbeafe"
                : "#fef3c7";
            const colorTextoBadge = esResuelto
              ? "#065f46"
              : esEnProceso
                ? "#1e40af"
                : "#92400e";
            const labelEstado = esResuelto
              ? "Resuelto"
              : esEnProceso
                ? "En proceso"
                : "Pendiente";

            return (
              <TouchableOpacity
                style={[
                  styles.ultimaIncidenciaCard,
                  { borderLeftColor: colorBorde },
                ]}
                onPress={() =>
                  router.push(`/empleado/seguimiento/${ultimaIncidencia.id}`)
                }
                activeOpacity={0.8}
              >
                <View style={styles.ultimaIncHeader}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.ultimaIncTipo} numberOfLines={1}>
                      {ultimaIncidencia.tipo}
                    </Text>
                    <Text style={styles.ultimaIncDetalle} numberOfLines={1}>
                      {ultimaIncidencia.detalle}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.ultimaIncBadge,
                      { backgroundColor: bgBadge },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ultimaIncBadgeTexto,
                        { color: colorTextoBadge },
                      ]}
                    >
                      {labelEstado}
                    </Text>
                  </View>
                </View>

                <View style={styles.ultimaIncFooter}>
                  <Text style={styles.ultimaIncLink}>
                    Ver detalles de la atención
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#16a34a" />
                </View>
              </TouchableOpacity>
            );
          })()
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

  scroll: { padding: 16, gap: 16, paddingBottom: 30 },
  bienvenidaContainer: { gap: 2, marginTop: 4 },
  subtitulo: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  titulo: { fontSize: 28, fontWeight: "800", color: "#111827" },

  toastCard: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 12,
  },
  toastIconContainer: {
    backgroundColor: "#16a34a",
    padding: 6,
    borderRadius: 10,
  },
  toastTextos: { flex: 1, gap: 1 },
  toastTitulo: { color: "#fff", fontSize: 13, fontWeight: "700" },
  toastMensaje: { color: "#94a3b8", fontSize: 12, fontWeight: "500" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 14,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
  },
  statsContainer: { gap: 10 },
  statFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  bordeAmarillo: { borderLeftColor: "#f59e0b" },
  bordeAzul: { borderLeftColor: "#3b82f6" },
  bordeVerde: { borderLeftColor: "#10b981" },
  statLabel: { fontSize: 14, color: "#374151", fontWeight: "600" },
  statNumero: { fontSize: 20, fontWeight: "800" },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },

  ultimaIncidenciaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    gap: 12,
  },
  ultimaIncHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  ultimaIncTipo: { fontSize: 15, fontWeight: "700", color: "#111827" },
  ultimaIncDetalle: { fontSize: 13, color: "#6b7280" },
  ultimaIncBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  ultimaIncBadgeTexto: { fontSize: 11, fontWeight: "700" },
  ultimaIncFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  ultimaIncLink: { fontSize: 12, fontWeight: "700", color: "#16a34a" },

  noIncidenciaBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    gap: 8,
  },
  noIncidenciaTexto: { color: "#9ca3af", fontSize: 14, fontWeight: "600" },
});

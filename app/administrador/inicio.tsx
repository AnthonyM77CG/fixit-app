import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import { useAuth } from "../../src/context/AuthContext";
import { incidenciaService } from "../../src/services/incidencia.service";

const { width } = Dimensions.get("window");

const estadoConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  PENDIENTE: { color: "#92400e", bg: "#fef3c7", label: "Pendiente" },
  EN_PROCESO: { color: "#1e40af", bg: "#dbeafe", label: "En Proceso" },
  RESUELTO: { color: "#065f46", bg: "#d1fae5", label: "Resuelto" },
};

export default function AdminInicioScreen() {
  const router = useRouter();
  const { cerrarSesion, usuario } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarDashboard();
    }, []),
  );

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const data = await incidenciaService.getDashboard();
      setDashboard(data);
    } catch (e: any) {
      Alert.alert("Error", "No se pudo cargar el dashboard");
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  // Preparar datos para la gráfica
  const chartData = dashboard?.porArea
    ? {
        labels: Object.keys(dashboard.porArea).map((k) =>
          k.length > 8 ? k.substring(0, 8) + "." : k,
        ),
        datasets: [{ data: Object.values(dashboard.porArea) as number[] }],
      }
    : null;

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

      {cargando ? (
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.titulo}>Dashboard</Text>
          <Text style={styles.subtitulo}>Hola, {usuario?.nombre}</Text>

          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { borderLeftColor: "#3b82f6" }]}>
              <View style={[styles.kpiIcono, { backgroundColor: "#eff6ff" }]}>
                <Ionicons name="ticket-outline" size={22} color="#3b82f6" />
              </View>
              <Text style={styles.kpiNumero}>{dashboard?.total ?? 0}</Text>
              <Text style={styles.kpiLabel}>Total</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: "#f59e0b" }]}>
              <View style={[styles.kpiIcono, { backgroundColor: "#fffbeb" }]}>
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#f59e0b"
                />
              </View>
              <Text style={styles.kpiNumero}>{dashboard?.pendientes ?? 0}</Text>
              <Text style={styles.kpiLabel}>Pendientes</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: "#3b82f6" }]}>
              <View style={[styles.kpiIcono, { backgroundColor: "#eff6ff" }]}>
                <Ionicons name="time-outline" size={22} color="#3b82f6" />
              </View>
              <Text style={styles.kpiNumero}>{dashboard?.enProceso ?? 0}</Text>
              <Text style={styles.kpiLabel}>En Proceso</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: "#16a34a" }]}>
              <View style={[styles.kpiIcono, { backgroundColor: "#f0fdf4" }]}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#16a34a"
                />
              </View>
              <Text style={styles.kpiNumero}>{dashboard?.resueltas ?? 0}</Text>
              <Text style={styles.kpiLabel}>Resueltas</Text>
            </View>
          </View>

          {/* Gráfica por área */}
          {chartData && chartData.datasets[0].data.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Incidencias por Área</Text>
              <BarChart
                data={chartData}
                width={width - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                  labelColor: () => "#6b7280",
                  style: { borderRadius: 12 },
                  barPercentage: 0.6,
                }}
                style={{ borderRadius: 12, marginTop: 8 }}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          )}

          {/* Tickets recientes */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Tickets Recientes</Text>
            {dashboard?.recientes?.length === 0 ? (
              <Text style={styles.vacioTexto}>No hay incidencias aún</Text>
            ) : (
              <>
                {/* Cabecera tabla */}
                <View style={styles.tablaHeader}>
                  <Text style={[styles.tablaTh, { flex: 1.5 }]}>EMPLEADO</Text>
                  <Text style={[styles.tablaTh, { flex: 1.5 }]}>TIPO</Text>
                  <Text style={[styles.tablaTh, { flex: 1 }]}>ESTADO</Text>
                </View>

                {dashboard?.recientes?.map((inc: any, index: number) => {
                  const config =
                    estadoConfig[inc.estado] ?? estadoConfig.PENDIENTE;
                  return (
                    <TouchableOpacity
                      key={inc.id}
                      style={[
                        styles.tablaFila,
                        index % 2 === 0 && styles.tablaFilaPar,
                      ]}
                      onPress={() =>
                        router.push(`/administrador/atencion/${inc.id}`)
                      }
                    >
                      <Text
                        style={[styles.tablaTd, { flex: 1.5 }]}
                        numberOfLines={1}
                      >
                        {inc.empleado}
                      </Text>
                      <Text
                        style={[styles.tablaTd, { flex: 1.5 }]}
                        numberOfLines={1}
                      >
                        {inc.tipo}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <View
                          style={[styles.badge, { backgroundColor: config.bg }]}
                        >
                          <Text
                            style={[styles.badgeTexto, { color: config.color }]}
                            numberOfLines={1}
                          >
                            {config.label}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
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
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  titulo: { fontSize: 28, fontWeight: "800", color: "#111827" },
  subtitulo: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    width: (width - 52) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  kpiIcono: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  kpiNumero: { fontSize: 28, fontWeight: "800", color: "#111827" },
  kpiLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600", marginTop: 2 },
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
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  tablaHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 4,
  },
  tablaTh: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
  tablaFila: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tablaFilaPar: { backgroundColor: "#f9fafb" },
  tablaTd: { fontSize: 13, color: "#374151" },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeTexto: { fontSize: 10, fontWeight: "700" },
  vacioTexto: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
  },
});

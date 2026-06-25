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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAuth } from "../../src/context/AuthContext";
import { incidenciaService } from "../../src/services/incidencia.service";
import { crearWebSocket } from "../../src/services/websocket.service";

const { width } = Dimensions.get("window");

const estadoConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  PENDIENTE: { color: "#92400e", bg: "#fef3c7", label: "Pendiente" },
  EN_PROCESO: { color: "#1e40af", bg: "#dbeafe", label: "En Proceso" },
  RESUELTO: { color: "#065f46", bg: "#d1fae5", label: "Resuelto" },
};

const estadoColores: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  EN_PROCESO: "#3b82f6",
  RESUELTO: "#16a34a",
};

const escaparHTML = (texto: any) =>
  texto?.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? "—";

export default function AdminInicioScreen() {
  const router = useRouter();
  const { cerrarSesion, usuario } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const cargarDashboard = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await incidenciaService.getDashboard();
      setDashboard(data);
    } catch (e: any) {
      Alert.alert("Error", "No se pudo cargar el dashboard");
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDashboard(true);

      const ws = crearWebSocket(() => cargarDashboard(false));
      return () => ws.close();
    }, []),
  );

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const generarPDF = async () => {
    if (!dashboard) return;
    setGenerandoPDF(true);
    try {
      // Cargar todas las incidencias con detalle
      const todasLasIncidencias = await incidenciaService.todasLasIncidencias();

      const fechaReporte = new Date().toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // Grafica de barras
      const valoresArea = Object.values(dashboard.porArea) as number[];
      const maxValor = Math.max(...valoresArea, 1); // Evita división por cero

      const barrasGraficoHTML = Object.entries(dashboard.porArea)
        .map(([area, cantidad]: [string, any]) => {
          const porcentaje = (cantidad / maxValor) * 100;
          return `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 140px; font-size: 11px; font-weight: 600; color: #4b5563; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${area}</div>
              <div style="flex: 1; background-color: #f3f4f6; border-radius: 6px; height: 16px; margin: 0 12px;">
                <div style="background-color: #7c3aed; width: ${porcentaje}%; height: 100%; border-radius: 6px; transition: width 0.5s ease-in-out;"></div>
              </div>
              <div style="width: 30px; font-size: 12px; font-weight: 700; color: #111827; text-align: right;">${cantidad}</div>
            </div>
          `;
        })
        .join("");

      // Generar filas de la tabla
      const filasIncidencias = todasLasIncidencias
        .map((inc: any, index: number) => {
          const colorEstado = estadoColores[inc.estado] ?? "#6b7280";
          const fechaApertura = new Date(inc.fechaApertura).toLocaleDateString(
            "es-PE",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            },
          );
          const fechaCierre = inc.fechaCierre
            ? new Date(inc.fechaCierre).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "—";

          return `
          <tr style="background-color: ${index % 2 === 0 ? "#f9fafb" : "#fff"}">
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">#${inc.id}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${inc.empleado}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${inc.area}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${inc.tipo}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${inc.prioridad}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
              <span style="background-color: ${colorEstado}20; color: ${colorEstado}; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 11px; white-space: nowrap;">
                ${estadoConfig[inc.estado]?.label ?? inc.estado}
              </span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${inc.tecnico ?? "Sin asignar"}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${fechaApertura}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${fechaCierre}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; max-width: 200px;">${escaparHTML(inc.detalle)}</td>
          </tr>
        `;
        })
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            /* 1. Forzar horizontal y márgenes para impresión */
  @page { 
    size: A4 landscape; 
    margin: 15mm; 
  }
  
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
    margin: 0; 
    color: #111827; 
  }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 3px solid #7c3aed; padding-bottom: 16px; }
  .logo-titulo { font-size: 28px; font-weight: 800; color: #7c3aed; }
  .logo-subtitulo { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .fecha { font-size: 12px; color: #6b7280; text-align: right; }
  
  .kpis { display: flex; gap: 16px; margin-bottom: 32px; }
  .kpi { flex: 1; background: #f9fafb; border-radius: 12px; padding: 16px; border-left: 4px solid; text-align: center; }
  .kpi-numero { font-size: 32px; font-weight: 800; }
  .kpi-label { font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600; }
  
  .seccion-titulo { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 12px; margin-top: 24px; }
  
  table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
  
  /* 2. Repetir encabezado en cada página nueva */
  thead { display: table-header-group; }
  
  /* Asignar anchos proporcionales a las columnas críticas */
  th:nth-child(1) { width: 5%; }   /* ID */
  th:nth-child(2) { width: 14%; }  /* Empleado */
  th:nth-child(6) { width: 7%; }  /* Estado*/
  th:nth-child(10) { width: 22%; }
  
  th { background-color: #7c3aed; color: white; padding: 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  
  /* 3. Evitar que las filas se corten por la mitad en el salto de página */
  tr { page-break-inside: avoid; }
  
  td { 
    padding: 10px; 
    border-bottom: 1px solid #e5e7eb; 
    word-wrap: break-word; /* Evita que textos largos rompan la tabla */
  }
  
  .footer { 
    margin-top: 32px; 
    text-align: center; 
    font-size: 11px; 
    color: #9ca3af; 
    border-top: 1px solid #e5e7eb; 
    padding-top: 16px; 
  }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div>
              <div class="logo-titulo">FixIt</div>
              <div class="logo-subtitulo">Sistema de Gestión de Incidencias</div>
            </div>
            <div class="fecha">
              <div style="font-weight: 700; font-size: 14px;">Reporte de Incidencias</div>
              <div>Generado el ${fechaReporte}</div>
              <div>Por: ${usuario?.nombre} ${usuario?.apellido}</div>
            </div>
          </div>

          <!-- KPIs -->
          <div class="kpis">
            <div class="kpi" style="border-left-color: #3b82f6;">
              <div class="kpi-numero" style="color: #3b82f6;">${dashboard.total}</div>
              <div class="kpi-label">Total</div>
            </div>
            <div class="kpi" style="border-left-color: #f59e0b;">
              <div class="kpi-numero" style="color: #f59e0b;">${dashboard.pendientes}</div>
              <div class="kpi-label">Pendientes</div>
            </div>
            <div class="kpi" style="border-left-color: #3b82f6;">
              <div class="kpi-numero" style="color: #3b82f6;">${dashboard.enProceso}</div>
              <div class="kpi-label">En Proceso</div>
            </div>
            <div class="kpi" style="border-left-color: #16a34a;">
              <div class="kpi-numero" style="color: #16a34a;">${dashboard.resueltas}</div>
              <div class="kpi-label">Resueltas</div>
            </div>
          </div>

          ${
            valoresArea.length > 0
              ? `
            <div class="seccion-titulo">Distribución por Área</div>
            <div class="grafico-box">
              ${barrasGraficoHTML}
            </div>
          `
              : ""
          }

          <!-- Tabla de incidencias -->
          <div class="seccion-titulo">Detalle de Todas las Incidencias</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Empleado</th>
                <th>Área</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Técnico</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              ${filasIncidencias}
            </tbody>
          </table>

          <!-- Footer -->
          <div class="footer">
            FixIt — Sistema de Gestión de Incidencias • Reporte generado automáticamente
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Reporte de Incidencias",
        UTI: "com.adobe.pdf",
      });
    } catch (e: any) {
      Alert.alert("Error", "No se pudo generar el reporte PDF");
    } finally {
      setGenerandoPDF(false);
    }
  };

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

        <View style={styles.headerBotones}>
          {/* Botón PDF */}
          <TouchableOpacity
            style={[styles.botonPDF, generandoPDF && styles.botonDesactivado]}
            onPress={generarPDF}
            disabled={generandoPDF || cargando}
          >
            {generandoPDF ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.botonPDFTexto}>PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Botón cerrar sesión */}
          <TouchableOpacity
            style={styles.botonCerrar}
            onPress={handleCerrarSesion}
          >
            <Ionicons name="log-out-outline" size={16} color="#fff" />
            <Text style={styles.botonCerrarTexto}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
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
  headerBotones: { flexDirection: "row", gap: 8, alignItems: "center" },
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
  botonPDF: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7c3aed",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  botonPDFTexto: { color: "#fff", fontSize: 12, fontWeight: "700" },
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
  botonDesactivado: { backgroundColor: "#9ca3af" },
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

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput, // <-- Añadido
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import HeaderAdmin from "../../../src/components/headers/HeaderAdmin";
import { usuarioService } from "../../../src/services/usuario.service";
import { useNotificaciones } from "../../../src/context/NotificacionContext";

export default function AdminUsuariosScreen() {
  const router = useRouter();
  const { cerrarSesion, usuario } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState<string>(""); // <-- Estado para el nombre
  const [filtroRol, setFiltroRol] = useState<string>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const roles = ["Todos", "Administrador", "Tecnico", "Empleado"];
  const estados = ["Todos", "Activos", "Inactivos"];
  const { onDataUpdate } = useNotificaciones();

  const cargarUsuarios = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const params: any = {};
      if (filtroRol !== "Todos") params.rol = filtroRol;
      if (filtroEstado !== "Todos") params.activo = filtroEstado === "Activos";
      const data = await usuarioService.obtenerTodos(params);
      setUsuarios(data);
    } catch (e: any) {
      Alert.alert("Error", "No se pudieron cargar los usuarios");
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  // NUEVO: Filtrar en tiempo real por Nombre, Apellido o Correo electrónico
  const usuariosFiltrados = usuarios.filter((user) => {
    const nombreCompleto = `${user.nombre} ${user.apellido}`.toLowerCase();
    const correo = user.correo ? user.correo.toLowerCase() : "";
    const query = busqueda.toLowerCase();
    return nombreCompleto.includes(query) || correo.includes(query);
  });

  const generarPDFUsuarios = async () => {
    // Usamos los usuarios filtrados para que el PDF refleje exactamente lo que se ve en pantalla
    if (!usuariosFiltrados || usuariosFiltrados.length === 0) {
      Alert.alert(
        "Sin datos",
        "No hay usuarios para exportar con los filtros actuales",
      );
      return;
    }

    setGenerandoPDF(true);
    try {
      const fechaReporte = new Date().toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const totalUsuarios = usuariosFiltrados.length;
      const activos = usuariosFiltrados.filter(
        (u: any) => u.activo === true,
      ).length;
      const inactivos = totalUsuarios - activos;

      const filasUsuarios = usuariosFiltrados
        .map((user: any, index: number) => {
          return `
        <tr style="background-color: ${index % 2 === 0 ? "#f9fafb" : "#fff"}">
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">#${user.id}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600;">${user.nombre} ${user.apellido}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${user.correo}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${user.celular || "—"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
            <span style="background-color: #f3e8ff; color: #6b21a8; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 11px;">
              ${user.rol || "Sin Rol"}
            </span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${user.area || "Sin Área"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
            <span style="background-color: ${user.activo ? "#d1fae5" : "#fee2e2"}; color: ${user.activo ? "#065f46" : "#991b1b"}; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 11px;">
              ${user.activo ? "Activo" : "Inactivo"}
            </span>
          </td>
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
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: -apple-system, sans-serif; margin: 0; color: #111827; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 3px solid #7c3aed; padding-bottom: 16px; }
          .logo-titulo { font-size: 28px; font-weight: 800; color: #7c3aed; }
          .logo-subtitulo { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .fecha { font-size: 12px; color: #6b7280; text-align: right; }
          
          .kpis { display: flex; gap: 16px; margin-bottom: 32px; }
          .kpi { flex: 1; background: #f9fafb; border-radius: 12px; padding: 16px; border-left: 4px solid; text-align: center; }
          .kpi-numero { font-size: 32px; font-weight: 800; }
          .kpi-label { font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600; }
          
          .seccion-titulo { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
          thead { display: table-header-group; }
          
          th { background-color: #7c3aed; color: white; padding: 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          th:nth-child(1) { width: 6%; }
          th:nth-child(2) { width: 22%; }
          th:nth-child(3) { width: 24%; }
          th:nth-child(4) { width: 12%; }
          th:nth-child(7) { width: 10%; }
          
          tr { page-break-inside: avoid; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-titulo">FixIt</div>
            <div class="logo-subtitulo">Padrón y Control de Usuarios del Sistema</div>
          </div>
          <div class="fecha">
            <div style="font-weight: 700; font-size: 14px;">Reporte de Personal</div>
            <div>Generado el ${fechaReporte}</div>
            <div>Por: ${usuario?.nombre} ${usuario?.apellido}</div>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi" style="border-left-color: #3b82f6;">
            <div class="kpi-numero" style="color: #3b82f6;">${totalUsuarios}</div>
            <div class="kpi-label">Total Usuarios</div>
          </div>
          <div class="kpi" style="border-left-color: #16a34a;">
            <div class="kpi-numero" style="color: #16a34a;">${activos}</div>
            <div class="kpi-label">Colaboradores Activos</div>
          </div>
          <div class="kpi" style="border-left-color: #dc2626;">
            <div class="kpi-numero" style="color: #dc2626;">${inactivos}</div>
            <div class="kpi-label">Cuentas Desactivadas</div>
          </div>
        </div>

        <div class="seccion-titulo">Listado Detallado de Usuarios</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Celular</th>
              <th>Rol</th>
              <th>Área Asignada</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${filasUsuarios}
          </tbody>
        </table>

        <div class="footer">
          FixIt — Reporte de Personal Comercial e Infraestructura • Confidencial
        </div>
      </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Padrón de Usuarios FixIt",
        UTI: "com.adobe.pdf",
      });
    } catch (e: any) {
      Alert.alert("Error", "No se pudo exportar el listado de usuarios");
    } finally {
      setGenerandoPDF(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarUsuarios(true);

      onDataUpdate.current = () => cargarUsuarios(false);

      return () => {
        onDataUpdate.current = null;
      };
    }, [filtroRol, filtroEstado]),
  );

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "Administrador":
        return { bg: "#f3e8ff", text: "#7c3aed" };
      case "Tecnico":
        return { bg: "#dbeafe", text: "#1e40af" };
      default:
        return { bg: "#f3f4f6", text: "#4b5563" };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderAdmin
        hasNotifications={true}
        onNotifPress={() => router.push("/administrador/notificaciones")}
        onPdfPress={generarPDFUsuarios}
        isPdfLoading={generandoPDF}
        onLogoutPress={handleCerrarSesion}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerTitle}>
          <Text style={styles.titulo}>Usuarios</Text>
        </View>
        <Text style={styles.subtitulo}>
          Gestiona los accesos y roles del sistema
        </Text>

        {/* NUEVO: Input de Barra de Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor="#9ca3af"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros */}
        <View style={styles.card}>
          <Text style={styles.filtroLabel}>Filtrar por Rol:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtrosContainer}
          >
            {roles.map((rol) => (
              <TouchableOpacity
                key={rol}
                style={[styles.chip, filtroRol === rol && styles.chipActivo]}
                onPress={() => setFiltroRol(rol)}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    filtroRol === rol && styles.chipTextoActivo,
                  ]}
                >
                  {rol}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filtroLabel, { marginTop: 16 }]}>
            Filtrar por Estado:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtrosContainer}
          >
            {estados.map((est) => (
              <TouchableOpacity
                key={est}
                style={[styles.chip, filtroEstado === est && styles.chipActivo]}
                onPress={() => setFiltroEstado(est)}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    filtroEstado === est && styles.chipTextoActivo,
                  ]}
                >
                  {est}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Usuarios */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Directorio de Usuarios ({usuariosFiltrados.length})
          </Text>

          {cargando ? (
            <ActivityIndicator color="#7c3aed" style={{ marginVertical: 20 }} />
          ) : usuariosFiltrados.length === 0 ? (
            <Text style={styles.vacioTexto}>No se encontraron usuarios.</Text>
          ) : (
            <>
              <View style={styles.tablaHeader}>
                <Text style={[styles.tablaTh, { flex: 2 }]}>USUARIO</Text>
                <Text style={[styles.tablaTh, { flex: 1.5 }]}>ROL</Text>
                <Text
                  style={[styles.tablaTh, { flex: 1, textAlign: "center" }]}
                >
                  ESTADO
                </Text>
              </View>

              {usuariosFiltrados.map((user, index) => {
                const rolConfig = getRolColor(user.rol);
                return (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.tablaFila,
                      index % 2 === 0 && styles.tablaFilaPar,
                    ]}
                    onPress={() =>
                      router.push(`/administrador/usuarios/${user.id}`)
                    }
                  >
                    <View style={{ flex: 2, paddingRight: 8 }}>
                      <Text style={styles.tdNombre} numberOfLines={1}>
                        {user.nombre} {user.apellido}
                      </Text>
                      <Text style={styles.tdCorreo} numberOfLines={1}>
                        {user.correo}
                      </Text>
                    </View>

                    <View style={{ flex: 1.5, justifyContent: "center" }}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: rolConfig.bg },
                        ]}
                      >
                        <Text
                          style={[styles.badgeTexto, { color: rolConfig.text }]}
                          numberOfLines={1}
                        >
                          {user.rol}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={[
                          styles.dotEstado,
                          {
                            backgroundColor: user.activo
                              ? "#16a34a"
                              : "#ef4444",
                          },
                        ]}
                      />
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  headerTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: { fontSize: 28, fontWeight: "800", color: "#111827" },
  subtitulo: { fontSize: 14, color: "#6b7280", marginTop: 2, marginBottom: 8 },

  /* ESTILOS NUEVOS PARA LA BARRA DE BÚSQUEDA */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
  },

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
  filtroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  filtrosContainer: { flexDirection: "row" },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActivo: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  chipTexto: { fontSize: 13, color: "#4b5563", fontWeight: "600" },
  chipTextoActivo: { color: "#fff" },
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tablaFilaPar: { backgroundColor: "#f9fafb" },
  tdNombre: { fontSize: 13, fontWeight: "600", color: "#111827" },
  tdCorreo: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeTexto: { fontSize: 10, fontWeight: "700" },
  dotEstado: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  vacioTexto: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
  },
});

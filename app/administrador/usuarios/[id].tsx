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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useNotificaciones } from "../../../src/context/NotificacionContext";
import { usuarioService } from "../../../src/services/usuario.service";

export default function AdminUsuarioDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { onDataUpdate } = useNotificaciones();

  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const cargarDatos = async (mostrarSpinner = true) => {
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await usuarioService.obtenerPorId(Number(id));
      setUsuario(data);
    } catch (e: any) {
      Alert.alert("Error", "No se pudo cargar la información del usuario");
      router.back();
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos(true);

      // Sincronización en tiempo real vía WebSocket
      onDataUpdate.current = () => cargarDatos(false);

      return () => {
        onDataUpdate.current = null;
      };
    }, [id]),
  );

  const handleToggleEstado = () => {
    const accion = usuario?.activo ? "Desactivar" : "Activar";
    Alert.alert(
      `${accion} Usuario`,
      `¿Estás seguro de que deseas ${accion.toLowerCase()} a este usuario?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, continuar",
          style: usuario?.activo ? "destructive" : "default",
          onPress: async () => {
            setProcesando(true);
            try {
              await usuarioService.cambiarEstado(Number(id), !usuario.activo);
              Alert.alert(
                "Éxito",
                `Usuario ${accion.toLowerCase()}do correctamente`,
              );
              cargarDatos(false);
            } catch (e: any) {
              Alert.alert("Error", "No se pudo cambiar el estado del usuario");
            } finally {
              setProcesando(false);
            }
          },
        },
      ],
    );
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "Administrador":
        return { bg: "#f3e8ff", color: "#7c3aed" };
      case "Tecnico":
      case "Técnico":
        return { bg: "#dbeafe", color: "#1e40af" };
      default:
        return { bg: "#f3f4f6", color: "#4b5563" };
    }
  };

  if (cargando && !usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!usuario) return null;

  const rolConfig = getRolColor(usuario.rol || usuario.role?.nombre);
  const estadoConfig = usuario.activo
    ? { bg: "#d1fae5", color: "#065f46", label: "Activo" }
    : { bg: "#fee2e2", color: "#991b1b", label: "Inactivo" };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Perfil de Usuario</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Tarjeta de Perfil Principal */}
        <View style={styles.card}>
          <View style={styles.perfilHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>
                {usuario.nombre?.charAt(0)}
                {usuario.apellido?.charAt(0)}
              </Text>
            </View>
            <View style={styles.perfilInfo}>
              <Text style={styles.nombre}>
                {usuario.nombre} {usuario.apellido}
              </Text>
              <Text style={styles.correo}>{usuario.correo}</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de Detalles del Sistema */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Información de Acceso</Text>

          <View style={styles.fila}>
            <View style={styles.filaItem}>
              <Text style={styles.label}>Rol en el sistema</Text>
              <View style={[styles.badge, { backgroundColor: rolConfig.bg }]}>
                <Text style={[styles.badgeTexto, { color: rolConfig.color }]}>
                  {usuario.rol || usuario.role?.nombre}
                </Text>
              </View>
            </View>

            <View style={styles.filaItem}>
              <Text style={styles.label}>Estado Actual</Text>
              <View
                style={[styles.badge, { backgroundColor: estadoConfig.bg }]}
              >
                <Text
                  style={[styles.badgeTexto, { color: estadoConfig.color }]}
                >
                  {estadoConfig.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Celular (Reemplazando DNI) */}
          <Text style={styles.label}>Número de Celular</Text>
          <View style={styles.infoContactoFila}>
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text style={styles.valor}>
              {usuario.celular || "No registrado"}
            </Text>
          </View>

          {/* Área Asignada */}
          <Text style={styles.label}>Área Asignada</Text>
          <View style={styles.infoContactoFila}>
            <Ionicons name="business-outline" size={16} color="#6b7280" />
            <Text style={styles.valor}>
              {usuario.area?.nombre || usuario.area || "Sin área asignada"}
            </Text>
          </View>
        </View>

        {/* Tarjeta de Acciones */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Gestión de Cuenta</Text>

          <TouchableOpacity
            style={styles.botonEditar}
            onPress={() => router.push(`/administrador/editar/${usuario.id}`)}
            disabled={procesando}
          >
            <Ionicons name="pencil" size={18} color="#fff" />
            <Text style={styles.botonEditarTexto}>Editar Usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botonToggleEstado,
              usuario.activo ? styles.botonDesactivar : styles.botonActivar,
              procesando && styles.botonDesactivado,
            ]}
            onPress={handleToggleEstado}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={
                    usuario.activo ? "ban-outline" : "checkmark-circle-outline"
                  }
                  size={18}
                  color="#fff"
                />
                <Text style={styles.botonToggleTexto}>
                  {usuario.activo ? "Desactivar Usuario" : "Activar Usuario"}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
  perfilHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTexto: {
    fontSize: 24,
    fontWeight: "800",
    color: "#7c3aed",
    textTransform: "uppercase",
  },
  perfilInfo: { flex: 1 },
  nombre: { fontSize: 20, fontWeight: "700", color: "#111827" },
  correo: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  label: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 14,
  },
  valor: { fontSize: 15, color: "#374151", fontWeight: "500" },
  infoContactoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  fila: { flexDirection: "row", gap: 16 },
  filaItem: { flex: 1 },
  badge: {
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeTexto: { fontSize: 12, fontWeight: "700" },
  botonEditar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    height: 48,
    gap: 8,
    marginBottom: 12,
  },
  botonEditarTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
  botonToggleEstado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  botonDesactivar: { backgroundColor: "#ef4444" },
  botonActivar: { backgroundColor: "#10b981" },
  botonToggleTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
  botonDesactivado: { opacity: 0.6 },
});

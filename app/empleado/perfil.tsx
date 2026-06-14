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

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, cerrarSesion } = useAuth();
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
      const data = await incidenciaService.misIncidencias();
      setIncidencias(data);
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar las estadísticas");
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/auth/metodo-login");
  };

  const abiertas = incidencias.filter((i) => i.estado === "PENDIENTE").length;
  const enProceso = incidencias.filter((i) => i.estado === "EN_PROCESO").length;
  const resueltas = incidencias.filter((i) => i.estado === "RESUELTO").length;

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

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Mi Perfil</Text>

        {/* Card de perfil */}
        <View style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
            <Text style={styles.nombre}>
              {usuario?.nombre} {usuario?.apellido}
            </Text>
            <Text style={styles.correoAvatar}>{usuario?.correo}</Text>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoFila}>
              <Ionicons name="mail-outline" size={20} color="#16a34a" />
              <View style={styles.infoTexto}>
                <Text style={styles.infoLabel}>Correo electrónico</Text>
                <Text style={styles.infoValor}>{usuario?.correo}</Text>
              </View>
            </View>

            <View style={styles.infoFila}>
              <Ionicons name="call-outline" size={20} color="#16a34a" />
              <View style={styles.infoTexto}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValor}>
                  {usuario?.celular ?? "No registrado"}
                </Text>
              </View>
            </View>

            <View style={styles.infoFila}>
              <Ionicons name="location-outline" size={20} color="#16a34a" />
              <View style={styles.infoTexto}>
                <Text style={styles.infoLabel}>Área</Text>
                <Text style={styles.infoValor}>{usuario?.area}</Text>
              </View>
            </View>

            <View style={styles.infoFila}>
              <Ionicons name="shield-outline" size={20} color="#16a34a" />
              <View style={styles.infoTexto}>
                <Text style={styles.infoLabel}>Rol</Text>
                <Text style={styles.infoValor}>{usuario?.rol}</Text>
              </View>
            </View>
          </View>

          {/* Botón editar */}
          <TouchableOpacity style={styles.botonEditar}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.botonEditarTexto}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Estadísticas</Text>
          {cargando ? (
            <ActivityIndicator color="#16a34a" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.statsContainer}>
              <View style={[styles.statItem, { backgroundColor: "#fef3c7" }]}>
                <Text style={[styles.statNumero, { color: "#f59e0b" }]}>
                  {abiertas}
                </Text>
                <Text style={styles.statLabel}>Abiertas</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: "#dbeafe" }]}>
                <Text style={[styles.statNumero, { color: "#3b82f6" }]}>
                  {enProceso}
                </Text>
                <Text style={styles.statLabel}>En Proceso</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: "#d1fae5" }]}>
                <Text style={[styles.statNumero, { color: "#16a34a" }]}>
                  {resueltas}
                </Text>
                <Text style={styles.statLabel}>Resueltas</Text>
              </View>
            </View>
          )}
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
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nombre: { fontSize: 22, fontWeight: "800", color: "#111827", marginTop: 12 },
  correoAvatar: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  infoContainer: { gap: 12, marginBottom: 20 },
  infoFila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  infoTexto: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  infoValor: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    marginTop: 2,
  },
  botonEditar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonEditarTexto: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statsContainer: { flexDirection: "row", gap: 12 },
  statItem: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statNumero: { fontSize: 28, fontWeight: "800" },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    marginTop: 4,
  },
});

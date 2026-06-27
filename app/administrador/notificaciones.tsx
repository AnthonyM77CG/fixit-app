import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { notificationService } from "../../src/services/notification.service";
import { useAuth } from "../../src/context/AuthContext";
interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leido: boolean;
  fechaCreacion: string;
  incidenciaId: number | null;
}

export default function AdminNotificacionesScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarNotificaciones = async (mostrarSpinner = true) => {
    if (!usuario) return;
    try {
      if (mostrarSpinner) setCargando(true);
      const data = await notificationService.obtenerPorUsuario(usuario.id);
      setNotificaciones(data);
    } catch (error) {
      console.log("Error al cargar notificaciones:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  // useFocusEffect recarga la lista cada vez que se entra a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones(true);
    }, [usuario]),
  );

  const onRefresh = () => {
    setRefrescando(true);
    cargarNotificaciones(false);
  };

  const handlePresionarNotificacion = async (item: Notificacion) => {
    try {
      // 1. Marcar como leída si no lo está
      if (!item.leido) {
        await notificationService.marcarComoLeida(item.id);
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, leido: true } : n)),
        );
      }

      // 2. Navegar al detalle de la incidencia
      if (item.incidenciaId) {
        // Ajusta esta ruta a donde tengas el detalle para el administrador
        router.push(`/administrador/atencion/${item.incidenciaId}`);
      }
    } catch (error) {
      console.log("Error al abrir la notificación:", error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    if (!usuario) return;
    try {
      await notificationService.marcarTodasComoLeidas(usuario.id);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
    } catch (error) {
      console.log("Error al marcar todas como leídas:", error);
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return `${date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    })} ${date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          color="#7c3aed"
          style={{ marginTop: 40 }}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header*/}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Notificaciones</Text>

        {/* Botón para marcar todas como leídas*/}
        <TouchableOpacity
          onPress={handleMarcarTodasLeidas}
          style={styles.botonAccionDerecho}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={24}
            color="#7c3aed"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            colors={["#7c3aed"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacioContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#d1d5db"
            />
            <Text style={styles.vacioTexto}>
              No tienes notificaciones recientes
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notiCard, !item.leido && styles.notiNoLeida]}
            onPress={() => handlePresionarNotificacion(item)}
            activeOpacity={0.7}
          >
            {/* Icono lateral */}
            <View
              style={[
                styles.iconoContainer,
                !item.leido ? styles.iconoNoLeido : styles.iconoLeido,
              ]}
            >
              <Ionicons
                name={item.leido ? "notifications-outline" : "notifications"}
                size={22}
                color={!item.leido ? "#7c3aed" : "#9ca3af"}
              />
            </View>

            {/* Contenido */}
            <View style={styles.notiContenido}>
              <View style={styles.notiHeaderRow}>
                <Text
                  style={[
                    styles.notiTitulo,
                    !item.leido && styles.textoNoLeido,
                  ]}
                  numberOfLines={1}
                >
                  {item.titulo}
                </Text>
                {!item.leido && <View style={styles.puntoNuevo} />}
              </View>
              <Text style={styles.notiMensaje} numberOfLines={2}>
                {item.mensaje}
              </Text>
              <Text style={styles.notiFecha}>
                {formatFecha(item.fechaCreacion)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  botonAccionDerecho: {
    width: 80,
    alignItems: "flex-end",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  notiCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  notiNoLeida: {
    backgroundColor: "#f5f3ff", // Un morado muy clarito que combina con tu #7c3aed
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  iconoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  iconoNoLeido: {
    backgroundColor: "#ede9fe",
  },
  iconoLeido: {
    backgroundColor: "#f3f4f6",
  },
  notiContenido: {
    flex: 1,
  },
  notiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notiTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    paddingRight: 8,
  },
  textoNoLeido: {
    color: "#111827",
    fontWeight: "700",
  },
  puntoNuevo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7c3aed",
  },
  notiMensaje: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  notiFecha: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  vacioContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  vacioTexto: {
    fontSize: 15,
    color: "#9ca3af",
    fontWeight: "500",
  },
});

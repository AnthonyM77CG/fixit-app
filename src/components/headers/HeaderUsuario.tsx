import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotificaciones } from "../../context/NotificacionContext";

interface HeaderUsuarioProps {
  onNotifPress: () => void;
  onLogoutPress: () => void;
}

export default function HeaderUsuario({
  onNotifPress,
  onLogoutPress,
}: Omit<HeaderUsuarioProps, "hasNotifications">) {
  const { tieneNotificaciones, setTieneNotificaciones } = useNotificaciones();

  console.log("Header:", tieneNotificaciones);

  const handleNotifPress = () => {
    setTieneNotificaciones(false);
    onNotifPress();
  };
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleNotifPress}>
        <View style={styles.notifContainer}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
          {tieneNotificaciones && <View style={styles.notifDot} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonCerrar} onPress={onLogoutPress}>
        <Ionicons name="log-out-outline" size={16} color="#fff" />
        <Text style={styles.botonCerrarTexto}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

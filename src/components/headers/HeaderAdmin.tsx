import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotificaciones } from "../../context/NotificacionContext";

interface HeaderAdminProps {
  hasNotifications: boolean;
  onNotifPress: () => void;
  onLogoutPress: () => void;
  // Opcionales para la pantalla de Inicio (Dashboard)
  onPdfPress?: () => void;
  isPdfLoading?: boolean;
}

export default function HeaderAdmin({
  hasNotifications,
  onNotifPress,
  onLogoutPress,
  onPdfPress,
  isPdfLoading = false,
}: HeaderAdminProps) {
  const { tieneNotificaciones } = useNotificaciones();
  return (
    <View style={styles.header}>
      {/* Botón de Notificaciones */}
      <TouchableOpacity onPress={onNotifPress}>
        <View style={styles.notifContainer}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
          {tieneNotificaciones && <View style={styles.notifDot} />}
        </View>
      </TouchableOpacity>

      <View style={styles.headerBotones}>
        {onPdfPress && (
          <TouchableOpacity
            style={[styles.botonPDF, isPdfLoading && styles.botonDesactivado]}
            onPress={onPdfPress}
            disabled={isPdfLoading}
          >
            {isPdfLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.botonPDFTexto}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity style={styles.botonCerrar} onPress={onLogoutPress}>
          <Ionicons name="log-out-outline" size={16} color="#fff" />
          <Text style={styles.botonCerrarTexto}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </View>
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
  notifContainer: {
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  headerBotones: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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
  botonPDFTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
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
  botonCerrarTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  botonDesactivado: {
    backgroundColor: "#9ca3af",
  },
});

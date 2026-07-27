import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usuarioService } from "../../../src/services/usuario.service";
import { Rol } from "../../../src/models/rol.model";
import { Area } from "../../../src/models/area.model";
import { rolService } from "../../../src/services/rol.service";
import { areaService } from "../../../src/services/area.service";

export default function AdminEditarUsuarioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const [areasDisponibles, setAreasDisponibles] = useState<Area[]>([]);

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    celular: "",
    rolId: null as number | null,
    areaId: null as number | null,
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatosUsuario();
  }, [id]);

  const cargarDatosUsuario = async () => {
    try {
      setCargando(true);
      const [roles, areas, usuarioActual] = await Promise.all([
        rolService.getRoles(),
        areaService.getAreas(),
        usuarioService.obtenerPorId(Number(id)),
      ]);

      setRolesDisponibles(roles);
      setAreasDisponibles(areas);

      // 1. Buscamos el objeto Rol cuyo nombre coincida con el String "usuarioActual.rol"
      const rolEncontrado = roles.find(
        (r) => r.nombre.toLowerCase() === usuarioActual.rol?.toLowerCase(),
      );

      // 2. Buscamos el objeto Area cuyo nombre coincida con el String "usuarioActual.area"
      const areaEncontrada = areas.find(
        (a) => a.nombre.toLowerCase() === usuarioActual.area?.toLowerCase(),
      );

      setFormulario({
        nombre: usuarioActual.nombre || "",
        apellido: usuarioActual.apellido || "",
        correo: usuarioActual.correo || "",
        celular: usuarioActual.celular || "",
        rolId: rolEncontrado ? rolEncontrado.id : null,
        areaId: areaEncontrada ? areaEncontrada.id : null,
      });
    } catch (e: any) {
      Alert.alert("Error", "No se pudo cargar la información del usuario");
      router.back();
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (campo: string, valor: string | number) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    if (!formulario.nombre || !formulario.apellido || !formulario.correo) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa los campos obligatorios.",
      );
      return;
    }

    try {
      setGuardando(true);

      // Llamada al servicio con el payload exacto de tu DTO
      await usuarioService.actualizarUsuarioAdmin(Number(id), {
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        correo: formulario.correo,
        celular: formulario.celular,
        rolId: formulario.rolId ?? undefined,
        areaId: formulario.areaId ?? undefined,
      });

      Alert.alert("Éxito", "Usuario actualizado correctamente");
      router.back();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo actualizar el usuario",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonVolver}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={styles.botonVolverTexto}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Editar Usuario</Text>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Datos Personales</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={formulario.nombre}
              onChangeText={(text) => handleChange("nombre", text)}
              placeholder="Ej. Juan"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Apellido *</Text>
            <TextInput
              style={styles.input}
              value={formulario.apellido}
              onChangeText={(text) => handleChange("apellido", text)}
              placeholder="Ej. Pérez"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Correo Electrónico *</Text>
            <TextInput
              style={styles.input}
              value={formulario.correo}
              onChangeText={(text) => handleChange("correo", text)}
              placeholder="correo@empresa.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Celular</Text>
            <TextInput
              style={styles.input}
              value={formulario.celular}
              onChangeText={(text) => handleChange("celular", text)}
              placeholder="Ej. 987654321"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Asignaciones del Sistema</Text>

            <Text style={styles.label}>Rol *</Text>
            <View style={styles.chipsContainer}>
              {rolesDisponibles.map((rol) => {
                const activo = formulario.rolId === rol.id;
                return (
                  <TouchableOpacity
                    key={rol.id}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => handleChange("rolId", rol.id)}
                  >
                    <Text
                      style={[
                        styles.chipTexto,
                        activo && styles.chipTextoActivo,
                      ]}
                    >
                      {rol.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Área *</Text>
            <View style={styles.chipsContainer}>
              {areasDisponibles.map((area) => {
                const activo = formulario.areaId === area.id;
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => handleChange("areaId", area.id)}
                  >
                    <Text
                      style={[
                        styles.chipTexto,
                        activo && styles.chipTextoActivo,
                      ]}
                    >
                      {area.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botón de Guardar */}
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonDesactivado]}
            onPress={handleGuardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.botonGuardarTexto}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

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

  label: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  /* Estilos para los chips de Rol y Área */
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActivo: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  chipTexto: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "600",
  },
  chipTextoActivo: {
    color: "#fff",
  },

  /* Botón Guardar */
  botonGuardar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    height: 52,
    gap: 8,
    marginTop: 8,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  botonGuardarTexto: { color: "#fff", fontSize: 16, fontWeight: "700" },
  botonDesactivado: { opacity: 0.7 },
});

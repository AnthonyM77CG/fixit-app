import { Tabs } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function EmpleadoLayout() {
  const { usuario } = useAuth();

  if (!usuario) return <Redirect href="/auth/metodo-login" />;
  if (usuario.rol !== "Empleado") return <Redirect href="/auth/metodo-login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#f3f4f6",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agregar"
        options={{
          title: "Agregar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="editar/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="seguimiento/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

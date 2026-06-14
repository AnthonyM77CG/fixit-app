import { Tabs } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminLayout() {
  const { usuario } = useAuth();

  if (!usuario) return <Redirect href="/auth/metodo-login" />;
  if (usuario.rol !== "Administrador")
    return <Redirect href="/auth/metodo-login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7c3aed",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          elevation: 0, // Para evitar sombras extrañas en Android
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incidencias"
        options={{
          title: "Incidencias",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="atencion/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

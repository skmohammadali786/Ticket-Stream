import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label, Badge } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useTickets } from "@/context/TicketContext";
import { useAuth } from "@/context/AuthContext";

function AgentNativeTabs() {
  const { tickets } = useTickets();
  const openCount = tickets.filter((t) => t.status === "open").length;
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tickets">
        <Icon sf={{ default: "tray", selected: "tray.fill" }} />
        <Label>Tickets</Label>
        {openCount > 0 && <Badge>{String(openCount)}</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chats">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="knowledge">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Knowledge</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function CustomerNativeTabs() {
  const { tickets } = useTickets();
  const { user } = useAuth();
  const myOpen = tickets.filter(
    (t) => t.customerId === user?.id && t.status === "open"
  ).length;
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="tickets">
        <Icon sf={{ default: "tray", selected: "tray.fill" }} />
        <Label>My Tickets</Label>
        {myOpen > 0 && <Badge>{String(myOpen)}</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chats">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const { tickets } = useTickets();
  const { user } = useAuth();
  const isCustomer = user?.role === "customer";
  const openCount = tickets.filter((t) => t.status === "open").length;
  const myOpenCount = tickets.filter(
    (t) => t.customerId === user?.id && t.status === "open"
  ).length;

  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.white,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.white }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={
          isCustomer
            ? { href: null }
            : {
                title: "Dashboard",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="bar-chart" size={size} color={color} />
                ),
              }
        }
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: isCustomer ? "My Tickets" : "Tickets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray" size={size} color={color} />
          ),
          tabBarBadge: isCustomer
            ? myOpenCount > 0
              ? myOpenCount
              : undefined
            : openCount > 0
            ? openCount
            : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.accent },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={
          isCustomer
            ? { href: null }
            : {
                title: "Knowledge",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="book" size={size} color={color} />
                ),
              }
        }
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const isCustomer = user?.role === "customer";

  if (isLiquidGlassAvailable()) {
    return isCustomer ? <CustomerNativeTabs /> : <AgentNativeTabs />;
  }
  return <ClassicTabLayout />;
}

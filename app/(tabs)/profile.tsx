import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
      style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.menuIconBg, { backgroundColor: danger ? Colors.urgentBg : Colors.surface }]}>
        <Ionicons name={icon} size={20} color={danger ? Colors.urgentText : Colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: Colors.urgentText }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { tickets } = useTickets();
  const isAgent = user?.role === "agent";

  const myTickets = tickets.filter((t) =>
    isAgent ? t.assigneeId === user?.id : t.customerId === user?.id
  );
  const resolved = myTickets.filter((t) => t.status === "resolved").length;
  const open = myTickets.filter((t) => t.status === "open").length;

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topInsets + 12, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[Colors.primary, "#0284C7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileBanner}
      >
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{(user?.name || "U")[0]}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons
            name={isAgent ? "headset" : "person"}
            size={13}
            color={Colors.primary}
          />
          <Text style={styles.roleText}>
            {isAgent ? "Support Agent" : "Customer"}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{myTickets.length}</Text>
          <Text style={styles.statLbl}>{isAgent ? "Assigned" : "My Tickets"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>{open}</Text>
          <Text style={styles.statLbl}>Open</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.success }]}>{resolved}</Text>
          <Text style={styles.statLbl}>Resolved</Text>
        </View>
      </View>

      {isAgent && (
        <>
          <Text style={styles.sectionLabel}>Agent Tools</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="book-outline"
              label="Knowledge Base"
              onPress={() => router.push("/(tabs)/knowledge")}
            />
            <MenuItem
              icon="code-slash-outline"
              label="API Reference"
              value="v2.0"
              onPress={() => {}}
            />
            <MenuItem
              icon="git-network-outline"
              label="Webhooks & Integrations"
              onPress={() => {}}
            />
          </View>
        </>
      )}

      {!isAgent && (
        <>
          <Text style={styles.sectionLabel}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="add-circle-outline"
              label="Submit New Ticket"
              onPress={() => router.push("/(tabs)/tickets")}
            />
            <MenuItem
              icon="chatbubble-ellipses-outline"
              label="Live Chat"
              onPress={() => router.push("/(tabs)/chats")}
            />
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>App</Text>
      <View style={styles.menuGroup}>
        <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/terms-of-service')} />
        <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => router.push('/privacy-policy')} />
        <MenuItem icon="information-circle-outline" label="App Version" value="1.0.0" />
      </View>

      <View style={[styles.menuGroup, { marginTop: 8 }]}>
        <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TicketStream · Support at the speed of now</Text>
        <View style={styles.footerLinks}>
          <Pressable>
            <Text style={styles.footerLink}>Integrations</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable>
            <Text style={styles.footerLink}>API Docs</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable>
            <Text style={styles.footerLink}>Status</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarLargeText: { fontSize: 32, fontFamily: "Inter_700Bold", color: Colors.white },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.white, marginBottom: 4 },
  profileEmail: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginBottom: 12 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
  },
  roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.text },
  statLbl: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  menuGroup: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.text },
  menuValue: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginRight: 4 },
  footer: { alignItems: "center", paddingVertical: 20, gap: 10 },
  footerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  footerLinks: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLink: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.primary },
  footerDot: { color: Colors.textMuted },
});

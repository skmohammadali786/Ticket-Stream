import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";

function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function PriorityBar({ priority, count, max }: { priority: string; count: number; max: number }) {
  const colorMap: Record<string, string> = {
    urgent: Colors.urgentText,
    high: Colors.highText,
    medium: Colors.mediumText,
    low: Colors.lowText,
  };
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <View style={styles.priorityRow}>
      <Text style={styles.priorityLabel}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
      <View style={styles.priorityBarBg}>
        <View style={[styles.priorityBarFill, { width: `${width}%` as any, backgroundColor: colorMap[priority] }]} />
      </View>
      <Text style={[styles.priorityCount, { color: colorMap[priority] }]}>{count}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tickets } = useTickets();

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const urgent = tickets.filter((t) => t.priority === "urgent").length;
    const high = tickets.filter((t) => t.priority === "high").length;
    const medium = tickets.filter((t) => t.priority === "medium").length;
    const low = tickets.filter((t) => t.priority === "low").length;
    const withResponse = tickets.filter((t) => t.responseTime !== undefined);
    const avgResponse =
      withResponse.length > 0
        ? Math.round(withResponse.reduce((s, t) => s + (t.responseTime || 0), 0) / withResponse.length)
        : 0;
    const myTickets = tickets.filter((t) => t.assigneeId === user?.id);
    return { open, inProgress, resolved, urgent, high, medium, low, avgResponse, myTickets: myTickets.length };
  }, [tickets, user]);

  const maxPriority = Math.max(stats.urgent, stats.high, stats.medium, stats.low, 1);

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topInsets + 16, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.name || "Agent"}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(user?.name || "U")[0]}</Text>
        </View>
      </View>

      <LinearGradient
        colors={[Colors.primary, "#0284C7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroBannerContent}>
          <View>
            <Text style={styles.heroLabel}>Open Tickets</Text>
            <Text style={styles.heroValue}>{stats.open}</Text>
            <Text style={styles.heroSub}>{stats.inProgress} in progress · {stats.resolved} resolved</Text>
          </View>
          <View style={styles.heroRight}>
            <Ionicons name="ticket" size={48} color="rgba(255,255,255,0.25)" />
          </View>
        </View>
        {user?.role === "agent" && (
          <View style={styles.heroAssigned}>
            <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroAssignedText}>{stats.myTickets} assigned to you</Text>
          </View>
        )}
      </LinearGradient>

      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Avg Response" value={`${stats.avgResponse}m`} icon="timer-outline" color={Colors.primary} subtitle="minutes" />
        <StatCard label="Resolved Today" value={stats.resolved} icon="checkmark-circle" color={Colors.success} />
        <StatCard label="Urgent" value={stats.urgent} icon="warning" color={Colors.urgentText} />
        <StatCard label="Unassigned" value={stats.open - (tickets.filter(t => t.status === "open" && t.assigneeId).length)} icon="person-remove-outline" color={Colors.accent} />
      </View>

      <Text style={styles.sectionTitle}>Priority Breakdown</Text>
      <View style={styles.priorityCard}>
        {["urgent", "high", "medium", "low"].map((p) => (
          <PriorityBar
            key={p}
            priority={p}
            count={stats[p as keyof typeof stats] as number}
            max={maxPriority}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {tickets.slice(0, 4).map((t) => (
        <Pressable
          key={t.id}
          onPress={() => router.push({ pathname: "/ticket/[id]", params: { id: t.id } })}
          style={({ pressed }) => [styles.activityItem, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.priorityDot, {
            backgroundColor:
              t.priority === "urgent" ? Colors.urgentText :
              t.priority === "high" ? Colors.highText :
              t.priority === "medium" ? Colors.mediumText : Colors.lowText,
          }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activityTitle} numberOfLines={1}>{t.title}</Text>
            <Text style={styles.activityMeta}>{t.customerName} · {t.status.replace("_", " ")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.white },
  heroBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  heroBannerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  heroValue: { fontSize: 48, fontFamily: "Inter_700Bold", color: Colors.white, lineHeight: 56 },
  heroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 4 },
  heroRight: { marginTop: 4 },
  heroAssigned: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  heroAssignedText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  statSubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  priorityCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  priorityLabel: { width: 56, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  priorityBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: "hidden",
  },
  priorityBarFill: { height: "100%", borderRadius: 4 },
  priorityCount: { width: 20, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  activityTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 2 },
  activityMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

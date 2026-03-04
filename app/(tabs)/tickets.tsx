import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useTickets, Ticket, Priority, TicketStatus } from "@/context/TicketContext";
import { useAuth } from "@/context/AuthContext";

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  urgent: { bg: Colors.urgentBg, text: Colors.urgentText },
  high: { bg: Colors.highBg, text: Colors.highText },
  medium: { bg: Colors.mediumBg, text: Colors.mediumText },
  low: { bg: Colors.lowBg, text: Colors.lowText },
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function PriorityTag({ priority }: { priority: Priority }) {
  const { bg, text } = PRIORITY_COLORS[priority];
  return (
    <View style={[styles.priorityTag, { backgroundColor: bg }]}>
      <Text style={[styles.priorityTagText, { color: text }]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Text>
    </View>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const timeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/ticket/[id]", params: { id: ticket.id } });
      }}
      style={({ pressed }) => [styles.ticketCard, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={styles.ticketTop}>
        <PriorityTag priority={ticket.priority} />
        <View style={[styles.statusPill,
          ticket.status === "resolved" ? { backgroundColor: Colors.lowBg } :
          ticket.status === "in_progress" ? { backgroundColor: Colors.surface } :
          { backgroundColor: Colors.background }
        ]}>
          <Text style={[styles.statusPillText,
            ticket.status === "resolved" ? { color: Colors.lowText } :
            ticket.status === "in_progress" ? { color: Colors.primary } :
            { color: Colors.textSecondary }
          ]}>
            {STATUS_LABELS[ticket.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.ticketTitle} numberOfLines={2}>{ticket.title}</Text>
      <Text style={styles.ticketDesc} numberOfLines={1}>{ticket.description}</Text>
      <View style={styles.ticketMeta}>
        <View style={styles.customerChip}>
          <View style={styles.customerDot} />
          <Text style={styles.customerName}>{ticket.customerName}</Text>
        </View>
        {ticket.assigneeName ? (
          <View style={styles.assigneeChip}>
            <Ionicons name="person-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.assigneeName}>{ticket.assigneeName.split(" ")[0]}</Text>
          </View>
        ) : (
          <View style={styles.unassignedChip}>
            <Ionicons name="person-remove-outline" size={11} color={Colors.accent} />
            <Text style={styles.unassignedText}>Unassigned</Text>
          </View>
        )}
        <Text style={styles.timeAgo}>{timeAgo(ticket.updatedAt)}</Text>
      </View>
      {ticket.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {ticket.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

type FilterStatus = "all" | TicketStatus;
type FilterPriority = "all" | Priority;

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tickets } = useTickets();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "me">("all");

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !t.customerName.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (assigneeFilter === "me" && t.assigneeId !== user?.id) return false;
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter, assigneeFilter]);

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: topInsets + 12 }]}>
        <Text style={styles.screenTitle}>Ticket Queue</Text>
        <Text style={styles.screenSubtitle}>{filtered.length} tickets</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search tickets..."
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {(["all", "open", "in_progress", "resolved"] as FilterStatus[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => { Haptics.selectionAsync(); setStatusFilter(s); }}
            style={[styles.filterPill, statusFilter === s && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, statusFilter === s && styles.filterPillTextActive]}>
              {s === "all" ? "All Status" : STATUS_LABELS[s]}
            </Text>
          </Pressable>
        ))}
        <View style={styles.filterDivider} />
        {(["all", "urgent", "high", "medium", "low"] as FilterPriority[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => { Haptics.selectionAsync(); setPriorityFilter(p); }}
            style={[
              styles.filterPill,
              priorityFilter === p && styles.filterPillActive,
              p !== "all" && priorityFilter === p && { backgroundColor: PRIORITY_COLORS[p].bg, borderColor: PRIORITY_COLORS[p].text },
            ]}
          >
            <Text style={[
              styles.filterPillText,
              priorityFilter === p && styles.filterPillTextActive,
              p !== "all" && priorityFilter === p && { color: PRIORITY_COLORS[p].text },
            ]}>
              {p === "all" ? "All Priority" : p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
        {user?.role === "agent" && (
          <>
            <View style={styles.filterDivider} />
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setAssigneeFilter(assigneeFilter === "all" ? "me" : "all"); }}
              style={[styles.filterPill, assigneeFilter === "me" && styles.filterPillActive]}
            >
              <Ionicons name="person" size={13} color={assigneeFilter === "me" ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.filterPillText, assigneeFilter === "me" && styles.filterPillTextActive]}>
                Assigned to me
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          filtered.map((t) => <TicketCard key={t.id} ticket={t} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  screenTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 2 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: 12,
  },
  filtersScroll: { flexGrow: 0, marginBottom: 4 },
  filtersContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row", alignItems: "center" },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPillText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  filterPillTextActive: { color: Colors.white },
  filterDivider: { width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 4 },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  priorityTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  priorityTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  statusPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  ticketTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 4, lineHeight: 22 },
  ticketDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 12 },
  ticketMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  customerChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  customerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  customerName: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  assigneeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  assigneeName: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.primary },
  unassignedChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.highBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  unassignedText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.accent },
  timeAgo: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginLeft: "auto" },
  tagsRow: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, backgroundColor: Colors.background },
  tagText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

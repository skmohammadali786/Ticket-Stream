import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
        <View style={[
          styles.statusPill,
          ticket.status === "resolved" ? { backgroundColor: Colors.lowBg } :
          ticket.status === "in_progress" ? { backgroundColor: Colors.surface } :
          { backgroundColor: Colors.background }
        ]}>
          <Text style={[
            styles.statusPillText,
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
        {ticket.assigneeName ? (
          <View style={styles.assigneeChip}>
            <Ionicons name="headset-outline" size={11} color={Colors.primary} />
            <Text style={styles.assigneeName}>{ticket.assigneeName}</Text>
          </View>
        ) : (
          <View style={styles.unassignedChip}>
            <Ionicons name="time-outline" size={11} color={Colors.accent} />
            <Text style={styles.unassignedText}>Awaiting agent</Text>
          </View>
        )}
        <Text style={styles.timeAgo}>{timeAgo(ticket.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

function NewTicketModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, desc: string, priority: Priority) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your ticket.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(title.trim(), desc.trim(), priority);
      setTitle("");
      setDesc("");
      setPriority("medium");
      onClose();
    } catch {
      Alert.alert("Error", "Failed to submit ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit New Ticket</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Issue Title</Text>
              <TextInput
                style={styles.formInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Briefly describe your issue"
                placeholderTextColor={Colors.textMuted}
                maxLength={120}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={desc}
                onChangeText={setDesc}
                placeholder="Provide more details about your issue..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={2000}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.priorityPicker}>
                {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => { Haptics.selectionAsync(); setPriority(p); }}
                    style={[
                      styles.priorityPickerItem,
                      { borderColor: PRIORITY_COLORS[p].text + "60" },
                      priority === p && { backgroundColor: PRIORITY_COLORS[p].bg, borderColor: PRIORITY_COLORS[p].text },
                    ]}
                  >
                    <Text style={[styles.priorityPickerText, { color: priority === p ? PRIORITY_COLORS[p].text : Colors.textMuted }]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading || !title.trim()}
              style={({ pressed }) => [
                styles.submitBtn,
                { opacity: pressed || loading || !title.trim() ? 0.7 : 1 },
              ]}
            >
              <LinearGradient
                colors={[Colors.primary, "#0284C7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={Colors.white} />
                    <Text style={styles.submitBtnText}>Submit Ticket</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type FilterStatus = "all" | TicketStatus;
type FilterPriority = "all" | Priority;

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tickets, createTicket } = useTickets();
  const isCustomer = user?.role === "customer";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "me">("all");
  const [showNewTicket, setShowNewTicket] = useState(false);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (isCustomer && t.customerId !== user?.id) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !t.customerName.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (!isCustomer && assigneeFilter === "me" && t.assigneeId !== user?.id) return false;
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter, assigneeFilter, isCustomer, user]);

  const handleNewTicket = async (title: string, desc: string, priority: Priority) => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await createTicket({
      title,
      description: desc || "No additional details provided.",
      status: "open",
      priority,
      customerId: user.id,
      customerName: user.name,
      tags: [],
    });
  };

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  const openCount = filtered.filter((t) => t.status === "open").length;
  const inProgressCount = filtered.filter((t) => t.status === "in_progress").length;

  return (
    <View style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: topInsets + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>
              {isCustomer ? "My Tickets" : "Ticket Queue"}
            </Text>
            <Text style={styles.screenSubtitle}>{filtered.length} tickets</Text>
          </View>
          {isCustomer && (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowNewTicket(true); }}
              style={styles.newTicketBtn}
            >
              <LinearGradient
                colors={[Colors.primary, "#0284C7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newTicketBtnGradient}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.newTicketBtnText}>New Ticket</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {isCustomer && filtered.length > 0 && (
          <View style={styles.customerStatsRow}>
            <View style={styles.customerStat}>
              <Text style={styles.customerStatNum}>{openCount}</Text>
              <Text style={styles.customerStatLbl}>Open</Text>
            </View>
            <View style={styles.customerStat}>
              <Text style={[styles.customerStatNum, { color: Colors.primary }]}>{inProgressCount}</Text>
              <Text style={styles.customerStatLbl}>In Progress</Text>
            </View>
            <View style={styles.customerStat}>
              <Text style={[styles.customerStatNum, { color: Colors.success }]}>
                {filtered.filter((t) => t.status === "resolved").length}
              </Text>
              <Text style={styles.customerStatLbl}>Resolved</Text>
            </View>
          </View>
        )}

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={isCustomer ? "Search your tickets..." : "Search tickets..."}
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
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </Text>
          </Pressable>
        ))}
        {!isCustomer && (
          <>
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
            <Ionicons name="file-tray-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {isCustomer ? "No tickets yet" : "No tickets found"}
            </Text>
            <Text style={styles.emptyText}>
              {isCustomer
                ? "Submit a ticket to get help from our support team"
                : "Try adjusting your filters"}
            </Text>
            {isCustomer && (
              <Pressable
                onPress={() => setShowNewTicket(true)}
                style={styles.emptySubmitBtn}
              >
                <Text style={styles.emptySubmitBtnText}>Submit a Ticket</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filtered.map((t) => <TicketCard key={t.id} ticket={t} />)
        )}
      </ScrollView>

      <NewTicketModal
        visible={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        onSubmit={handleNewTicket}
      />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  screenTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 2 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  newTicketBtn: { borderRadius: 50, overflow: "hidden", marginTop: 4 },
  newTicketBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newTicketBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.white },
  customerStatsRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  customerStat: { flex: 1, alignItems: "center" },
  customerStatNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  customerStatLbl: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
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
  filtersScroll: { flexGrow: 0 },
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
  ticketMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  assigneeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  assigneeName: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.primary },
  unassignedChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.highBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  unassignedText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.accent },
  timeAgo: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginLeft: "auto" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", lineHeight: 20 },
  emptySubmitBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
  },
  emptySubmitBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.white },
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  formGroup: { gap: 8 },
  formLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  formInput: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  formTextarea: { height: 120, paddingTop: 13 },
  priorityPicker: { flexDirection: "row", gap: 8 },
  priorityPickerItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  priorityPickerText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  submitBtn: { borderRadius: 14, overflow: "hidden" },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.white },
});

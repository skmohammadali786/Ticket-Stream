import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useTickets, Priority, TicketStatus } from "@/context/TicketContext";
import { useAuth } from "@/context/AuthContext";

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  urgent: { bg: Colors.urgentBg, text: Colors.urgentText },
  high: { bg: Colors.highBg, text: Colors.highText },
  medium: { bg: Colors.mediumBg, text: Colors.mediumText },
  low: { bg: Colors.lowBg, text: Colors.lowText },
};

const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS: Priority[] = ["urgent", "high", "medium", "low"];

export default function TicketDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tickets, updateTicketStatus, updateTicketPriority, assignTicket } = useTickets();
  const { user } = useAuth();
  const ticket = tickets.find((t) => t.id === id);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  if (!ticket) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    );
  }

  const timeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  const handleStatusChange = async (status: TicketStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateTicketStatus(ticket.id, status);
    setShowStatusPicker(false);
  };

  const handlePriorityChange = async (priority: Priority) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateTicketPriority(ticket.id, priority);
    setShowPriorityPicker(false);
  };

  const handleAssign = async () => {
    if (!user || user.role !== "agent") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await assignTicket(ticket.id, user.id, user.name);
    Alert.alert("Assigned", "Ticket assigned to you.");
  };

  const { bg, text } = PRIORITY_COLORS[ticket.priority];

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInsets + 8 }]}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Ticket Details</Text>
        <Pressable
          onPress={() => router.push({ pathname: "/chat/[id]", params: { id: ticket.id } })}
          style={styles.chatBtn}
        >
          <Ionicons name="chatbubble" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketIdRow}>
            <Text style={styles.ticketId}>#{ticket.id}</Text>
            <Text style={styles.ticketCreated}>Created {timeAgo(ticket.createdAt)}</Text>
          </View>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
        </View>

        <View style={styles.attributesCard}>
          <View style={styles.attrRow}>
            <Text style={styles.attrLabel}>Status</Text>
            <Pressable
              onPress={() => { if (user?.role === "agent") setShowStatusPicker(true); }}
              style={styles.attrValuePill}
            >
              <View style={[styles.statusDot, {
                backgroundColor:
                  ticket.status === "resolved" ? Colors.success :
                  ticket.status === "in_progress" ? Colors.primary :
                  ticket.status === "closed" ? Colors.textMuted : Colors.accent,
              }]} />
              <Text style={styles.attrValue}>{ticket.status.replace("_", " ")}</Text>
              {user?.role === "agent" && <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />}
            </Pressable>
          </View>

          <View style={styles.attrRow}>
            <Text style={styles.attrLabel}>Priority</Text>
            <Pressable
              onPress={() => { if (user?.role === "agent") setShowPriorityPicker(true); }}
              style={[styles.attrValuePill, { backgroundColor: bg }]}
            >
              <Text style={[styles.attrValue, { color: text }]}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </Text>
              {user?.role === "agent" && <Ionicons name="chevron-down" size={14} color={text} />}
            </Pressable>
          </View>

          <View style={styles.attrRow}>
            <Text style={styles.attrLabel}>Customer</Text>
            <View style={styles.attrPersonRow}>
              <View style={[styles.attrAvatar, { backgroundColor: Colors.customerColor }]}>
                <Text style={styles.attrAvatarText}>{ticket.customerName[0]}</Text>
              </View>
              <Text style={styles.attrValue}>{ticket.customerName}</Text>
            </View>
          </View>

          <View style={styles.attrRow}>
            <Text style={styles.attrLabel}>Assigned to</Text>
            {ticket.assigneeName ? (
              <View style={styles.attrPersonRow}>
                <View style={[styles.attrAvatar, { backgroundColor: Colors.agentColor }]}>
                  <Text style={styles.attrAvatarText}>{ticket.assigneeName[0]}</Text>
                </View>
                <Text style={styles.attrValue}>{ticket.assigneeName}</Text>
              </View>
            ) : user?.role === "agent" ? (
              <Pressable onPress={handleAssign} style={styles.assignBtn}>
                <Text style={styles.assignBtnText}>Assign to me</Text>
              </Pressable>
            ) : (
              <Text style={[styles.attrValue, { color: Colors.textMuted }]}>Unassigned</Text>
            )}
          </View>

          <View style={styles.attrRow}>
            <Text style={styles.attrLabel}>Updated</Text>
            <Text style={styles.attrValue}>{timeAgo(ticket.updatedAt)}</Text>
          </View>

          {ticket.responseTime !== undefined && (
            <View style={styles.attrRow}>
              <Text style={styles.attrLabel}>First Response</Text>
              <Text style={styles.attrValue}>{ticket.responseTime}m</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.descCard}>
          <Text style={styles.descText}>{ticket.description}</Text>
        </View>

        {ticket.tags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {ticket.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Ionicons name="pricetag-outline" size={12} color={Colors.primary} />
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <Pressable
            onPress={() => updateTicketStatus(ticket.id, 'resolved')}
            style={styles.doneButton}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.doneButtonText}>Mark as Done</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push({ pathname: "/chat/[id]", params: { id: ticket.id } })}
          style={styles.chatButton}
        >
          <Ionicons name="chatbubbles" size={20} color={Colors.white} />
          <Text style={styles.chatButtonText}>View Conversation</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </Pressable>

        {showStatusPicker && (
          <Pressable style={styles.pickerOverlay} onPress={() => setShowStatusPicker(false)}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Change Status</Text>
              {STATUS_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => handleStatusChange(s)}
                  style={[styles.pickerOption, ticket.status === s && styles.pickerOptionActive]}
                >
                  <Text style={[styles.pickerOptionText, ticket.status === s && { color: Colors.primary }]}>
                    {s.replace("_", " ").charAt(0).toUpperCase() + s.replace("_", " ").slice(1)}
                  </Text>
                  {ticket.status === s && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        )}

        {showPriorityPicker && (
          <Pressable style={styles.pickerOverlay} onPress={() => setShowPriorityPicker(false)}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Change Priority</Text>
              {PRIORITY_OPTIONS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => handlePriorityChange(p)}
                  style={[styles.pickerOption, ticket.priority === p && { backgroundColor: PRIORITY_COLORS[p].bg }]}
                >
                  <Text style={[styles.pickerOptionText, { color: PRIORITY_COLORS[p].text }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                  {ticket.priority === p && <Ionicons name="checkmark" size={18} color={PRIORITY_COLORS[p].text} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketHeader: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketIdRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  ticketId: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  ticketCreated: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  ticketTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, lineHeight: 24 },
  attributesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  attrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  attrLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  attrValuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  attrValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  attrPersonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  attrAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  attrAvatarText: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.white },
  assignBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  assignBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 8 },
  descCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 22 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  chatButtonText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.white },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.success,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  doneButtonText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.white },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    borderRadius: 16,
  },
  pickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 4,
  },
  pickerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 8 },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pickerOptionActive: { backgroundColor: Colors.surface },
  pickerOptionText: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.text },
  errorText: { fontSize: 16, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
});

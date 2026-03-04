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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tickets, messages } = useTickets();

  const chatTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        if (user?.role === "customer") return t.customerId === user.id;
        return t.assigneeId === user?.id || t.status !== "closed";
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [tickets, user]);

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  const timeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: topInsets + 12 }]}>
        <Text style={styles.screenTitle}>Live Chat</Text>
        <Text style={styles.screenSubtitle}>{chatTickets.length} conversations</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {chatTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              {user?.role === "customer"
                ? "Submit a ticket to start chatting with support"
                : "Assign yourself to tickets to see chats here"}
            </Text>
          </View>
        ) : (
          chatTickets.map((ticket) => {
            const msgs = messages[ticket.id] || [];
            const lastMsg = msgs[msgs.length - 1];
            const unread = msgs.filter((m) => m.senderRole !== user?.role).length;

            return (
              <Pressable
                key={ticket.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({ pathname: "/chat/[id]", params: { id: ticket.id } });
                }}
                style={({ pressed }) => [styles.chatItem, { opacity: pressed ? 0.9 : 1 }]}
              >
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatar, { backgroundColor: user?.role === "customer" ? Colors.agentColor : Colors.customerColor }]}>
                    <Text style={styles.avatarText}>
                      {user?.role === "customer"
                        ? (ticket.assigneeName || "S")[0]
                        : ticket.customerName[0]}
                    </Text>
                  </View>
                  {ticket.status === "in_progress" && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.chatContent}>
                  <View style={styles.chatTop}>
                    <Text style={styles.chatName} numberOfLines={1}>
                      {user?.role === "customer"
                        ? (ticket.assigneeName || "Support Team")
                        : ticket.customerName}
                    </Text>
                    <Text style={styles.chatTime}>{timeAgo(ticket.updatedAt)}</Text>
                  </View>
                  <Text style={styles.chatTicketTitle} numberOfLines={1}>{ticket.title}</Text>
                  {lastMsg ? (
                    <Text style={[styles.chatPreview, unread > 0 && styles.chatPreviewUnread]} numberOfLines={1}>
                      {lastMsg.isInternal ? "[Internal note]" : lastMsg.content}
                    </Text>
                  ) : (
                    <Text style={styles.chatPreview}>No messages yet</Text>
                  )}
                </View>

                <View style={styles.chatRight}>
                  {unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread > 9 ? "9+" : unread}</Text>
                    </View>
                  )}
                  <View style={[styles.statusDot,
                    ticket.status === "resolved" ? { backgroundColor: Colors.success } :
                    ticket.status === "in_progress" ? { backgroundColor: Colors.primary } :
                    { backgroundColor: Colors.accent }
                  ]} />
                </View>
              </Pressable>
            );
          })
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
  },
  screenTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 2 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text, textAlign: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", lineHeight: 20 },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.white },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  chatContent: { flex: 1, gap: 2 },
  chatTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, flex: 1 },
  chatTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginLeft: 8 },
  chatTicketTitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.primary, marginBottom: 1 },
  chatPreview: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  chatPreviewUnread: { fontFamily: "Inter_600SemiBold", color: Colors.text },
  chatRight: { alignItems: "center", gap: 6 },
  unreadBadge: {
    backgroundColor: Colors.accent,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadText: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.white },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useTickets, Message } from "@/context/TicketContext";
import { useAuth } from "@/context/AuthContext";

function MessageBubble({ message, isMe }: { message: Message; isMe: boolean }) {
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.isInternal) {
    return (
      <View style={styles.internalNote}>
        <View style={styles.internalNoteHeader}>
          <Ionicons name="lock-closed" size={12} color={Colors.warning} />
          <Text style={styles.internalNoteLabel}>Internal Note · {message.senderName}</Text>
          <Text style={styles.msgTime}>{timeStr}</Text>
        </View>
        <Text style={styles.internalNoteText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
      {!isMe && (
        <View style={[styles.msgAvatar, { backgroundColor: message.senderRole === "agent" ? Colors.agentColor : Colors.customerColor }]}>
          <Text style={styles.msgAvatarText}>{message.senderName[0]}</Text>
        </View>
      )}
      <View style={[styles.bubbleContainer, isMe && styles.bubbleContainerMe]}>
        {!isMe && <Text style={styles.msgSender}>{message.senderName}</Text>}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.content}</Text>
        </View>
        <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{timeStr}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tickets, messages, addMessage } = useTickets();
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const ticket = tickets.find((t) => t.id === id);
  const threadMessages = messages[id] || [];

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText("");
    await addMessage({
      ticketId: id,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: text,
      isInternal: isInternal && user.role === "agent",
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  if (!ticket) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.textMuted, fontFamily: "Inter_400Regular" }}>Ticket not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInsets + 8 }]}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {user?.role === "customer" ? (ticket.assigneeName || "Support") : ticket.customerName}
          </Text>
          <Text style={styles.headerTicket} numberOfLines={1}>{ticket.title}</Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: "/ticket/[id]", params: { id: ticket.id } })}
          style={styles.infoBtn}
        >
          <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.statusBanner}>
        <View style={[styles.statusDot, {
          backgroundColor:
            ticket.status === "resolved" ? Colors.success :
            ticket.status === "in_progress" ? Colors.primary : Colors.accent,
        }]} />
        <Text style={styles.statusText}>
          {ticket.status === "in_progress" ? "Agent is online" :
           ticket.status === "resolved" ? "Ticket resolved" : "Waiting for agent"}
        </Text>
        <View style={styles.ticketIdBadge}>
          <Text style={styles.ticketIdText}>#{ticket.id}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={threadMessages.filter((m) => !m.isInternal || user?.role === "agent")}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.senderId === user?.id} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyChatTitle}>Start the conversation</Text>
              <Text style={styles.emptyChatText}>Send a message to begin</Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {user?.role === "agent" && (
          <View style={styles.noteToggleRow}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setIsInternal(false); }}
              style={[styles.noteToggle, !isInternal && styles.noteToggleActive]}
            >
              <Ionicons name="chatbubble-outline" size={14} color={!isInternal ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.noteToggleText, !isInternal && { color: Colors.primary }]}>Reply</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setIsInternal(true); }}
              style={[styles.noteToggle, isInternal && styles.noteToggleActiveInternal]}
            >
              <Ionicons name="lock-closed-outline" size={14} color={isInternal ? Colors.warning : Colors.textMuted} />
              <Text style={[styles.noteToggleText, isInternal && { color: Colors.warning }]}>Internal Note</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.inputArea, { paddingBottom: bottomInsets + 12, borderTopColor: isInternal ? Colors.warning + "40" : Colors.border }]}>
          <TextInput
            style={[styles.input, isInternal && { backgroundColor: Colors.mediumBg }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isInternal ? "Add internal note..." : "Type a message..."}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: !inputText.trim() ? Colors.border : isInternal ? Colors.warning : Colors.primary },
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={Colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  headerTicket: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  infoBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  ticketIdBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 50,
  },
  ticketIdText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, gap: 8 },
  messageRowMe: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  msgAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.white },
  bubbleContainer: { maxWidth: "75%", gap: 3 },
  bubbleContainerMe: { alignItems: "flex-end" },
  msgSender: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, paddingHorizontal: 4 },
  bubble: {
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 22 },
  bubbleTextMe: { color: Colors.white },
  msgTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, paddingHorizontal: 4 },
  msgTimeMe: { textAlign: "right" },
  internalNote: {
    backgroundColor: Colors.mediumBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  internalNoteHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  internalNoteLabel: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.warning },
  internalNoteText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 20 },
  emptyChat: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyChatTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyChatText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  noteToggleRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  noteToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: Colors.background,
  },
  noteToggleActive: { backgroundColor: Colors.surface },
  noteToggleActiveInternal: { backgroundColor: Colors.mediumBg },
  noteToggleText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    maxHeight: 120,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});

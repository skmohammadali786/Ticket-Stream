import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useKnowledge } from "@/context/KnowledgeContext";

function MarkdownText({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <View style={{ gap: 8 }}>
      {lines.map((line, idx) => {
        if (line.startsWith("## ")) {
          return (
            <Text key={idx} style={mdStyles.h2}>{line.slice(3)}</Text>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <Text key={idx} style={mdStyles.bold}>{line.slice(2, -2)}</Text>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <View key={idx} style={mdStyles.listItem}>
              <Text style={mdStyles.bullet}>·</Text>
              <Text style={mdStyles.listText}>{line.slice(2)}</Text>
            </View>
          );
        }
        if (line.startsWith("```")) {
          return null;
        }
        if (line.trim() === "") return <View key={idx} style={{ height: 4 }} />;
        return (
          <Text key={idx} style={mdStyles.body}>{line}</Text>
        );
      })}
    </View>
  );
}

const mdStyles = StyleSheet.create({
  h2: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, marginTop: 8, marginBottom: 4 },
  bold: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 24 },
  listItem: { flexDirection: "row", gap: 8, paddingLeft: 8 },
  bullet: { fontSize: 18, color: Colors.primary, lineHeight: 24 },
  listText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 24 },
});

export default function ArticleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { articles } = useKnowledge();
  const article = articles.find((a) => a.id === id);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!article) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.textMuted, fontFamily: "Inter_400Regular" }}>Article not found</Text>
      </View>
    );
  }

  const timeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    if (diff < 86400000) return "Today";
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInsets + 8 }]}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Knowledge Base</Text>
        <View style={styles.readTimeBadge}>
          <Ionicons name="time-outline" size={13} color={Colors.primary} />
          <Text style={styles.readTimeText}>{article.readTime} min</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoryRow}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
          <Text style={styles.updatedText}>Updated {timeAgo(article.updatedAt)}</Text>
        </View>

        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.articleSummary}>{article.summary}</Text>

        <View style={styles.divider} />

        <MarkdownText content={article.content} />

        <View style={styles.tagsSection}>
          <Text style={styles.tagsSectionLabel}>Related Topics</Text>
          <View style={styles.tagsRow}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.helpfulSection}>
          <Text style={styles.helpfulQuestion}>Was this article helpful?</Text>
          <Text style={styles.helpfulCount}>{article.helpful} people found this helpful</Text>
          <View style={styles.voteRow}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setVoted("up"); }}
              style={[styles.voteBtn, voted === "up" && styles.voteBtnActiveUp]}
            >
              <Ionicons
                name={voted === "up" ? "thumbs-up" : "thumbs-up-outline"}
                size={20}
                color={voted === "up" ? Colors.success : Colors.textSecondary}
              />
              <Text style={[styles.voteBtnText, voted === "up" && { color: Colors.success }]}>Yes</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setVoted("down"); }}
              style={[styles.voteBtn, voted === "down" && styles.voteBtnActiveDown]}
            >
              <Ionicons
                name={voted === "down" ? "thumbs-down" : "thumbs-down-outline"}
                size={20}
                color={voted === "down" ? Colors.urgentText : Colors.textSecondary}
              />
              <Text style={[styles.voteBtnText, voted === "down" && { color: Colors.urgentText }]}>No</Text>
            </Pressable>
          </View>
          {voted && (
            <Text style={styles.voteThankYou}>
              {voted === "up" ? "Thanks for the feedback!" : "We'll work on improving this article."}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={styles.backToKb}
        >
          <Ionicons name="book-outline" size={18} color={Colors.primary} />
          <Text style={styles.backToKbText}>Back to Knowledge Base</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  readTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  readTimeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  categoryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  categoryChip: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50 },
  categoryText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  updatedText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  articleTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, lineHeight: 30, marginBottom: 10 },
  articleSummary: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 20 },
  tagsSection: { marginTop: 24, marginBottom: 20 },
  tagsSectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, borderWidth: 1, borderColor: Colors.border },
  tagText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  helpfulSection: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  helpfulQuestion: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  helpfulCount: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  voteRow: { flexDirection: "row", gap: 12 },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  voteBtnActiveUp: { borderColor: Colors.success, backgroundColor: Colors.lowBg },
  voteBtnActiveDown: { borderColor: Colors.urgentText, backgroundColor: Colors.urgentBg },
  voteBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  voteThankYou: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.success, textAlign: "center" },
  backToKb: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  backToKbText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.primary },
});

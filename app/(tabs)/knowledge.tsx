import React, { useState } from "react";
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
import { useKnowledge, KBArticle, KBCategory } from "@/context/KnowledgeContext";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "API & Integrations": "code-slash-outline",
  "Ticket Management": "file-tray-outline",
  "Live Chat": "chatbubbles-outline",
  "Account Management": "person-circle-outline",
  "Automation": "flash-outline",
};

function ArticleCard({ article }: { article: KBArticle }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/article/[id]", params: { id: article.id } });
      }}
      style={({ pressed }) => [styles.articleCard, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={styles.articleTop}>
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{article.category}</Text>
        </View>
        <Text style={styles.readTime}>{article.readTime} min read</Text>
      </View>
      <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
      <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
      <View style={styles.articleFooter}>
        <View style={styles.helpfulRow}>
          <Ionicons name="thumbs-up-outline" size={13} color={Colors.success} />
          <Text style={styles.helpfulCount}>{article.helpful} found helpful</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

function CategoryChip({ cat, selected, onPress }: { cat: KBCategory; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={[styles.catChip, selected && styles.catChipSelected]}
    >
      <Ionicons
        name={CATEGORY_ICONS[cat.name] || "folder-outline"}
        size={16}
        color={selected ? Colors.white : Colors.primary}
      />
      <Text style={[styles.catChipText, selected && styles.catChipTextSelected]}>{cat.name}</Text>
      <View style={[styles.catCount, selected && styles.catCountSelected]}>
        <Text style={[styles.catCountText, selected && styles.catCountTextSelected]}>{cat.count}</Text>
      </View>
    </Pressable>
  );
}

export default function KnowledgeScreen() {
  const insets = useSafeAreaInsets();
  const { articles, categories, getArticlesByCategory, searchArticles } = useKnowledge();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const displayed = search
    ? searchArticles(search)
    : selectedCat
    ? getArticlesByCategory(selectedCat)
    : articles;

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: topInsets + 12 }]}>
        <Text style={styles.screenTitle}>Knowledge Base</Text>
        <Text style={styles.screenSubtitle}>{articles.length} articles</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={(v) => { setSearch(v); if (v) setSelectedCat(null); }}
            placeholder="Search articles..."
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {!search && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catsScroll}
          contentContainerStyle={styles.catsContent}
        >
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setSelectedCat(null); }}
            style={[styles.allChip, !selectedCat && styles.allChipSelected]}
          >
            <Text style={[styles.allChipText, !selectedCat && styles.allChipTextSelected]}>All</Text>
          </Pressable>
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              cat={cat}
              selected={selectedCat === cat.name}
              onPress={() => setSelectedCat(selectedCat === cat.name ? null : cat.name)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {displayed.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No articles found</Text>
            <Text style={styles.emptyText}>Try a different search term</Text>
          </View>
        ) : (
          displayed.map((a) => <ArticleCard key={a.id} article={a} />)
        )}

        <View style={styles.apiSection}>
          <Text style={styles.apiTitle}>Developer Resources</Text>
          <View style={styles.apiGrid}>
            <Pressable style={styles.apiCard}>
              <View style={styles.apiIconBg}>
                <Ionicons name="code-slash" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.apiCardTitle}>API Reference</Text>
              <Text style={styles.apiCardDesc}>Full REST API documentation with examples</Text>
              <View style={styles.apiCardLink}>
                <Text style={styles.apiCardLinkText}>View Docs</Text>
                <Ionicons name="open-outline" size={13} color={Colors.primary} />
              </View>
            </Pressable>
            <Pressable style={styles.apiCard}>
              <View style={styles.apiIconBg}>
                <Ionicons name="git-network" size={22} color={Colors.accent} />
              </View>
              <Text style={styles.apiCardTitle}>Integrations</Text>
              <Text style={styles.apiCardDesc}>Connect with 50+ apps and services</Text>
              <View style={styles.apiCardLink}>
                <Text style={[styles.apiCardLinkText, { color: Colors.accent }]}>Browse</Text>
                <Ionicons name="open-outline" size={13} color={Colors.accent} />
              </View>
            </Pressable>
          </View>

          <View style={styles.footerLinks}>
            <Pressable style={styles.footerLinkItem}>
              <Ionicons name="logo-github" size={18} color={Colors.textSecondary} />
              <Text style={styles.footerLinkText}>GitHub</Text>
            </Pressable>
            <Pressable style={styles.footerLinkItem}>
              <Ionicons name="layers-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.footerLinkText}>SDKs</Text>
            </Pressable>
            <Pressable style={styles.footerLinkItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.footerLinkText}>Status</Text>
            </Pressable>
            <Pressable style={styles.footerLinkItem}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.footerLinkText}>Community</Text>
            </Pressable>
          </View>
        </View>
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
  catsScroll: { flexGrow: 0 },
  catsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row", alignItems: "center" },
  allChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  allChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  allChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  allChipTextSelected: { color: Colors.white },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  catChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  catChipTextSelected: { color: Colors.white },
  catCount: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  catCountSelected: { backgroundColor: "rgba(255,255,255,0.25)" },
  catCountText: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.primary },
  catCountTextSelected: { color: Colors.white },
  articleCard: {
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
  articleTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  categoryChip: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  categoryChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  readTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  articleTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 6, lineHeight: 22 },
  articleSummary: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  articleFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  helpfulRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  helpfulCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  apiSection: { marginTop: 16 },
  apiTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 12 },
  apiGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  apiCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  apiIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  apiCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text },
  apiCardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 17 },
  apiCardLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  apiCardLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  footerLinkItem: { alignItems: "center", gap: 6 },
  footerLinkText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
});

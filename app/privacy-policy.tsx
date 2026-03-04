import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function PrivacyPolicy() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Privacy Policy",
          headerTitleStyle: {
            fontFamily: "Inter_700Bold",
            fontSize: 16,
          },
          headerStyle: {
            backgroundColor: Colors.white,
          },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Last Updated: October 2023</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information from you when you register on our site, place an order, subscribe to our newsletter, respond to a survey or fill out a form. Any data we request that is not required will be specified as voluntary or optional.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of Your Information</Text>
        <Text style={styles.paragraph}>
          Any of the information we collect from you may be used in one of the following ways:
          {"\n"}- To personalize your experience
          {"\n"}- To improve our app
          {"\n"}- To improve customer service
          {"\n"}- To process transactions
        </Text>

        <Text style={styles.sectionTitle}>3. Protection of Information</Text>
        <Text style={styles.paragraph}>
          We implement a variety of security measures to maintain the safety of your personal information when you submit a request or enter, submit, or access your personal information.
        </Text>

        <Text style={styles.sectionTitle}>4. Information Disclosure</Text>
        <Text style={styles.paragraph}>
          We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our application, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});

const SKY_BLUE = "#0EA5E9";
const ORANGE = "#F97316";
const WHITE = "#FFFFFF";

export const Colors = {
  primary: SKY_BLUE,
  accent: ORANGE,
  white: WHITE,
  background: "#F0F9FF",
  cardBg: "#FFFFFF",
  surface: "#E0F2FE",
  border: "#BAE6FD",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  urgentBg: "#FEF2F2",
  urgentText: "#DC2626",
  highBg: "#FFF7ED",
  highText: "#EA580C",
  mediumBg: "#FEFCE8",
  mediumText: "#CA8A04",
  lowBg: "#F0FDF4",
  lowText: "#16A34A",
  agentColor: "#7C3AED",
  customerColor: SKY_BLUE,
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: Colors.textMuted,
    tabIconSelected: Colors.primary,
  },
};

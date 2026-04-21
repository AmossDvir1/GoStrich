import { View, Text, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { darkMode, setDarkMode } = useAppStore();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: c.textPrimary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          App preferences
        </Text>

        <View style={styles.group}>
          {/* Dark mode */}
          <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View>
              <Text style={[styles.rowLabel, { color: c.textPrimary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.rowSub, { color: c.textSecondary }]}>
                {darkMode ? "On" : "Off — following system"}
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Unit system */}
          <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View>
              <Text style={[styles.rowLabel, { color: c.textPrimary }]}>
                Unit System
              </Text>
              <Text style={[styles.rowSub, { color: c.textSecondary }]}>
                Metric (km)
              </Text>
            </View>
          </View>

          {/* Map style */}
          <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View>
              <Text style={[styles.rowLabel, { color: c.textPrimary }]}>
                Map Style
              </Text>
              <Text style={[styles.rowSub, { color: c.textSecondary }]}>
                Standard
              </Text>
            </View>
          </View>
        </View>

        {/* App info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.textSecondary }]}>
            GoStrich v1.0.0
          </Text>
          <Text style={[styles.footerSub, { color: c.border }]}>
            100% Offline-First
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 24 },
  group: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13, marginTop: 2 },
  footer: { marginTop: "auto", alignItems: "center", paddingBottom: 16 },
  footerText: { fontSize: 13 },
  footerSub: { fontSize: 11, marginTop: 4 },
});

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { ScrollView, Text, View } from "react-native";

/**
 * Font Testing Screen
 *
 * To test fonts:
 *  npm run start:koho      # Test KoHo
 *  npm run start:montserrat # Test Montserrat (default)
 *
 * Then navigate to this screen to see all font weights and sizes
 */

const WEIGHTS = ["300", "400", "500", "600", "700"] as const;
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32] as const;

export default function FontTestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 8,
          }}
        >
          Font Testing
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
          Current font: {process.env.ACTIVE_FONT?.toUpperCase() || "MONTSERRAT"}
        </Text>
      </View>

      {/* Font Weights */}
      <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Font Weights
        </Text>
        {WEIGHTS.map((weight) => (
          <View key={weight} style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 16,
                // @ts-ignore - fontWeight can be a string
                fontWeight: weight,
                color: colors.text,
                marginBottom: 4,
              }}
            >
              Weight {weight}: The quick brown fox jumps
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv
              Ww Xx Yy Zz
            </Text>
          </View>
        ))}
      </View>

      {/* Font Sizes */}
      <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Font Sizes
        </Text>
        {SIZES.map((size) => (
          <View key={size} style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: size,
                fontWeight: "500",
                color: colors.text,
              }}
            >
              Size {size}px: The quick brown fox
            </Text>
          </View>
        ))}
      </View>

      {/* Real Content Examples */}
      <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Component Examples
        </Text>

        {/* Button-like text */}
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.primary,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            Start Run
          </Text>
        </View>

        {/* Card title */}
        <View
          style={{
            padding: 12,
            backgroundColor: colors.surface,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            Evening Run
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            6.2 km • 45 minutes
          </Text>
        </View>

        {/* Small caption */}
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            fontWeight: "400",
          }}
        >
          Last updated 2 hours ago
        </Text>
      </View>
    </ScrollView>
  );
}

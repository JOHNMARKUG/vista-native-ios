import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, spacing } from '../lib/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  onPress?: () => void;
};

/**
 * Home-screen service tile — half-width in a 2-column grid. Icon top-left,
 * name + description below, a small gold "go" arrow top-right.
 */
export default function ServiceCard({ icon, label, sublabel, onPress }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          flexBasis: '48%',
          flexGrow: 1,
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: spacing.md,
          opacity: pressed ? 0.9 : 1,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.card,
            backgroundColor: colors.navy,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={22} color="#FFFFFF" />
        </View>
        <Ionicons name="arrow-forward-circle" size={22} color={colors.gold} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>{sublabel}</Text>
    </Pressable>
  );
}

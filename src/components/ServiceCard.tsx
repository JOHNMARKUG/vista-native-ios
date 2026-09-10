import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeInDown } from 'react-native-reanimated';
import AnimatedPressable from './AnimatedPressable';
import { colors, radius, shadows, spacing } from '../lib/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  onPress?: () => void;
  /** Position in its grid, purely to stagger the entrance animation. */
  index?: number;
  /** Short corner tag, e.g. "New" or "Soon" — omit for the common case. */
  badge?: string;
};

/**
 * Home-screen service tile — half-width in a 2-column grid. Icon top-left,
 * name + description below, a small gold "go" arrow top-right.
 */
export default function ServiceCard({ icon, label, sublabel, onPress, index = 0, badge }: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      entering={FadeInDown.delay(index * 60).springify().damping(16)}
      style={[
        {
          flexBasis: '48%',
          flexGrow: 1,
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: spacing.md,
        },
        shadows.card,
      ]}
    >
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: -8,
            right: spacing.md,
            backgroundColor: colors.gold,
            borderRadius: radius.tag,
            paddingVertical: 3,
            paddingHorizontal: 8,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.navy, letterSpacing: 0.3 }}>{badge}</Text>
        </View>
      )}
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
    </AnimatedPressable>
  );
}

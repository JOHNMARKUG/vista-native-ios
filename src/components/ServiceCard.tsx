import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows } from '../lib/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  badge?: string;
  accent?: boolean;
  onPress?: () => void;
};

export default function ServiceCard({ icon, label, sublabel, badge, accent, onPress }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 14,
          paddingHorizontal: 8,
          alignItems: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        },
        shadows.card,
      ]}
    >
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: accent ? colors.gold : colors.navy,
            borderRadius: radius.tag,
            paddingVertical: 3,
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: '700', color: accent ? colors.navy : '#FFFFFF', letterSpacing: 0.4 }}>
            {badge}
          </Text>
        </View>
      ) : null}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.control,
          backgroundColor: accent ? colors.gold : colors.navy,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={22} color={accent ? colors.navy : '#F2F2F7'} />
      </View>
      <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', lineHeight: 15 }}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center' }} numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

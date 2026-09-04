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
          borderRadius: radius.card - 2,
          paddingVertical: 14,
          paddingHorizontal: 8,
          alignItems: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        },
        shadows.subtle,
      ]}
    >
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: accent ? colors.gold : colors.navy,
            borderRadius: 8,
            borderTopRightRadius: 14,
            paddingVertical: 3,
            paddingHorizontal: 7,
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: '800', color: accent ? colors.navy : '#FFFFFF', letterSpacing: 0.4 }}>
            {badge}
          </Text>
        </View>
      ) : null}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
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

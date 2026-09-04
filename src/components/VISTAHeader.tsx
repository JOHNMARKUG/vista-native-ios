import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';

type Props = {
  title: string;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  transparent?: boolean;
};

export default function VISTAHeader({ title, onBack, rightLabel, onRightPress, transparent }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={80}
      tint="light"
      style={{
        paddingTop: insets.top,
        borderBottomWidth: transparent ? 0 : 0.5,
        borderBottomColor: '#E3E3E8',
        backgroundColor: transparent ? 'transparent' : 'rgba(242,242,247,0.86)',
      }}
    >
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
        }}
      >
        <View style={{ width: 70, flexDirection: 'row', alignItems: 'center' }}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.navy} />
            </Pressable>
          ) : null}
        </View>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 70, alignItems: 'flex-end' }}>
          {rightLabel ? (
            <Pressable onPress={onRightPress} hitSlop={12} style={{ paddingVertical: 8, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 15, color: colors.navy, fontWeight: '500' }}>{rightLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </BlurView>
  );
}

// Android has no native blur parity; force opaque there for legibility.
export const HEADER_BG = Platform.OS === 'android' ? colors.background : undefined;

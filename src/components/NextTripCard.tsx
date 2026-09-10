import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeInDown } from 'react-native-reanimated';
import AnimatedPressable from './AnimatedPressable';
import StatusBadge, { type BookingStatus } from './StatusBadge';
import { colors, radius, spacing } from '../lib/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  reference: string;
  status: BookingStatus;
  onPress: () => void;
};

/** The one thing on Home that's actually yours rather than generic — an
 * active or upcoming trip, surfaced the moment you land on the app instead
 * of buried a tab away. Mirrors how Apple Wallet leads with your next pass. */
export default function NextTripCard({ icon, title, reference, status, onPress }: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      entering={FadeInDown.springify().damping(18)}
      style={{
        backgroundColor: colors.navy,
        borderRadius: radius.card,
        padding: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.gold, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Your Next Trip
        </Text>
        <StatusBadge status={status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.card,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={22} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{reference}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
      </View>
    </AnimatedPressable>
  );
}

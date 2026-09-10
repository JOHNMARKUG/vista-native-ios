import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeInDown } from 'react-native-reanimated';
import AnimatedPressable from './AnimatedPressable';
import { colors, radius, shadows } from '../lib/theme';
import StatusBadge, { type BookingStatus } from './StatusBadge';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  reference: string;
  title: string;
  pickup: string;
  dropoff?: string;
  date?: string;
  time?: string;
  status: BookingStatus;
  priceLabel?: string;
  driverAssigned?: boolean;
  onPress?: () => void;
  /** Position in its list, purely to stagger the entrance animation. */
  index?: number;
};

export default function BookingCard({
  icon = 'car-outline',
  reference,
  title,
  pickup,
  dropoff,
  date,
  time,
  status,
  priceLabel,
  driverAssigned,
  onPress,
  index = 0,
}: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: 16,
          gap: 10,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.input,
              backgroundColor: colors.navy,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 }}>
              {reference}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy }}>{title}</Text>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={{ gap: 5 }}>
        <Row icon="location" color={colors.gold} text={pickup} />
        {dropoff ? <Row icon="location" color={colors.navy} text={dropoff} /> : null}
        {date || time ? (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {date ? <Row icon="calendar-outline" color={colors.textSecondary} text={date} small /> : null}
            {time ? <Row icon="time-outline" color={colors.textSecondary} text={time} small /> : null}
          </View>
        ) : null}
      </View>

      {(driverAssigned || priceLabel) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 8,
          }}
        >
          {driverAssigned ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#E7ECFB',
                borderRadius: radius.tag,
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}
            >
              <Ionicons name="car" size={12} color={colors.navy} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.navy }}>Driver Assigned</Text>
            </View>
          ) : (
            <View />
          )}
          {priceLabel ? (
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy }}>{priceLabel}</Text>
          ) : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

function Row({
  icon,
  color,
  text,
  small,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  text: string;
  small?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={small ? 12 : 13} color={color} />
      <Text
        style={{ fontSize: small ? 12 : 12.5, color: colors.textSecondary, flexShrink: 1 }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

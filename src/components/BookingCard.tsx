import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../lib/theme';
import StatusBadge, { type BookingStatus } from './StatusBadge';

type Props = {
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
};

export default function BookingCard({
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
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          gap: 10,
          opacity: pressed ? 0.9 : 1,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 }}>
            {reference}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy }}>{title}</Text>
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
            borderTopColor: colors.background,
            paddingTop: 8,
          }}
        >
          {driverAssigned ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderWidth: 1,
                borderColor: colors.navy,
                borderRadius: radius.tag,
                paddingVertical: 3,
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
    </Pressable>
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

import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import AnimatedPressable from './AnimatedPressable';
import { colors, radius, shadows, spacing } from '../lib/theme';

export type ChurchEvent = {
  id: string;
  title: string;
  location: string | null;
  event_date: string;
  event_time: string | null;
};

type Props = {
  events: ChurchEvent[];
  onPressEvent: (event: ChurchEvent) => void;
};

/** A horizontal-scroll row so Home has something that moves and refreshes
 * over time, instead of going quiet after the service grid — reuses the
 * same events data already fetched for the Alerts screen. */
export default function UpcomingEventsRow({ events, onPressEvent }: Props) {
  if (events.length === 0) return null;

  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: spacing.sm,
        }}
      >
        Upcoming Events
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}
      >
        {events.map((event, index) => {
          const date = new Date(event.event_date);
          return (
            <AnimatedPressable
              key={event.id}
              onPress={() => onPressEvent(event)}
              entering={FadeInDown.delay(index * 80).springify().damping(18)}
              style={[
                {
                  width: 200,
                  backgroundColor: colors.card,
                  borderRadius: radius.card,
                  padding: spacing.md,
                },
                shadows.card,
              ]}
            >
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.navy,
                  borderRadius: radius.tag,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{date.getDate()}</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gold }}>
                  {date.toLocaleDateString('en', { month: 'short' }).toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.navy, marginBottom: 4 }} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                {event.location ?? 'Temple Mount'}
                {event.event_time ? ` · ${event.event_time}` : ''}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

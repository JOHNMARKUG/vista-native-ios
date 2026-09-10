import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AlertsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import VISTAButton from '../../components/VISTAButton';
import { colors, radius, shadows, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<AlertsStackParamList, 'Alerts'>;

type Notification = {
  id: string;
  type: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type ChurchEvent = {
  id: string;
  title: string;
  location: string | null;
  event_date: string;
  event_time: string | null;
};

const ICON_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  booking_confirmed: { icon: 'checkmark-circle', color: colors.success, bg: 'rgba(52,199,89,0.1)' },
  driver_assigned: { icon: 'car', color: colors.navy, bg: 'rgba(27,46,107,0.08)' },
  booking_cancelled: { icon: 'information-circle', color: colors.error, bg: 'rgba(255,59,48,0.1)' },
  event: { icon: 'calendar', color: colors.gold, bg: 'rgba(200,146,42,0.1)' },
};
const DEFAULT_ICON = { icon: 'notifications' as const, color: colors.navy, bg: 'rgba(27,46,107,0.1)' };

function formatTime(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function AlertsScreen({ navigation }: Props) {
  const { user, isGuest, exitGuestMode } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [user]);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(3);
    setEvents((data as ChurchEvent[]) ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchEvents();
    }, [fetchNotifications, fetchEvents])
  );

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`alerts-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (user) await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={{ fontSize: 15, color: colors.navy, fontWeight: '500' }}>Mark all read</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, unreadCount, markAllRead]);

  return (
    <ScrollView
      style={{ backgroundColor: '#FFFFFF' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl }}
    >
      {events.length > 0 && (
        <View style={{ backgroundColor: colors.navy, borderRadius: radius.card, padding: 16, marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Upcoming Events</Text>
          {events.map((event) => {
            const date = new Date(event.event_date);
            return (
              <View key={event.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.input, padding: 12, marginBottom: 8 }}>
                <View style={{ backgroundColor: colors.gold, borderRadius: radius.tag, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.navy }}>{date.getDate()}</Text>
                  <Text style={{ fontSize: 9, color: colors.navy, fontWeight: '600' }}>
                    {date.toLocaleDateString('en', { month: 'short' })}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{event.title}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                    {event.location ?? 'Temple Mount'} · {event.event_time ?? ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {!user && !loading ? (
        <View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.md }}>
          <Ionicons name="notifications-outline" size={40} color={colors.textSecondary} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.navy }}>Sign in to see alerts</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
            We'll notify you here about booking updates, driver assignments and offers.
          </Text>
          <VISTAButton title="Sign In" variant="accent" fullWidth={false} onPress={exitGuestMode} />
        </View>
      ) : !loading && notifications.length === 0 ? (
        <View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.md }}>
          <Ionicons name="notifications-outline" size={40} color={colors.textSecondary} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.navy }}>No alerts yet</Text>
        </View>
      ) : (
        notifications.map((notif) => {
          const cfg = ICON_CONFIG[notif.type ?? ''] ?? DEFAULT_ICON;
          return (
            <Pressable
              key={notif.id}
              onPress={() => markAsRead(notif.id)}
              style={[
                {
                  flexDirection: 'row',
                  gap: 12,
                  backgroundColor: colors.card,
                  borderRadius: radius.card,
                  padding: 14,
                },
                shadows.card,
              ]}
            >
              <View style={{ width: 44, height: 44, borderRadius: radius.card, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: notif.is_read ? '500' : '700', color: colors.navy, marginBottom: 4 }}>
                  {notif.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 6 }}>{notif.message}</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatTime(notif.created_at)}</Text>
              </View>
              {!notif.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginTop: 4 }} />}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

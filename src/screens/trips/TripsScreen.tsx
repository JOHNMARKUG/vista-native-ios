import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TripsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import BookingCard from '../../components/BookingCard';
import SegmentedControl from '../../components/SegmentedControl';
import VISTAButton from '../../components/VISTAButton';
import type { BookingStatus } from '../../components/StatusBadge';
import { ACTIVE_STATUSES, RIDE_ICONS, RIDE_LABELS, SERVICE_ICONS, SERVICE_LABELS } from '../../lib/tripCatalog';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<TripsStackParamList, 'Trips'>;

type Booking = {
  id: string;
  booking_ref: string;
  service_type: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  status: BookingStatus;
  driver_id: string | null;
  amount_usd: number;
  created_at: string;
};

type VistaRide = {
  id: string;
  booking_ref: string;
  status: BookingStatus;
  pickup_address: string;
  dropoff_address: string;
  ride_type: string;
  total_ugx: number;
  driver_id: string | null;
  created_at: string;
};

type Trip =
  | { source: 'booking'; data: Booking }
  | { source: 'ride'; data: VistaRide };

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function TripsScreen({ navigation }: Props) {
  const { user, isGuest, exitGuestMode } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rides, setRides] = useState<VistaRide[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const [{ data: bookingsData }, { data: ridesData }] = await Promise.all([
      supabase.from('bookings').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }),
      supabase
        .from('vista_rides')
        .select('id, booking_ref, status, pickup_address, dropoff_address, ride_type, total_ugx, driver_id, created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setBookings((bookingsData as Booking[]) ?? []);
    setRides((ridesData as VistaRide[]) ?? []);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`customer-trips-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `customer_id=eq.${user.id}` }, fetchAll)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vista_rides', filter: `customer_id=eq.${user.id}` }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const trips = useMemo<Trip[]>(() => {
    const merged: Trip[] = [
      ...rides.map((data): Trip => ({ source: 'ride', data })),
      ...bookings.map((data): Trip => ({ source: 'booking', data })),
    ];
    merged.sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());
    if (tab === 'all') return merged;
    if (tab === 'completed') return merged.filter((t) => t.data.status === 'completed');
    return merged.filter((t) => ACTIVE_STATUSES.includes(t.data.status));
  }, [bookings, rides, tab]);

  if (isGuest && !user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.navy }}>Sign in to view your trips</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
          Sign in to see your booking history and track active rides.
        </Text>
        <VISTAButton title="Sign In" variant="accent" fullWidth={false} onPress={exitGuestMode} />
      </View>
    );
  }

  const arrivedBooking = bookings.find((b) => b.status === 'driver_arrived');

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ padding: spacing.md, paddingBottom: spacing.sm }}>
        <SegmentedControl segments={TABS} value={tab} onChange={setTab} />
      </View>

      {arrivedBooking && (
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
          <VISTAButton
            title="Your driver has arrived — tap to view"
            variant="primary"
            onPress={() => navigation.navigate('TripDetail', { id: arrivedBooking.id, source: 'booking' })}
          />
        </View>
      )}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        {loading ? null : trips.length === 0 ? (
          <View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.md }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.navy }}>No trips yet</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
              Your bookings will appear here once you book transport.
            </Text>
          </View>
        ) : (
          trips.map((trip, index) =>
            trip.source === 'ride' ? (
              <BookingCard
                key={trip.data.id}
                index={index}
                icon={RIDE_ICONS[trip.data.ride_type] ?? 'car-outline'}
                reference={trip.data.booking_ref}
                title={RIDE_LABELS[trip.data.ride_type] ?? 'VISTA Ride'}
                pickup={trip.data.pickup_address}
                dropoff={trip.data.dropoff_address}
                status={trip.data.status}
                priceLabel={`UGX ${trip.data.total_ugx?.toLocaleString()}`}
                driverAssigned={!!trip.data.driver_id}
                onPress={() => navigation.navigate('TripDetail', { id: trip.data.id, source: 'ride' })}
              />
            ) : (
              <BookingCard
                key={trip.data.id}
                index={index}
                icon={SERVICE_ICONS[trip.data.service_type] ?? 'car-outline'}
                reference={trip.data.booking_ref}
                title={SERVICE_LABELS[trip.data.service_type] ?? trip.data.service_type}
                pickup={trip.data.pickup_location}
                dropoff={trip.data.dropoff_location}
                date={trip.data.pickup_date}
                time={trip.data.pickup_time}
                status={trip.data.status}
                priceLabel={`USD ${trip.data.amount_usd}`}
                driverAssigned={!!trip.data.driver_id}
                onPress={() => navigation.navigate('TripDetail', { id: trip.data.id, source: 'booking' })}
              />
            )
          )
        )}
      </ScrollView>
    </View>
  );
}

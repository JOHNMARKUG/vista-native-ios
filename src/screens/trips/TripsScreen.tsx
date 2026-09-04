import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TripsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import BookingCard from '../../components/BookingCard';
import VISTAButton from '../../components/VISTAButton';
import type { BookingStatus } from '../../components/StatusBadge';
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

const SERVICE_LABELS: Record<string, string> = {
  airport_pickup: 'Airport Pickup',
  airport_departure: 'Airport Departure',
  ministry_transport: 'Ministry Transport',
  group_convoy: 'Group Convoy',
  city_transfer: 'City Transfer',
  vip: 'VIP Service',
  crusade: 'Crusade Transport',
  conference: 'Conference Transport',
};

const RIDE_LABELS: Record<string, string> = {
  boda: 'VISTA Ride — Boda Boda',
  standard: 'VISTA Ride — Car',
  premium: 'VISTA Ride — SUV',
  intercity: 'VISTA Ride — Intercity',
  hourly_standard: 'Hourly Hire — Standard',
  hourly_premium: 'Hourly Hire — Premium',
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'pending', label: 'Pending' },
  { key: 'driver_assigned', label: 'Assigned' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function TripsScreen({ navigation }: Props) {
  const { user, isGuest, exitGuestMode } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rides, setRides] = useState<VistaRide[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    let bookingsQuery = supabase.from('bookings').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
    if (filter !== 'all') bookingsQuery = bookingsQuery.eq('status', filter);

    const [{ data: bookingsData }, { data: ridesData }] = await Promise.all([
      bookingsQuery,
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
  }, [user, filter]);

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

  if (isGuest && !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <Header count={0} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.navy }}>Sign in to view your trips</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
            Sign in to see your booking history and track active rides.
          </Text>
          <VISTAButton title="Sign In" variant="accent" fullWidth={false} onPress={exitGuestMode} />
        </View>
      </SafeAreaView>
    );
  }

  const arrivedBooking = bookings.find((b) => b.status === 'driver_arrived');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header count={bookings.length + rides.length} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8, paddingVertical: spacing.sm }}>
        {FILTERS.map((f) => (
          <Text
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: filter === f.key ? '#FFFFFF' : colors.textSecondary,
              backgroundColor: filter === f.key ? colors.gold : colors.card,
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 16,
              overflow: 'hidden',
            }}
          >
            {f.label}
          </Text>
        ))}
      </ScrollView>

      {arrivedBooking && (
        <VISTAButton
          title="Your driver has arrived — tap to view"
          variant="primary"
          onPress={() => navigation.navigate('TripDetail', { id: arrivedBooking.id, source: 'booking' })}
        />
      )}

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        {loading ? null : bookings.length === 0 && rides.length === 0 ? (
          <View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.md }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.navy }}>No trips yet</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
              Your bookings will appear here once you book transport.
            </Text>
          </View>
        ) : (
          <>
            {rides.map((r) => (
              <BookingCard
                key={r.id}
                reference={r.booking_ref}
                title={RIDE_LABELS[r.ride_type] ?? 'VISTA Ride'}
                pickup={r.pickup_address}
                dropoff={r.dropoff_address}
                status={r.status}
                priceLabel={`UGX ${r.total_ugx?.toLocaleString()}`}
                driverAssigned={!!r.driver_id}
                onPress={() => navigation.navigate('TripDetail', { id: r.id, source: 'ride' })}
              />
            ))}
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                reference={b.booking_ref}
                title={SERVICE_LABELS[b.service_type] ?? b.service_type}
                pickup={b.pickup_location}
                dropoff={b.dropoff_location}
                date={b.pickup_date}
                time={b.pickup_time}
                status={b.status}
                priceLabel={`USD ${b.amount_usd}`}
                driverAssigned={!!b.driver_id}
                onPress={() => navigation.navigate('TripDetail', { id: b.id, source: 'booking' })}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ count }: { count: number }) {
  return (
    <View style={{ backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>My Trips</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gold }}>{count} bookings</Text>
      </View>
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Your complete booking history</Text>
    </View>
  );
}

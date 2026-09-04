import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TripsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { awardPoints } from '../../lib/points';
import VISTAButton from '../../components/VISTAButton';
import VISTACard from '../../components/VISTACard';
import StatusBadge, { type BookingStatus } from '../../components/StatusBadge';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<TripsStackParamList, 'TripDetail'>;

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  plate_number: string;
  rating: number | null;
  total_trips: number | null;
};

const ACTIVE_STATUSES = ['driver_assigned', 'en_route', 'driver_arrived', 'arrived', 'confirmed', 'in_progress'];

export default function TripDetailScreen({ route, navigation }: Props) {
  const { id, source } = route.params;
  const { user } = useAuth();
  const table = source === 'booking' ? 'bookings' : 'vista_rides';

  const [trip, setTrip] = useState<Record<string, any> | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchTrip = useCallback(async () => {
    const { data } = await supabase.from(table).select('*').eq('id', id).single();
    setTrip(data);
    if (data?.driver_id) {
      const { data: d } = await supabase
        .from('drivers')
        .select('id, full_name, phone, vehicle_make, vehicle_model, vehicle_color, plate_number, rating, total_trips')
        .eq('id', data.driver_id)
        .single();
      setDriver(d as Driver);
    }
  }, [id, table]);

  useFocusEffect(
    useCallback(() => {
      fetchTrip();
    }, [fetchTrip])
  );

  useEffect(() => {
    const channel = supabase
      .channel(`trip-detail-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `id=eq.${id}` }, fetchTrip)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, table, fetchTrip]);

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />
    );
  }

  const status: BookingStatus = trip.status;
  const pickup = source === 'booking' ? trip.pickup_location : trip.pickup_address;
  const dropoff = source === 'booking' ? trip.dropoff_location : trip.dropoff_address;
  const isActive = ACTIVE_STATUSES.includes(status);

  const handleCancel = () => {
    Alert.alert('Cancel trip', 'Are you sure you want to cancel this trip?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          await supabase.from(table).update({ status: 'cancelled' }).eq('id', id);
          setCancelling(false);
          fetchTrip();
        },
      },
    ]);
  };

  const handleRate = async (stars: number) => {
    setRating(stars);
    setSubmittingRating(true);
    await supabase.from('bookings').update({ customer_rating: stars }).eq('id', id).eq('customer_id', user?.id);
    setSubmittingRating(false);
    if (user?.id) awardPoints(user.id, 25, 'rating', `Rated driver for booking ${trip.booking_ref}`, trip.booking_ref);
    fetchTrip();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.gold }}>{trip.booking_ref}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy, marginBottom: 8 }}>
            {source === 'booking' ? trip.service_type?.replace(/_/g, ' ') : trip.ride_type?.replace(/_/g, ' ')}
          </Text>
          <StatusBadge status={status} />
        </View>

        {isActive && (
          <VISTAButton
            title="Track this trip live"
            variant="primary"
            icon={<Ionicons name="navigate" size={16} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Tracking', { id, source })}
          />
        )}

        {driver && (
          <VISTACard style={{ backgroundColor: colors.navy }}>
            <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Your Driver
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF' }}>{driver.full_name?.[0]}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>{driver.full_name}</Text>
                {driver.rating != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={{ fontSize: 12, color: colors.gold, fontWeight: '700' }}>
                      {Number(driver.rating).toFixed(1)} ({driver.total_trips ?? 0} trips)
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                {driver.vehicle_color} {driver.vehicle_make} {driver.vehicle_model}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>Plate: {driver.plate_number}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <VISTAButton title="Call" variant="outline" onPress={() => Linking.openURL(`tel:${driver.phone}`)} />
              <VISTAButton
                title="WhatsApp"
                variant="accent"
                onPress={() => Linking.openURL(`https://wa.me/${driver.phone.replace(/\D/g, '')}`)}
              />
            </View>
          </VISTACard>
        )}

        <VISTACard style={{ gap: 10 }}>
          <DetailRow icon="location" color={colors.gold} label="Pickup" value={pickup} />
          <DetailRow icon="location" color={colors.navy} label="Drop-off" value={dropoff} />
          {trip.pickup_date && <DetailRow icon="calendar-outline" color={colors.textSecondary} label="Date" value={trip.pickup_date} />}
          {trip.pickup_time && <DetailRow icon="time-outline" color={colors.textSecondary} label="Time" value={trip.pickup_time} />}
        </VISTACard>

        {status === 'completed' && source === 'booking' && !trip.customer_rating && (
          <VISTACard>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy, marginBottom: 10 }}>Rate this trip</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => handleRate(star)} disabled={submittingRating}>
                  <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={30} color={colors.gold} />
                </Pressable>
              ))}
            </View>
          </VISTACard>
        )}

        {['pending', 'scheduled', 'confirmed', 'searching'].includes(status) && (
          <VISTAButton title={cancelling ? 'Cancelling...' : 'Cancel Trip'} variant="outline" loading={cancelling} onPress={handleCancel} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, color, label, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ fontSize: 12, color: colors.textSecondary, width: 60 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{value}</Text>
    </View>
  );
}

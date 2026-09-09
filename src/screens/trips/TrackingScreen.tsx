import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TripsStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<TripsStackParamList, 'Tracking'>;

type DriverLocation = {
  id: string;
  full_name: string;
  current_latitude: number | null;
  current_longitude: number | null;
  is_online: boolean;
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function TrackingScreen({ route, navigation }: Props) {
  const { id, source } = route.params;
  const table = source === 'booking' ? 'bookings' : 'vista_rides';

  const [driver, setDriver] = useState<DriverLocation | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let driverChannel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: trip } = await supabase.from(table).select('*').eq('id', id).single();
      if (!trip?.driver_id) return;

      const pickupLat = source === 'booking' ? trip.pickup_lat : trip.pickup_lat;
      const pickupLng = source === 'booking' ? trip.pickup_lng : trip.pickup_lng;
      if (pickupLat && pickupLng) setPickupCoords({ lat: pickupLat, lng: pickupLng });
      else if (trip.pickup_location || trip.pickup_address) {
        const geocoded = await Location.geocodeAsync(trip.pickup_location ?? trip.pickup_address);
        if (geocoded[0]) setPickupCoords({ lat: geocoded[0].latitude, lng: geocoded[0].longitude });
      }

      const fetchDriver = async () => {
        const { data } = await supabase
          .from('drivers')
          .select('id, full_name, current_latitude, current_longitude, is_online')
          .eq('id', trip.driver_id)
          .single();
        setDriver(data as DriverLocation);
      };
      await fetchDriver();

      driverChannel = supabase
        .channel(`driver-location-${trip.driver_id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `id=eq.${trip.driver_id}` }, fetchDriver)
        .subscribe();
    };

    init();
    return () => {
      if (driverChannel) supabase.removeChannel(driverChannel);
    };
  }, [id, table, source]);

  const etaMinutes = useMemo(() => {
    if (!driver?.current_latitude || !driver?.current_longitude || !pickupCoords) return null;
    const km = haversineKm({ lat: driver.current_latitude, lng: driver.current_longitude }, pickupCoords) * 1.3;
    return Math.max(1, Math.round((km / 30) * 60));
  }, [driver, pickupCoords]);

  const hasDriverLocation = driver?.current_latitude && driver?.current_longitude && driver.is_online;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>Live Tracking</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={{ flex: 1, margin: spacing.md, borderRadius: 8, overflow: 'hidden' }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: pickupCoords?.lat ?? driver?.current_latitude ?? 0.3476,
            longitude: pickupCoords?.lng ?? driver?.current_longitude ?? 32.5825,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {pickupCoords && <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }} pinColor={colors.gold} title="Pickup" />}
          {hasDriverLocation && (
            <Marker
              coordinate={{ latitude: driver!.current_latitude!, longitude: driver!.current_longitude! }}
              pinColor={colors.navy}
              title={driver?.full_name ?? 'Driver'}
            />
          )}
          {hasDriverLocation && pickupCoords && (
            <Polyline
              coordinates={[
                { latitude: driver!.current_latitude!, longitude: driver!.current_longitude! },
                { latitude: pickupCoords.lat, longitude: pickupCoords.lng },
              ]}
              strokeColor={colors.navy}
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      <View style={{ padding: spacing.md }}>
        {hasDriverLocation ? (
          <View style={{ backgroundColor: colors.card, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="car" size={26} color={colors.navy} />
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.navy }}>Your driver is on the way</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.navy }}>
                {etaMinutes != null ? `Arriving in ~${etaMinutes} min` : 'Calculating arrival time...'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.card, borderRadius: 8, padding: 16 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Waiting for your driver's live location to come online.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

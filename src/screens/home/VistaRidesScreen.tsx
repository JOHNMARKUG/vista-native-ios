import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlatformMap from '../../components/PlatformMap';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { HomeStackParamList, RootTabParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useHideTabBar } from '../../hooks/useHideTabBar';
import { supabase } from '../../lib/supabase';
import { usePricing } from '../../lib/usePricing';
import VISTAButton from '../../components/VISTAButton';
import VISTACard from '../../components/VISTACard';
import LocationSearchSheet, { type LocationSearchSheetRef } from '../../components/LocationSearchSheet';
import BookingSuccess from '../../components/BookingSuccess';
import { PAYMENT_METHODS, paymentKeyFromLabel, type PaymentMethodKey } from '../../lib/paymentMethods';
import { colors, radius, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'VistaRides'>;
type VehicleKey = 'boda' | 'standard' | 'premium' | 'intercity';
type Coords = { lat: number; lng: number };

const VEHICLES: {
  key: VehicleKey;
  iconFamily: 'ionicons' | 'mci';
  icon: string;
  label: string;
  sub: string;
  maxPax: number;
}[] = [
  { key: 'boda', iconFamily: 'mci', icon: 'motorbike', label: 'Boda Boda', sub: 'Fast motorcycle taxi', maxPax: 1 },
  { key: 'standard', iconFamily: 'ionicons', icon: 'car-outline', label: 'Car — Standard', sub: '1–4 passengers', maxPax: 4 },
  { key: 'premium', iconFamily: 'ionicons', icon: 'car-sport-outline', label: 'Car — Premium', sub: 'SUV or Executive', maxPax: 6 },
  { key: 'intercity', iconFamily: 'ionicons', icon: 'trail-sign-outline', label: 'Intercity', sub: 'Any Uganda city', maxPax: 4 },
];

function haversineKm(a: Coords, b: Coords) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 1.3; // road-distance fudge factor
}

function genRideRef() {
  return `VR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export default function VistaRidesScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const prices = usePricing();

  const [vehicle, setVehicle] = useState<VehicleKey>('standard');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coords | null>(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const [femaleDriver, setFemaleDriver] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethodKey>(() => paymentKeyFromLabel(profile?.preferred_payment_method));
  const [submitting, setSubmitting] = useState(false);
  const [bookedRef, setBookedRef] = useState<string | null>(null);

  const sheetRef = useRef<BottomSheetModal>(null);
  const locationSheetRef = useRef<LocationSearchSheetRef>(null);
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff' | null>(null);

  useHideTabBar(navigation);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !bookedRef });
  }, [navigation, bookedRef]);

  const vehiclePricing = useMemo(() => {
    const map: Record<VehicleKey, { base: number; perKm: number; min: number }> = {
      boda: { base: prices.vista_boda_base, perKm: prices.vista_boda_per_km, min: prices.vista_boda_min },
      standard: { base: prices.vista_std_base, perKm: prices.vista_std_per_km, min: prices.vista_std_min },
      premium: { base: prices.vista_prem_base, perKm: prices.vista_prem_per_km, min: prices.vista_prem_min },
      intercity: { base: prices.vista_inter_base, perKm: prices.vista_inter_per_km, min: prices.vista_inter_min },
    };
    return map[vehicle];
  }, [vehicle, prices]);

  const distanceKm = pickupCoords && dropoffCoords ? haversineKm(pickupCoords, dropoffCoords) : 0;
  const distanceFare = Math.round(distanceKm * vehiclePricing.perKm);
  const totalUgx = Math.max(vehiclePricing.base + distanceFare, vehiclePricing.min);
  const totalUsd = Math.round((totalUgx / prices.ugx_rate) * 100) / 100;
  const durationMinutes = distanceKm > 0 ? Math.round((distanceKm / 30) * 60) : 0; // ~30km/h urban average

  const useCurrentLocation = async () => {
    setLocatingMe(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Enable location access to auto-fill your pickup point.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPickupCoords(coords);
      const [place] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
      setPickup(place ? [place.street, place.district ?? place.city].filter(Boolean).join(', ') : 'Current location');
    } catch {
      Alert.alert('Could not get your location', 'Please type your pickup address instead.');
    } finally {
      setLocatingMe(false);
    }
  };

  const geocode = useCallback(async (address: string): Promise<Coords | null> => {
    try {
      const results = await Location.geocodeAsync(address);
      return results[0] ? { lat: results[0].latitude, lng: results[0].longitude } : null;
    } catch {
      return null;
    }
  }, []);

  const openPaymentSheet = () => sheetRef.current?.present();

  const openPickupSearch = () => {
    setActiveField('pickup');
    locationSheetRef.current?.present(pickup);
  };
  const openDropoffSearch = () => {
    setActiveField('dropoff');
    locationSheetRef.current?.present(dropoff);
  };

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to book a ride.');
      return;
    }
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('Missing details', 'Please enter both pickup and drop-off locations.');
      return;
    }
    setSubmitting(true);
    try {
      const pCoords = pickupCoords ?? (await geocode(pickup));
      const dCoords = dropoffCoords ?? (await geocode(dropoff));

      const bookingRef = genRideRef();
      const isCash = payMethod === 'cash';
      const rideStatus = isCash ? 'searching' : 'pending_payment';

      const { data, error } = await supabase
        .from('vista_rides')
        .insert({
          booking_ref: bookingRef,
          customer_id: user.id,
          pickup_address: pickup.trim(),
          pickup_lat: pCoords?.lat ?? null,
          pickup_lng: pCoords?.lng ?? null,
          dropoff_address: dropoff.trim(),
          dropoff_lat: dCoords?.lat ?? null,
          dropoff_lng: dCoords?.lng ?? null,
          distance_km: Math.round(distanceKm * 10) / 10,
          duration_minutes: durationMinutes,
          base_fare: vehiclePricing.base,
          per_km_rate: vehiclePricing.perKm,
          distance_fare: distanceFare,
          total_ugx: totalUgx,
          total_usd: totalUsd,
          ride_type: vehicle,
          vehicle_type: vehicle === 'boda' ? 'boda' : 'car',
          female_driver_requested: femaleDriver,
          status: rideStatus,
          payment_status: isCash ? 'cash' : 'unpaid',
        })
        .select('*')
        .single();

      if (error) throw error;

      supabase.functions
        .invoke('notify-driver', {
          body: { ride_id: data.id, pickup: pickup.trim(), dropoff: dropoff.trim(), total_ugx: totalUgx, vehicle_type: vehicle === 'boda' ? 'boda' : 'car' },
        })
        .catch(() => {});

      if (!isCash) {
        // Note: pesapal-initiate persists pesapal_transaction_id against the
        // `bookings` table only (matches the existing web app's behavior for
        // VISTA Rides too) — the redirect still works, reconciliation of the
        // transaction id back onto vista_rides is a backend follow-up.
        const { data: pesapal } = await supabase.functions.invoke('pesapal-initiate', {
          body: {
            booking_id: data.id,
            booking_ref: bookingRef,
            amount_usd: totalUsd,
            service_name: 'VISTA Ride',
            passenger_name: '',
            passenger_phone: '',
          },
        });
        if (pesapal?.redirect_url) {
          navigation.navigate('WebPage', { url: pesapal.redirect_url, title: 'Complete Payment' });
        }
      }

      setBookedRef(bookingRef);
    } catch (err) {
      Alert.alert('Could not book ride', (err as Error).message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPaymentLabel = PAYMENT_METHODS.find((p) => p.key === payMethod)?.label ?? 'Choose payment';

  if (bookedRef) {
    return (
      <BookingSuccess
        title="Ride requested!"
        message="We're matching you with a nearby driver — track live progress from My Trips."
        reference={bookedRef}
        onDone={() => {
          navigation.goBack();
          navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()?.navigate('TripsTab');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
      <View style={{ height: 200, marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: radius.card, overflow: 'hidden' }}>
        <PlatformMap
          style={{ flex: 1 }}
          initialRegion={{
            latitude: pickupCoords?.lat ?? 0.3476,
            longitude: pickupCoords?.lng ?? 32.5825, // Kampala
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          region={
            pickupCoords
              ? { latitude: pickupCoords.lat, longitude: pickupCoords.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
              : undefined
          }
          markers={[
            ...(pickupCoords ? [{ id: 'pickup', latitude: pickupCoords.lat, longitude: pickupCoords.lng, pinColor: colors.gold, title: 'Pickup' }] : []),
            ...(dropoffCoords ? [{ id: 'dropoff', latitude: dropoffCoords.lat, longitude: dropoffCoords.lng, pinColor: colors.navy, title: 'Drop-off' }] : []),
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <VISTACard style={{ gap: spacing.sm }}>
          <Pressable onPress={openPickupSearch} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="radio-button-on" size={16} color={colors.gold} />
            <Text
              style={{ flex: 1, fontSize: 15, color: pickup ? colors.textPrimary : colors.textSecondary }}
              numberOfLines={1}
            >
              {pickup || 'Pickup location'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={useCurrentLocation} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="locate" size={14} color={colors.navy} />
            <Text style={{ fontSize: 12, color: colors.navy, fontWeight: '600' }}>
              {locatingMe ? 'Finding you…' : 'Use my current location'}
            </Text>
          </Pressable>
          <Pressable onPress={openDropoffSearch} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="location" size={16} color={colors.navy} />
            <Text
              style={{ flex: 1, fontSize: 15, color: dropoff ? colors.textPrimary : colors.textSecondary }}
              numberOfLines={1}
            >
              {dropoff || 'Drop-off location'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        </VISTACard>

        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
          Choose a vehicle
        </Text>
        {VEHICLES.map((v) => (
          <Pressable key={v.key} onPress={() => setVehicle(v.key)}>
            <VISTACard style={vehicle === v.key ? { borderWidth: 2, borderColor: colors.navy } : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, alignItems: 'center' }}>
                  {v.iconFamily === 'mci' ? (
                    <MaterialCommunityIcons name={v.icon as any} size={26} color={colors.navy} />
                  ) : (
                    <Ionicons name={v.icon as any} size={26} color={colors.navy} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy }}>{v.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{v.sub}</Text>
                </View>
                {vehicle === v.key ? <Ionicons name="checkmark-circle" size={22} color={colors.navy} /> : null}
              </View>
            </VISTACard>
          </Pressable>
        ))}

        {vehicle !== 'boda' && (
          <Pressable
            onPress={() => setFemaleDriver((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 14, color: colors.textPrimary }}>Request a female driver</Text>
            <Ionicons name={femaleDriver ? 'toggle' : 'toggle-outline'} size={30} color={femaleDriver ? colors.gold : '#C7C7CC'} />
          </Pressable>
        )}

        <Pressable onPress={openPaymentSheet}>
          <VISTACard>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Payment method</Text>
                <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: '600' }}>{selectedPaymentLabel}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, color: colors.navy, fontWeight: '600' }}>Change</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.navy} />
              </View>
            </View>
          </VISTACard>
        </Pressable>

        <VISTACard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Estimated fare</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.navy }}>
              UGX {totalUgx.toLocaleString()}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
            ≈ USD {totalUsd} · confirmed once a driver accepts
          </Text>
        </VISTACard>
      </ScrollView>

      <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <VISTAButton
          title={submitting ? 'Requesting...' : `Request Ride — UGX ${totalUgx.toLocaleString()}`}
          variant="accent"
          loading={submitting}
          onPress={handleConfirm}
        />
      </View>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={['40%']}
        backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />}
      >
        <BottomSheetView style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: spacing.sm }}>
            Payment method
          </Text>
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => {
                setPayMethod(m.key);
                sheetRef.current?.dismiss();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
            >
              <Ionicons name={m.icon} size={20} color={colors.navy} />
              <Text style={{ fontSize: 15, color: colors.textPrimary, flex: 1 }}>{m.label}</Text>
              {payMethod === m.key ? <Ionicons name="checkmark" size={18} color={colors.navy} /> : null}
            </Pressable>
          ))}
        </BottomSheetView>
      </BottomSheetModal>

      <LocationSearchSheet
        ref={locationSheetRef}
        title={activeField === 'dropoff' ? 'Drop-off Location' : 'Pickup Location'}
        onSelect={({ description, coords }) => {
          if (activeField === 'dropoff') {
            setDropoff(description);
            setDropoffCoords(coords);
          } else {
            setPickup(description);
            setPickupCoords(coords);
          }
        }}
      />
    </SafeAreaView>
  );
}

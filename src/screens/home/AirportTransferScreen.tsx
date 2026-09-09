import React, { useMemo, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePricing } from '../../lib/usePricing';
import VISTAButton from '../../components/VISTAButton';
import VISTAInputComp from '../../components/VISTAInput';
import VISTACardComp from '../../components/VISTACard';
import { colors, spacing } from '../../lib/theme';

const PAYMENT_METHODS = [
  { key: 'mtn', label: 'MTN Mobile Money', icon: 'phone-portrait-outline' },
  { key: 'airtel', label: 'Airtel Money', icon: 'phone-portrait-outline' },
  { key: 'card', label: 'Visa / Mastercard', icon: 'card-outline' },
  { key: 'cash', label: 'Cash to Driver', icon: 'cash-outline' },
] as const;

type Props = NativeStackScreenProps<HomeStackParamList, 'AirportTransfer'>;
type Direction = 'airport_pickup' | 'airport_departure';

function genBookingRef() {
  return 'VST-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default function AirportTransferScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const prices = usePricing();

  const [direction, setDirection] = useState<Direction>('airport_pickup');
  const [pickup, setPickup] = useState('Entebbe International Airport');
  const [dropoff, setDropoff] = useState('');
  const [mode, setMode] = useState<'now' | 'later'>('later');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [payMethod, setPayMethod] = useState<(typeof PAYMENT_METHODS)[number]['key']>('cash');
  const [submitting, setSubmitting] = useState(false);

  const sheetRef = useRef<BottomSheetModal>(null);

  const pricing = useMemo(() => {
    const basePerPax = direction === 'airport_pickup' ? prices.airport_pickup : prices.airport_departure;
    const baseTotal = basePerPax * passengers;
    const platformFee = Math.round(baseTotal * (prices.platform_fee / 100));
    const totalAmount = baseTotal + platformFee;
    const totalUgx = totalAmount * prices.ugx_rate;
    const driverEarnings = Math.round(baseTotal * 0.85);
    return { basePerPax, baseTotal, platformFee, totalAmount, totalUgx, driverEarnings };
  }, [direction, passengers, prices]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to book airport transfer.');
      return;
    }
    if (!dropoff.trim() && direction === 'airport_pickup') {
      Alert.alert('Missing details', 'Please enter your drop-off location.');
      return;
    }
    if (!name.trim() || phone.replace(/\D/g, '').length < 7) {
      Alert.alert('Missing details', 'Please enter your name and a valid phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: active } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_id', user.id)
        .in('status', ['driver_assigned', 'confirmed', 'en_route', 'driver_arrived'])
        .limit(1);
      if (active && active.length > 0) {
        Alert.alert('Active booking in progress', 'Check My Trips — you already have a booking underway.');
        setSubmitting(false);
        return;
      }

      const bookingRef = genBookingRef();
      const pickupLocation = direction === 'airport_pickup' ? pickup : pickup || 'Your hotel/residence';
      const dropoffLocation = direction === 'airport_pickup' ? dropoff : 'Entebbe International Airport';
      const bookingDate = mode === 'now' ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
      const bookingTime =
        mode === 'now'
          ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
          : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          booking_ref: bookingRef,
          customer_id: user.id,
          service_type: direction,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          pickup_date: bookingDate,
          pickup_time: bookingTime,
          passengers,
          payment_method: payMethod,
          special_requests: notes.trim() || null,
          flight_number: flightNumber.trim().toUpperCase() || null,
          amount_usd: pricing.totalAmount,
          amount_ugx: pricing.totalUgx,
          platform_fee: pricing.platformFee,
          driver_earnings: pricing.driverEarnings,
          passenger_name: name.trim(),
          passenger_phone: phone.trim(),
          status: mode === 'now' ? 'pending' : 'scheduled',
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: mode === 'now' ? 'Booking Received' : 'Ride Scheduled',
        message:
          mode === 'now'
            ? `Your airport transfer (${bookingRef}) has been received. Our team will assign a verified driver shortly.`
            : `Your airport transfer (${bookingRef}) is scheduled for ${bookingDate} at ${bookingTime}.`,
      });

      if (payMethod !== 'cash') {
        const { data: pesapal } = await supabase.functions.invoke('pesapal-initiate', {
          body: {
            booking_id: booking.id,
            booking_ref: bookingRef,
            amount_usd: pricing.totalAmount,
            service_name: direction === 'airport_pickup' ? 'Airport Pickup' : 'Airport Departure',
            passenger_name: name.trim(),
            passenger_phone: phone.trim(),
          },
        });
        if (pesapal?.redirect_url) {
          Linking.openURL(pesapal.redirect_url);
          setSubmitting(false);
          return;
        }
      }

      Alert.alert('Booking confirmed', `Reference ${bookingRef}`, [
        { text: 'View my trips', onPress: () => navigation.getParent()?.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Could not submit booking', (err as Error).message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPaymentLabel = PAYMENT_METHODS.find((p) => p.key === payMethod)?.label ?? 'Choose payment';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>Airport Transfer</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <DirectionTab label="Airport Pickup" active={direction === 'airport_pickup'} onPress={() => setDirection('airport_pickup')} />
          <DirectionTab label="Airport Departure" active={direction === 'airport_departure'} onPress={() => setDirection('airport_departure')} />
        </View>

        <VISTACardComp style={{ gap: spacing.sm }}>
          <VISTAInputComp label="Pickup" value={pickup} onChangeText={setPickup} editable={direction === 'airport_departure'} />
          <VISTAInputComp
            label="Drop-off"
            value={direction === 'airport_pickup' ? dropoff : 'Entebbe International Airport'}
            onChangeText={setDropoff}
            editable={direction === 'airport_pickup'}
          />
        </VISTACardComp>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <DirectionTab label="Book for now" active={mode === 'now'} onPress={() => setMode('now')} />
          <DirectionTab label="Schedule" active={mode === 'later'} onPress={() => setMode('later')} />
        </View>
        {mode === 'later' && (
          <Pressable onPress={() => setShowDatePicker(true)}>
            <VISTACardComp>
              <Text style={{ fontSize: 16, color: colors.textPrimary }}>{date.toLocaleString()}</Text>
            </VISTACardComp>
          </Pressable>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            minimumDate={new Date()}
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}

        <VISTAInputComp label="Flight number (optional)" placeholder="e.g. KQ412" value={flightNumber} onChangeText={setFlightNumber} autoCapitalize="characters" />
        <VISTAInputComp
          label="Passengers"
          value={String(passengers)}
          onChangeText={(v) => setPassengers(Math.max(1, parseInt(v.replace(/\D/g, ''), 10) || 1))}
          keyboardType="number-pad"
        />
        <VISTAInputComp label="Your name" value={name} onChangeText={setName} autoComplete="name" />
        <VISTAInputComp label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <VISTAInputComp label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

        <Pressable onPress={() => sheetRef.current?.present()}>
          <VISTACardComp>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '600' }}>{selectedPaymentLabel}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </VISTACardComp>
        </Pressable>

        <VISTACardComp style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Base fare × {passengers}</Text>
            <Text style={{ fontSize: 13, color: colors.textPrimary }}>USD {pricing.baseTotal}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Platform fee</Text>
            <Text style={{ fontSize: 13, color: colors.textPrimary }}>USD {pricing.platformFee}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.background, marginTop: 4, paddingTop: 6 }}>
            <Text style={{ fontWeight: '700', color: colors.navy }}>Total</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: colors.navy }}>USD {pricing.totalAmount}</Text>
          </View>
        </VISTACardComp>
      </ScrollView>

      <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <VISTAButton
          title={submitting ? 'Booking...' : `Confirm — USD ${pricing.totalAmount}`}
          variant="accent"
          loading={submitting}
          onPress={handleSubmit}
        />
      </View>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={['40%']}
        backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />}
      >
        <BottomSheetView style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: spacing.sm }}>Payment method</Text>
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
    </SafeAreaView>
  );
}

function DirectionTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: active ? colors.navy : colors.border,
        alignItems: 'center',
        backgroundColor: active ? colors.navy : colors.card,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : colors.textSecondary }}>{label}</Text>
    </Pressable>
  );
}

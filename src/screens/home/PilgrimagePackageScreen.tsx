import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { awardPoints } from '../../lib/points';
import {
  buildSchedule,
  calcCustomPrice,
  genBookingRef,
  PACKAGE_TIERS,
  type PackageTierKey,
} from '../../lib/pilgrimSchedule';
import VISTAButton from '../../components/VISTAButton';
import VISTACard from '../../components/VISTACard';
import VISTAInput from '../../components/VISTAInput';
import BookingSuccess from '../../components/BookingSuccess';
import { colors, radius, spacing } from '../../lib/theme';

type Hotel = { id: string; name: string; area?: string | null };
type Props = NativeStackScreenProps<HomeStackParamList, 'PilgrimagePackage'>;

const TOTAL_STEPS = 5;

export default function PilgrimagePackageScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookedRef, setBookedRef] = useState<string | null>(null);

  // Step 1 — arrival
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

  // Step 2 — tier
  const [tier, setTier] = useState<PackageTierKey | null>(null);
  const [customDeparture, setCustomDeparture] = useState<Date | null>(null);
  const [showDepartureDatePicker, setShowDepartureDatePicker] = useState(false);

  // Step 3 — hotel
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [usingOwnHotel, setUsingOwnHotel] = useState(false);
  const [ownHotelName, setOwnHotelName] = useState('');

  // Step 4 — traveler info
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [whatsapp, setWhatsapp] = useState(profile?.phone ?? '');
  const [groupSize, setGroupSize] = useState(1);
  const [specialNeeds, setSpecialNeeds] = useState('');

  useEffect(() => {
    supabase
      .from('recommended_hotels')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setHotels((data as Hotel[]) ?? []));
  }, []);

  const toISO = (d: Date) => d.toISOString().split('T')[0];

  const departureDateISO = useMemo(() => {
    if (!arrivalDate) return '';
    if (tier === 'custom') return customDeparture ? toISO(customDeparture) : '';
    const days = tier === 'extended' ? PACKAGE_TIERS.extended.days : PACKAGE_TIERS.standard.days;
    const d = new Date(arrivalDate);
    d.setDate(d.getDate() + (days - 1));
    return toISO(d);
  }, [arrivalDate, tier, customDeparture]);

  const durationDays = useMemo(() => {
    if (!arrivalDate || !departureDateISO) return 0;
    return Math.round((new Date(departureDateISO).getTime() - arrivalDate.getTime()) / 86400000) + 1;
  }, [arrivalDate, departureDateISO]);

  const totalUsd = useMemo(() => {
    if (tier === 'standard') return PACKAGE_TIERS.standard.price;
    if (tier === 'extended') return PACKAGE_TIERS.extended.price;
    if (tier === 'custom') return calcCustomPrice(durationDays).total;
    return 0;
  }, [tier, durationDays]);

  const hotelName = usingOwnHotel ? ownHotelName : hotels.find((h) => h.id === selectedHotelId)?.name ?? '';

  const schedule = useMemo(
    () => (arrivalDate && departureDateISO ? buildSchedule(toISO(arrivalDate), departureDateISO, arrivalTime) : []),
    [arrivalDate, departureDateISO, arrivalTime]
  );

  const canNext = () => {
    if (step === 1) return !!arrivalDate;
    if (step === 2) return tier === 'standard' || tier === 'extended' || (tier === 'custom' && !!customDeparture);
    if (step === 3) return usingOwnHotel ? ownHotelName.trim().length > 1 : !!selectedHotelId;
    if (step === 4) return fullName.trim().length > 1 && whatsapp.trim().length > 6;
    return true;
  };

  const back = () => {
    if (step === 1) navigation.goBack();
    else setStep((s) => s - 1);
  };
  const next = () => canNext() && setStep((s) => Math.min(TOTAL_STEPS, s + 1));

  // The native header's back button and swipe gesture would otherwise leave
  // the whole booking flow instead of stepping back one page — override
  // headerLeft to call this wizard's own `back()`, and only allow the swipe
  // gesture to exit the screen on step 1 (where "back" already means that).
  useLayoutEffect(() => {
    if (bookedRef) {
      navigation.setOptions({ headerShown: false, gestureEnabled: false });
      return;
    }
    navigation.setOptions({
      headerShown: true,
      title: `Step ${step} of ${TOTAL_STEPS}`,
      gestureEnabled: step === 1,
      headerLeft: () => (
        <Pressable onPress={back} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, step, bookedRef]);

  const handlePay = async () => {
    if (!user || !arrivalDate) return;
    setSubmitting(true);
    try {
      const bookingRef = genBookingRef();
      const driverBaseEarnings = Math.round(totalUsd * 0.85 * 100) / 100;
      const driverHoldback = Math.round(driverBaseEarnings * 0.2 * 100) / 100;
      const extraDays = tier === 'custom' ? calcCustomPrice(durationDays).extraDays : 0;

      const packageData = {
        booking_ref: bookingRef,
        customer_id: user.id,
        passenger_name: fullName.trim(),
        passenger_phone: whatsapp.trim(),
        passenger_email: user.email ?? null,
        group_size: groupSize,
        special_needs: specialNeeds.trim() || null,
        arrival_date: toISO(arrivalDate),
        departure_date: departureDateISO,
        flight_number: flightNumber.trim() || null,
        arrival_time: arrivalTime || null,
        hotel_name: hotelName,
        hotel_is_suggested: !usingOwnHotel,
        duration_days: durationDays,
        total_usd: totalUsd,
        extra_days: extraDays,
        extra_days_cost: extraDays * PACKAGE_TIERS.custom.perExtraDay,
        status: 'pending',
        payment_status: 'unpaid',
        driver_base_earnings: driverBaseEarnings,
        driver_holdback: driverHoldback,
        schedule,
      };

      const { data, error } = await supabase.from('pilgrim_packages').insert(packageData).select().single();
      if (error) throw error;

      awardPoints(user.id, 500, 'pilgrimage', `Pilgrimage package ${data.booking_ref}`, data.booking_ref).catch(() => {});
      supabase.functions
        .invoke('notify-admin-pilgrimage', {
          body: {
            booking_ref: data.booking_ref,
            passenger_name: fullName.trim(),
            passenger_phone: whatsapp.trim(),
            arrival_date: toISO(arrivalDate),
            departure_date: departureDateISO,
            duration_days: durationDays,
            group_size: groupSize,
          },
        })
        .catch(() => {});

      setBookedRef(bookingRef);
    } catch (err) {
      Alert.alert('Could not submit booking', (err as Error).message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (bookedRef) {
    return (
      <BookingSuccess
        title="Package booked!"
        message="Our team will confirm your payment details by WhatsApp shortly."
        reference={bookedRef}
        onDone={() => navigation.getParent()?.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <>
            <Text style={styles.title}>When do you arrive?</Text>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <VISTACard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="calendar" size={20} color={colors.gold} />
                  <Text style={{ fontSize: 17, color: colors.textPrimary }}>
                    {arrivalDate ? arrivalDate.toDateString() : 'Select arrival date'}
                  </Text>
                </View>
              </VISTACard>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={arrivalDate ?? new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setArrivalDate(date);
                }}
              />
            )}
            <VISTAInput label="Flight number (optional)" placeholder="e.g. KQ412" value={flightNumber} onChangeText={setFlightNumber} autoCapitalize="characters" />
            <VISTAInput label="Arrival time (optional)" placeholder="e.g. 14:30" value={arrivalTime} onChangeText={setArrivalTime} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>Choose your package</Text>
            <TierCard
              tierKey="standard"
              selected={tier === 'standard'}
              title={PACKAGE_TIERS.standard.label}
              subtitle={PACKAGE_TIERS.standard.subtitle}
              price={PACKAGE_TIERS.standard.price}
              badge="MOST POPULAR"
              onPress={() => setTier('standard')}
            />
            <TierCard
              tierKey="extended"
              selected={tier === 'extended'}
              title={PACKAGE_TIERS.extended.label}
              subtitle={PACKAGE_TIERS.extended.subtitle}
              price={PACKAGE_TIERS.extended.price}
              onPress={() => setTier('extended')}
            />
            <TierCard
              tierKey="custom"
              selected={tier === 'custom'}
              title={PACKAGE_TIERS.custom.label}
              subtitle={PACKAGE_TIERS.custom.subtitle}
              onPress={() => setTier('custom')}
            />
            {tier === 'custom' && (
              <Pressable onPress={() => setShowDepartureDatePicker(true)}>
                <VISTACard>
                  <Text style={{ fontSize: 17, color: colors.textPrimary }}>
                    {customDeparture ? `Departs ${customDeparture.toDateString()}` : 'Select departure date'}
                  </Text>
                </VISTACard>
              </Pressable>
            )}
            {showDepartureDatePicker && (
              <DateTimePicker
                value={customDeparture ?? arrivalDate ?? new Date()}
                mode="date"
                minimumDate={arrivalDate ?? new Date()}
                onChange={(_, date) => {
                  setShowDepartureDatePicker(false);
                  if (date) setCustomDeparture(date);
                }}
              />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.title}>Where will you stay?</Text>
            {hotels.map((hotel) => (
              <Pressable key={hotel.id} onPress={() => { setSelectedHotelId(hotel.id); setUsingOwnHotel(false); }}>
                <VISTACard style={selectedHotelId === hotel.id && !usingOwnHotel ? { borderWidth: 2, borderColor: colors.navy } : undefined}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{hotel.name}</Text>
                  {hotel.area ? <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{hotel.area}</Text> : null}
                </VISTACard>
              </Pressable>
            ))}
            <Pressable onPress={() => setUsingOwnHotel(true)}>
              <VISTACard style={usingOwnHotel ? { borderWidth: 2, borderColor: colors.navy } : undefined}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>I already have a hotel</Text>
              </VISTACard>
            </Pressable>
            {usingOwnHotel && (
              <VISTAInput placeholder="Hotel name" value={ownHotelName} onChangeText={setOwnHotelName} />
            )}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.title}>Traveler details</Text>
            <VISTAInput label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
            <VISTAInput label="WhatsApp number" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
            <VISTAInput
              label="Group size"
              value={String(groupSize)}
              onChangeText={(v) => setGroupSize(Math.max(1, parseInt(v.replace(/\D/g, ''), 10) || 1))}
              keyboardType="number-pad"
            />
            <VISTAInput label="Special needs (optional)" value={specialNeeds} onChangeText={setSpecialNeeds} multiline />
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.title}>Review your trip</Text>
            <VISTACard style={{ gap: 8 }}>
              <SummaryRow label="Arrival" value={arrivalDate?.toDateString() ?? '—'} />
              <SummaryRow label="Departure" value={departureDateISO || '—'} />
              <SummaryRow label="Duration" value={`${durationDays} days`} />
              <SummaryRow label="Hotel" value={hotelName || '—'} />
              <SummaryRow label="Group size" value={String(groupSize)} />
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', color: colors.navy }}>Total</Text>
                <Text style={{ fontWeight: '800', fontSize: 18, color: colors.navy }}>USD {totalUsd}</Text>
              </View>
            </VISTACard>

            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm }}>
              Day-by-day schedule
            </Text>
            {schedule.map((day) => (
              <VISTACard key={day.date}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>{day.dateLabel}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy, marginBottom: 6 }}>{day.label}</Text>
                {day.items.map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <Ionicons name={item.icon} size={14} color={colors.textSecondary} style={{ marginTop: 1 }} />
                    <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 }}>{item.text}</Text>
                  </View>
                ))}
              </VISTACard>
            ))}
          </>
        )}
      </ScrollView>

      <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: '#E3E3E8' }}>
        <VISTAButton
          title={step === TOTAL_STEPS ? (submitting ? 'Submitting...' : `Confirm — USD ${totalUsd}`) : 'Continue'}
          variant="accent"
          loading={submitting}
          disabled={step === TOTAL_STEPS ? submitting : !canNext()}
          onPress={step === TOTAL_STEPS ? handlePay : next}
        />
      </View>
    </SafeAreaView>
  );
}

function TierCard({
  selected,
  title,
  subtitle,
  price,
  badge,
  onPress,
}: {
  tierKey: PackageTierKey;
  selected: boolean;
  title: string;
  subtitle: string;
  price?: number;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <VISTACard style={selected ? { borderWidth: 2, borderColor: colors.navy } : undefined}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            {badge ? (
              <View style={{ alignSelf: 'flex-start', backgroundColor: colors.navy, borderRadius: radius.tag, paddingVertical: 2, paddingHorizontal: 6, marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.4 }}>{badge}</Text>
              </View>
            ) : null}
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.navy }}>{title}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
          </View>
          {price ? <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy }}>${price}</Text> : null}
        </View>
      </VISTACard>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const styles = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.navy },
};

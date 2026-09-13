import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;

// HERE's Autosuggest requires one of `at` / `in=bbox` / `in=circle` / `in=ring`
// — there's no plain country-code filter. A generous circle around Kampala
// covers Uganda's operating area without needing per-region tuning.
const UGANDA_BIAS = 'circle:0.3476,32.5825;r=300000';

export type PlaceCoords = { lat: number; lng: number };
type Field = 'pickup' | 'dropoff';
type Prediction = { id: string; title: string; sub: string; lat: number; lng: number };

export type LocationSearchSheetRef = {
  present: (params: { field: Field; pickup: string; dropoff: string }) => void;
};

type Props = {
  onSelect: (field: Field, place: { description: string; coords: PlaceCoords }) => void;
  onUseCurrentLocation: () => void;
};

async function fetchPredictions(query: string): Promise<Prediction[]> {
  if (query.trim().length < 3 || !HERE_API_KEY) return [];
  const url =
    `https://autosuggest.search.hereapi.com/v1/autosuggest` +
    `?q=${encodeURIComponent(query)}&in=${UGANDA_BIAS}&limit=8&apiKey=${HERE_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return (json.items ?? [])
    .filter((item: any) => item.position && typeof item.position.lat === 'number')
    .map((item: any) => {
      const label: string = item.address?.label ?? item.title ?? '';
      const [first, ...rest] = label.split(',');
      return {
        id: item.id,
        title: (item.title ?? first ?? label).trim(),
        sub: rest.join(',').trim(),
        lat: item.position.lat,
        lng: item.position.lng,
      };
    });
}

/**
 * A dedicated full-screen Pickup & Drop-off page, styled after the
 * ride-hailing pattern used across East Africa (SafeBoda, Uber): both
 * fields visible together with a connecting dot/line, the active field
 * editable, results as a plain list below.
 *
 * Earlier this was an inline dropdown, then a BottomSheetModal — both put
 * the results list in a partial-height container fighting the keyboard and
 * the screen behind it for space. A full native Modal takes over the whole
 * screen, so there's nothing left for either to fight.
 */
const LocationSearchSheet = forwardRef<LocationSearchSheetRef, Props>(function LocationSearchSheet(
  { onSelect, onUseCurrentLocation },
  ref
) {
  const [visible, setVisible] = useState(false);
  const [field, setField] = useState<Field>('pickup');
  const [pickupValue, setPickupValue] = useState('');
  const [dropoffValue, setDropoffValue] = useState('');
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const pickupInputRef = useRef<TextInput>(null);
  const dropoffInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    present: ({ field: initialField, pickup, dropoff }) => {
      setPickupValue(pickup);
      setDropoffValue(dropoff);
      setField(initialField);
      setQuery(initialField === 'pickup' ? pickup : dropoff);
      setPredictions([]);
      setVisible(true);
      setTimeout(() => (initialField === 'pickup' ? pickupInputRef : dropoffInputRef).current?.focus(), 400);
    },
  }));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!visible) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setPredictions(await fetchPredictions(query));
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible]);

  const switchField = (next: Field) => {
    if (next === field) return;
    setField(next);
    setQuery(next === 'pickup' ? pickupValue : dropoffValue);
    setPredictions([]);
    setTimeout(() => (next === 'pickup' ? pickupInputRef : dropoffInputRef).current?.focus(), 50);
  };

  const close = () => setVisible(false);

  const select = (p: Prediction) => {
    const description = p.sub ? `${p.title}, ${p.sub}` : p.title;
    onSelect(field, { description, coords: { lat: p.lat, lng: p.lng } });
    if (field === 'pickup') {
      setPickupValue(description);
      switchField('dropoff');
    } else {
      setDropoffValue(description);
      close();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Pressable onPress={close} hitSlop={12} style={{ width: 32 }}>
              <Ionicons name="chevron-back" size={24} color={colors.navy} />
            </Pressable>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.navy, marginRight: 32 }}>
              Pickup &amp; Drop-off
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 24, alignItems: 'center', paddingTop: 20, paddingBottom: 20 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold }} />
                <View style={{ width: 1, flex: 1, backgroundColor: colors.border, marginVertical: 4 }} />
                <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: colors.navy }} />
              </View>

              <View style={{ flex: 1, gap: spacing.sm }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F2F2F7',
                    borderRadius: radius.input,
                    paddingHorizontal: 12,
                    height: 44,
                    borderWidth: field === 'pickup' ? 1.5 : 0,
                    borderColor: colors.gold,
                  }}
                >
                  {field === 'pickup' ? (
                    <TextInput
                      ref={pickupInputRef}
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Pickup location"
                      placeholderTextColor={colors.textSecondary}
                      style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}
                      returnKeyType="search"
                    />
                  ) : (
                    <Pressable onPress={() => switchField('pickup')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: 15, color: pickupValue ? colors.textPrimary : colors.textSecondary }} numberOfLines={1}>
                        {pickupValue || 'Pickup location'}
                      </Text>
                      <Ionicons name="pencil" size={15} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F2F2F7',
                    borderRadius: radius.input,
                    paddingHorizontal: 12,
                    height: 44,
                    borderWidth: field === 'dropoff' ? 1.5 : 0,
                    borderColor: colors.gold,
                  }}
                >
                  {field === 'dropoff' ? (
                    <TextInput
                      ref={dropoffInputRef}
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Where to?"
                      placeholderTextColor={colors.textSecondary}
                      style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}
                      returnKeyType="search"
                    />
                  ) : (
                    <Pressable onPress={() => switchField('dropoff')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: 15, color: dropoffValue ? colors.textPrimary : colors.textSecondary }} numberOfLines={1}>
                        {dropoffValue || 'Where to?'}
                      </Text>
                    </Pressable>
                  )}
                  {loading && <ActivityIndicator size="small" color={colors.navy} />}
                </View>
              </View>
            </View>

            {field === 'pickup' && (
              <Pressable
                onPress={() => {
                  close();
                  onUseCurrentLocation();
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: spacing.xs, paddingLeft: 24 }}
              >
                <Ionicons name="locate" size={16} color={colors.navy} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.navy }}>Use my current location</Text>
              </Pressable>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <FlatList
            data={predictions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xl }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => select(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!!item.sub && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>
                      {item.sub}
                    </Text>
                  )}
                </View>
                <Ionicons name="arrow-redo-outline" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
            ListEmptyComponent={
              !loading ? (
                <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: spacing.lg }}>
                  {query.trim().length >= 3 ? 'No matches found' : 'Start typing to search'}
                </Text>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
});

export default LocationSearchSheet;

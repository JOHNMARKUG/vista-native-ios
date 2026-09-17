import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;
const HISTORY_KEY = 'vista_location_history_v1';
const MAX_HISTORY = 8;

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
    `?q=${encodeURIComponent(query)}&in=${UGANDA_BIAS}&limit=10&apiKey=${HERE_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return (json.items ?? [])
    .filter((item: any) => item.position && typeof item.position.lat === 'number')
    .filter((item: any) => {
      // The bias circle is wide enough (to cover intercity trips across
      // Uganda) that it spills slightly into Kenya, Rwanda, Tanzania and
      // DRC border areas. HERE's own relevance ranking doesn't know this
      // service only operates in Uganda, so an exact-name match just over
      // the border can outrank the right in-country result. The address
      // label always ends with the country name — use that as a hard
      // filter rather than trying to tune the radius/ranking further.
      const label: string = item.address?.label ?? '';
      const country = label.split(',').pop()?.trim().toLowerCase();
      return country === 'uganda';
    })
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

async function loadHistory(): Promise<Prediction[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: Prediction[]) {
  AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries)).catch(() => {});
}

/**
 * A dedicated full-screen Pickup & Drop-off page, styled after the
 * ride-hailing pattern used across East Africa (SafeBoda, Uber, Faras):
 * both fields visible together with a connecting dot/line, the active
 * field editable, results as a plain list below — recently-used places
 * when the field is empty, live search results once typing starts.
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
  const [history, setHistory] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [geocodingRaw, setGeocodingRaw] = useState(false);
  const pickupInputRef = useRef<TextInput>(null);
  const dropoffInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

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

  const remember = (entry: Prediction) => {
    setHistory((prev) => {
      const deduped = prev.filter((h) => h.title !== entry.title || h.sub !== entry.sub);
      const next = [entry, ...deduped].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  };

  const forgetHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveHistory(next);
      return next;
    });
  };

  const applySelection = (description: string, coords: PlaceCoords, forHistory?: Prediction) => {
    onSelect(field, { description, coords });
    if (forHistory) remember(forHistory);
    if (field === 'pickup') {
      setPickupValue(description);
      switchField('dropoff');
    } else {
      setDropoffValue(description);
      close();
    }
  };

  const select = (p: Prediction) => {
    applySelection(p.sub ? `${p.title}, ${p.sub}` : p.title, { lat: p.lat, lng: p.lng }, p);
  };

  // Search coverage in Uganda isn't complete — a real place someone knows
  // by name can come back with zero results. Without this, that's a dead
  // end: nothing in the list is tappable, so there's no way to book to or
  // from that address at all. Falls back to the device's own geocoder,
  // which draws on a different, sometimes better-populated map dataset.
  const useTypedAddress = async () => {
    setGeocodingRaw(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (!results[0]) {
        Alert.alert('Location not found', "We couldn't place that address on the map. Please try a nearby landmark instead.");
        return;
      }
      const trimmed = query.trim();
      applySelection(trimmed, { lat: results[0].latitude, lng: results[0].longitude }, {
        id: `typed-${Date.now()}`,
        title: trimmed,
        sub: '',
        lat: results[0].latitude,
        lng: results[0].longitude,
      });
    } catch {
      Alert.alert('Location not found', "We couldn't place that address on the map. Please try a nearby landmark instead.");
    } finally {
      setGeocodingRaw(false);
    }
  };

  const isSearching = query.trim().length >= 3;
  const listData = isSearching ? predictions : history;

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
                      placeholder="Where would you like to go?"
                      placeholderTextColor={colors.textSecondary}
                      style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}
                      returnKeyType="search"
                    />
                  ) : (
                    <Pressable onPress={() => switchField('dropoff')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: 15, color: dropoffValue ? colors.textPrimary : colors.textSecondary }} numberOfLines={1}>
                        {dropoffValue || 'Where would you like to go?'}
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

          {!isSearching && history.length > 0 && (
            <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Recent · swipe to remove
              </Text>
            </View>
          )}

          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xl }}
            renderItem={({ item }) => {
              const row = (
                <Pressable
                  onPress={() => select(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    backgroundColor: colors.background,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Ionicons name={isSearching ? 'location-outline' : 'time-outline'} size={18} color={colors.textSecondary} />
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
              );
              if (isSearching) return row;
              return (
                <Swipeable
                  renderRightActions={() => (
                    <Pressable
                      onPress={() => forgetHistoryEntry(item.id)}
                      style={{ backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', width: 72 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 2 }}>Remove</Text>
                    </Pressable>
                  )}
                >
                  {row}
                </Swipeable>
              );
            }}
            ListEmptyComponent={
              !loading ? (
                isSearching ? (
                  <View style={{ marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ textAlign: 'center', color: colors.textSecondary }}>
                      No matches found for "{query.trim()}"
                    </Text>
                    <Pressable
                      onPress={useTypedAddress}
                      disabled={geocodingRaw}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: radius.button,
                        borderWidth: 1,
                        borderColor: colors.navy,
                        opacity: geocodingRaw ? 0.6 : 1,
                      }}
                    >
                      {geocodingRaw ? (
                        <ActivityIndicator size="small" color={colors.navy} />
                      ) : (
                        <Ionicons name="pin-outline" size={16} color={colors.navy} />
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.navy }}>Use this address anyway</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: spacing.lg }}>
                    Start typing to search
                  </Text>
                )
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
});

export default LocationSearchSheet;

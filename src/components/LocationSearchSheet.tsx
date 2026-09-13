import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { colors, radius, spacing } from '../lib/theme';

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;

// HERE's Autosuggest requires one of `at` / `in=bbox` / `in=circle` / `in=ring`
// — there's no plain country-code filter. A generous circle around Kampala
// covers Uganda's operating area without needing per-region tuning.
const UGANDA_BIAS = 'circle:0.3476,32.5825;r=300000';

export type PlaceCoords = { lat: number; lng: number };
type Prediction = { id: string; title: string; lat: number; lng: number };

export type LocationSearchSheetRef = {
  present: (initialValue: string) => void;
};

type Props = {
  title: string;
  onSelect: (place: { description: string; coords: PlaceCoords }) => void;
  onUseCurrentLocation?: () => void;
};

/**
 * A near-full-height search sheet instead of an inline dropdown under the
 * field. The inline version's suggestion list was a plain absolutely
 * positioned View — its zIndex only orders it among its own siblings, so it
 * rendered *underneath* unrelated content further down the screen (the
 * vehicle list) instead of floating above everything. A BottomSheetModal
 * always renders through its own top-level portal, so there's no stacking
 * order to fight — and it matches how Uber/Bolt-style apps handle location
 * search anyway: a dedicated full search moment, not a cramped dropdown.
 */
const LocationSearchSheet = forwardRef<LocationSearchSheetRef, Props>(function LocationSearchSheet(
  { title, onSelect, onUseCurrentLocation },
  ref
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    present: (initialValue: string) => {
      setQuery(initialValue);
      setPredictions([]);
      sheetRef.current?.present();
      setTimeout(() => inputRef.current?.focus(), 300);
    },
  }));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3 || !HERE_API_KEY) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://autosuggest.search.hereapi.com/v1/autosuggest` +
          `?q=${encodeURIComponent(query)}&in=${UGANDA_BIAS}&limit=8&apiKey=${HERE_API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        const items = (json.items ?? [])
          .filter((item: any) => item.position && typeof item.position.lat === 'number')
          .map((item: any) => ({
            id: item.id,
            title: item.address?.label ?? item.title,
            lat: item.position.lat,
            lng: item.position.lng,
          }));
        setPredictions(items);
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const select = (p: Prediction) => {
    sheetRef.current?.dismiss();
    onSelect({ description: p.title, coords: { lat: p.lat, lng: p.lng } });
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['90%']}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />}
      onDismiss={() => setQuery('')}
    >
      <BottomSheetView style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.navy }}>{title}</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#F2F2F7',
            borderRadius: radius.input,
            paddingHorizontal: 12,
            height: 44,
          }}
        >
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a place"
            placeholderTextColor={colors.textSecondary}
            style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}
            returnKeyType="search"
          />
          {loading && <ActivityIndicator size="small" color={colors.navy} />}
        </View>
        {onUseCurrentLocation && (
          <Pressable
            onPress={() => {
              sheetRef.current?.dismiss();
              onUseCurrentLocation();
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }}
          >
            <Ionicons name="locate" size={16} color={colors.navy} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.navy }}>Use my current location</Text>
          </Pressable>
        )}
      </BottomSheetView>
      <BottomSheetFlatList
        data={predictions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => select(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length >= 3 && !loading ? (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: spacing.lg }}>No matches found</Text>
          ) : null
        }
      />
    </BottomSheetModal>
  );
});

export default LocationSearchSheet;

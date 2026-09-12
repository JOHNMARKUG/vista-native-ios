import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import VISTAInput from './VISTAInput';
import { colors, radius, shadows, spacing } from '../lib/theme';

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;

type Prediction = { id: string; title: string; lat: number; lng: number };
export type PlaceCoords = { lat: number; lng: number };

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  editable?: boolean;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: { description: string; coords: PlaceCoords }) => void;
  leftIcon?: React.ReactNode;
};

/**
 * A plain address field degrades to "type it and hope the one-shot geocode
 * at submit time finds it" — no suggestions, no confirmation you picked the
 * right place, and (for VISTA Rides) no distance/price preview until after
 * you've already requested the ride. This adds real place-search
 * autocomplete via HERE Technologies' Autosuggest API (the standard choice
 * for driver/fleet navigation data, not just general web search): pick a
 * suggestion and its coordinates are resolved immediately, so
 * distance-based pricing can update live.
 *
 * Requires EXPO_PUBLIC_HERE_API_KEY. HERE's Autosuggest response includes
 * `position` directly on resolvable results, so unlike Google's
 * Autocomplete+Details flow this needs only one request per keystroke and
 * one per selection isn't needed at all. Suggestions without a `position`
 * (query refinements like "coffee shops near" rather than an actual place)
 * are filtered out — every remaining suggestion is a real, pickable
 * location. If the key is missing or a request fails, this just shows no
 * suggestions — no crash, plain text entry still works.
 */
export default function LocationInput({
  label,
  placeholder,
  value,
  editable = true,
  onChangeText,
  onSelectPlace,
  leftIcon,
}: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!focused || value.trim().length < 3 || !HERE_API_KEY) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://autosuggest.search.hereapi.com/v1/autosuggest` +
          `?q=${encodeURIComponent(value)}&in=countryCode:UGA&limit=6&apiKey=${HERE_API_KEY}`;
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
  }, [value, focused]);

  const selectPrediction = (p: Prediction) => {
    onChangeText(p.title);
    setPredictions([]);
    setFocused(false);
    onSelectPlace({ description: p.title, coords: { lat: p.lat, lng: p.lng } });
  };

  const showDropdown = focused && (loading || predictions.length > 0);

  return (
    <View style={{ position: 'relative', zIndex: focused ? 20 : 1 }}>
      <VISTAInput
        label={label}
        placeholder={placeholder}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        leftIcon={leftIcon}
      />
      {showDropdown && (
        <View
          style={[
            {
              position: 'absolute',
              top: label ? 78 : 56,
              left: 0,
              right: 0,
              backgroundColor: colors.card,
              borderRadius: radius.input,
              paddingVertical: 4,
              zIndex: 30,
            },
            shadows.card,
          ]}
        >
          {loading ? (
            <View style={{ padding: spacing.md, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.navy} />
            </View>
          ) : (
            predictions.map((p) => (
              <Pressable key={p.id} onPress={() => selectPrediction(p)} style={{ paddingVertical: 10, paddingHorizontal: spacing.md }}>
                <Text style={{ fontSize: 14, color: colors.textPrimary }} numberOfLines={2}>
                  {p.title}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

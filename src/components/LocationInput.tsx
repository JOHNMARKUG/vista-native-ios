import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import VISTAInput from './VISTAInput';
import { colors, radius, shadows, spacing } from '../lib/theme';

// Prefer a dedicated Places key (see the long comment below) — falls back to
// the Maps key so this still tries to work if a separate one isn't set up.
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

type Prediction = { place_id: string; description: string };
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
 * you've already requested the ride. This adds real Google Places
 * autocomplete: pick a suggestion and its coordinates are resolved
 * immediately, so distance-based pricing can update live.
 *
 * Requires EXPO_PUBLIC_GOOGLE_PLACES_KEY (preferred) or EXPO_PUBLIC_GOOGLE_MAPS_KEY
 * to be usable for the Places API from a native app (an "iOS apps" /
 * bundle-ID restricted key, or unrestricted —
 * NOT an "HTTP referrers" restricted key, which the Places REST API
 * rejects outright with REQUEST_DENIED since native requests carry no
 * referrer header). If the key can't be used this way, requests just fail
 * silently and the field behaves like a plain text input — no crash, no
 * regression from before this component existed.
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
  const sessionToken = useRef(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!focused || value.trim().length < 3 || !GOOGLE_MAPS_KEY) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${encodeURIComponent(value)}&components=country:ug` +
          `&sessiontoken=${sessionToken.current}&key=${GOOGLE_MAPS_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        setPredictions(json.status === 'OK' ? json.predictions : []);
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

  const selectPrediction = async (p: Prediction) => {
    onChangeText(p.description);
    setPredictions([]);
    setFocused(false);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${p.place_id}&fields=geometry` +
        `&sessiontoken=${sessionToken.current}&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const loc = json.result?.geometry?.location;
      if (loc) onSelectPlace({ description: p.description, coords: { lat: loc.lat, lng: loc.lng } });
    } catch {
      // Text is still filled in — just no coordinates for distance/pricing.
    }
    sessionToken.current = Math.random().toString(36).slice(2);
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
              <Pressable key={p.place_id} onPress={() => selectPrediction(p)} style={{ paddingVertical: 10, paddingHorizontal: spacing.md }}>
                <Text style={{ fontSize: 14, color: colors.textPrimary }} numberOfLines={2}>
                  {p.description}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

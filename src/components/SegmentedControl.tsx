import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../lib/theme';

const TRACK_PADDING = 2;

/** Native iOS UISegmentedControl look-alike — a gray track, sliding white
 * selected segment, no per-segment borders. */
export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const pillWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / segments.length : 0;
  const index = Math.max(0, segments.findIndex((s) => s.key === value));
  const translateX = useSharedValue(index * pillWidth);

  useEffect(() => {
    translateX.value = withSpring(index * pillWidth, { damping: 20, stiffness: 260 });
  }, [index, pillWidth, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 9, padding: TRACK_PADDING }}
    >
      {pillWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: TRACK_PADDING,
              left: TRACK_PADDING,
              bottom: TRACK_PADDING,
              width: pillWidth,
              borderRadius: 7,
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.12,
              shadowRadius: 2,
              elevation: 1,
            },
            pillStyle,
          ]}
        />
      )}
      {segments.map((s) => {
        const active = s.key === value;
        return (
          <Pressable
            key={s.key}
            onPress={() => {
              if (!active) Haptics.selectionAsync().catch(() => {});
              onChange(s.key);
            }}
            style={{ flex: 1, paddingVertical: 6, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: active ? colors.textPrimary : colors.textSecondary }}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

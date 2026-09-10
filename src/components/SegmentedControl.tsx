import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../lib/theme';

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
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 9, padding: 2 }}>
      {segments.map((s) => {
        const active = s.key === value;
        return (
          <Pressable
            key={s.key}
            onPress={() => onChange(s.key)}
            style={{
              flex: 1,
              paddingVertical: 6,
              borderRadius: 7,
              alignItems: 'center',
              backgroundColor: active ? '#FFFFFF' : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: active ? 0.12 : 0,
              shadowRadius: 2,
              elevation: active ? 1 : 0,
            }}
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

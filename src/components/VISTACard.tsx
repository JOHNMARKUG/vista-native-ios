import React from 'react';
import { View, type ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '../lib/theme';

type Props = ViewProps & {
  padded?: boolean;
  elevated?: boolean;
};

export default function VISTACard({ padded = true, elevated = true, style, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: padded ? spacing.md : 0,
        },
        elevated ? shadows.card : shadows.subtle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

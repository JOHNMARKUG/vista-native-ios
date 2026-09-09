import React, { forwardRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../lib/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
};

const VISTAInput = forwardRef<TextInput, Props>(
  ({ label, error, leftIcon, style, onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    const borderColor = error ? colors.error : focused ? colors.navy : colors.border;

    return (
      <View style={{ gap: 6 }}>
        {label ? (
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary }}>
            {label}
          </Text>
        ) : null}
        <View
          style={{
            height: 50,
            borderRadius: 8,
            backgroundColor: colors.card,
            borderWidth: 1.5,
            borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            gap: 8,
          }}
        >
          {leftIcon}
          <TextInput
            ref={ref}
            placeholderTextColor="#9297AA"
            style={[{ flex: 1, fontSize: 17, color: colors.textPrimary, height: '100%' }, style]}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
        </View>
        {error ? (
          <Text style={{ fontSize: 12, color: colors.error }}>{error}</Text>
        ) : null}
      </View>
    );
  }
);

VISTAInput.displayName = 'VISTAInput';
export default VISTAInput;

import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PAYMENT_METHODS, paymentKeyFromLabel } from '../../lib/paymentMethods';
import { colors, radius, shadows, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PaymentMethods'>;

export default function PaymentMethodsScreen({}: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);
  const selectedKey = paymentKeyFromLabel(profile?.preferred_payment_method);

  const selectMethod = async (key: string, label: string) => {
    if (!user || saving) return;
    setSaving(key);
    await supabase.from('profiles').update({ preferred_payment_method: label }).eq('id', user.id);
    await refreshProfile();
    setSaving(null);
  };

  return (
    <ScrollView
      style={{ backgroundColor: '#FFFFFF' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
    >
      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
        Choose the payment method you use most — it'll be pre-selected the next time you book, though you can always
        change it per trip.
      </Text>

      <View style={{ backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden', ...shadows.card }}>
        {PAYMENT_METHODS.map((m, i) => (
          <View key={m.key}>
            <Pressable
              onPress={() => selectMethod(m.key, m.label)}
              disabled={!!saving}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: spacing.md,
                minHeight: 52,
              }}
            >
              <Ionicons name={m.icon} size={20} color={colors.navy} />
              <Text style={{ flex: 1, fontSize: 16, color: colors.textPrimary }}>{m.label}</Text>
              {saving === m.key ? (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Saving…</Text>
              ) : selectedKey === m.key ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.navy} />
              ) : null}
            </Pressable>
            {i < PAYMENT_METHODS.length - 1 && (
              <View style={{ height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 32 }} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

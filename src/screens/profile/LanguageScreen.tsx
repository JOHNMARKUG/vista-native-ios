import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../lib/i18n';
import VISTACard from '../../components/VISTACard';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Language'>;

const GROUPED_BG = '#F2F2F7';

const LANGUAGE_LABELS: Record<SupportedLanguage, { name: string; native: string; dbValue: string }> = {
  en: { name: 'English', native: 'English', dbValue: 'English' },
  fr: { name: 'French', native: 'Français', dbValue: 'French' },
  es: { name: 'Spanish', native: 'Español', dbValue: 'Spanish' },
};

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [selected, setSelected] = useState(i18n.language as SupportedLanguage);

  const selectLanguage = async (code: SupportedLanguage) => {
    setSelected(code);
    await i18n.changeLanguage(code);
    if (user) {
      await supabase.from('profiles').update({ preferred_language: LANGUAGE_LABELS[code].dbValue }).eq('id', user.id);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: GROUPED_BG }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
    >
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs }}>{t('language.subtitle')}</Text>
      <VISTACard style={{ padding: 0 }}>
        {SUPPORTED_LANGUAGES.map((code, i) => (
          <React.Fragment key={code}>
            <Pressable
              onPress={() => selectLanguage(code)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, minHeight: 48 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary }}>{LANGUAGE_LABELS[code].native}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{LANGUAGE_LABELS[code].name}</Text>
              </View>
              {selected === code && <Ionicons name="checkmark" size={22} color={colors.navy} />}
            </Pressable>
            {i < SUPPORTED_LANGUAGES.length - 1 && <View style={{ height: 1, backgroundColor: colors.border, marginLeft: spacing.md }} />}
          </React.Fragment>
        ))}
      </VISTACard>
    </ScrollView>
  );
}

import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import VISTACard from '../../components/VISTACard';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

const WHATSAPP_SUPPORT = '256785585703';
const GROUPED_BG = '#F2F2F7';

export default function SettingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const currentLanguageLabel = { en: 'English', fr: 'Français', es: 'Español' }[i18n.language] ?? 'English';

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      'This permanently deletes your VISTA account and booking history. This cannot be undone. Contact support to proceed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          style: 'destructive',
          onPress: () => Linking.openURL(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent('I would like to delete my VISTA account.')}`),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: GROUPED_BG }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
    >
      <VISTACard style={{ padding: 0 }}>
        <Row icon="language-outline" label={t('settings.language')} value={currentLanguageLabel} onPress={() => navigation.navigate('Language')} />
      </VISTACard>

      <VISTACard style={{ padding: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: spacing.md, minHeight: 48 }}>
          <Ionicons name="notifications-outline" size={20} color={colors.navy} />
          <Text style={{ flex: 1, fontSize: 16, color: colors.textPrimary }}>{t('settings.pushNotifications')}</Text>
          <Pressable onPress={() => setNotificationsEnabled((v) => !v)}>
            <Ionicons
              name={notificationsEnabled ? 'toggle' : 'toggle-outline'}
              size={32}
              color={notificationsEnabled ? colors.gold : '#C7C7CC'}
            />
          </Pressable>
        </View>
      </VISTACard>

      <VISTACard style={{ padding: 0 }}>
        <Row icon="document-text-outline" label={t('settings.termsOfService')} onPress={() => Linking.openURL('https://vista-customer.vercel.app/terms-of-service')} />
        <Divider />
        <Row icon="shield-checkmark-outline" label={t('settings.privacyPolicy')} onPress={() => Linking.openURL('https://vista-customer.vercel.app/privacy-policy')} />
      </VISTACard>

      <VISTACard style={{ padding: 0 }}>
        <Row icon="trash-outline" label={t('settings.deleteAccount')} labelColor={colors.error} onPress={handleDeleteAccount} />
      </VISTACard>

      <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textSecondary }}>
        {t('settings.version')} {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
  labelColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  labelColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: spacing.md, minHeight: 48 }}>
      <Ionicons name={icon} size={20} color={labelColor ?? colors.navy} />
      <Text style={{ flex: 1, fontSize: 16, color: labelColor ?? colors.textPrimary }}>{label}</Text>
      {value ? <Text style={{ fontSize: 15, color: colors.textSecondary, marginRight: 4 }}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 32 }} />;
}

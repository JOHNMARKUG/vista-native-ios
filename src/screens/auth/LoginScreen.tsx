import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import VISTAButton from '../../components/VISTAButton';
import VISTAInput from '../../components/VISTAInput';
import { colors, spacing } from '../../lib/theme';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { sendOtp, enterGuestMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: FormData) => {
    setLoading(true);
    setServerError(null);
    const { error } = await sendOtp(email);
    setLoading(false);
    if (error) {
      setServerError(t('auth.invalidCode') === error ? error : "We couldn't send a code to this email. Please check the address and try again.");
      return;
    }
    navigation.navigate('OTP', { email });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: 10 }}>
          <Image
            source={require('../../../assets/vista-logo.png')}
            style={{ width: 56, height: 56, resizeMode: 'contain' }}
          />
          <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 3 }}>
            VISTA TRANSPORT
          </Text>
        </View>

        <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', marginBottom: spacing.sm }}>
          {t('auth.welcomeToVISTA')}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 22, marginBottom: spacing.xl }}>
          {t('auth.enterEmailAddress')}
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <VISTAInput
              placeholder="your@email.com"
              value={value}
              onChangeText={(text) => {
                onChange(text);
                setServerError(null);
              }}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={handleSubmit(onSubmit)}
              error={errors.email?.message ?? serverError ?? undefined}
              leftIcon={<Ionicons name="mail" size={18} color={colors.gold} />}
              style={{ color: '#FFFFFF' }}
            />
          )}
        />

        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg }}>
          {t('auth.worksWithGmail')}
        </Text>

        <VISTAButton
          title={loading ? t('auth.sendingCode') : t('auth.sendVerificationCode')}
          variant="accent"
          loading={loading}
          disabled={!isValid}
          onPress={handleSubmit(onSubmit)}
        />

        <Pressable
          onPress={() => {
            enterGuestMode();
          }}
          style={{ paddingVertical: spacing.md, alignItems: 'center' }}
        >
          <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '600' }}>
            {t('auth.browseWithoutAccount')} →
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', lineHeight: 18, paddingBottom: spacing.lg }}>
          {t('auth.termsAgreement')} {t('auth.termsOfService')} {t('auth.and')} {t('auth.privacyPolicy')}.
        </Text>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

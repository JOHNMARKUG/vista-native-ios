import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
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
  const { sendOtp, enterGuestMode, signInWithApple, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

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
      setServerError("We couldn't send a code to this email. Please check the address and try again.");
      return;
    }
    navigation.navigate('OTP', { email });
  };

  const handleApple = async () => {
    setAppleLoading(true);
    const { error, cancelled } = await signInWithApple();
    setAppleLoading(false);
    if (error && !cancelled) Alert.alert('Sign in failed', error);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error, cancelled } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error && !cancelled) Alert.alert('Sign in failed', error);
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
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>VISTA Transport</Text>
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
              leftIcon={<Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.6)" />}
              style={{ color: '#FFFFFF' }}
            />
          )}
        />

        <View style={{ height: spacing.md }} />

        <VISTAButton
          title={loading ? t('auth.sendingCode') : t('auth.sendVerificationCode')}
          variant="accent"
          loading={loading}
          disabled={!isValid}
          onPress={handleSubmit(onSubmit)}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.lg }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </View>

        <View style={{ gap: spacing.sm }}>
          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={{ height: 50, opacity: appleLoading ? 0.7 : 1 }}
              onPress={handleApple}
            />
          )}

          <Pressable
            onPress={handleGoogle}
            disabled={googleLoading}
            style={({ pressed }) => ({
              height: 50,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: pressed || googleLoading ? 0.85 : 1,
            })}
          >
            <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
              Continue with Google
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => enterGuestMode()}
          style={{ paddingVertical: spacing.lg, alignItems: 'center' }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500' }}>
            {t('auth.browseWithoutAccount')}
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

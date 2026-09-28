import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { GOOGLE_IOS_CLIENT_ID } from '../../lib/google-auth';
import VISTAButton from '../../components/VISTAButton';
import VISTAInput from '../../components/VISTAInput';
import { colors, radius, spacing } from '../../lib/theme';

// Required once per app so a completed web-based auth session (Google's
// consent screen) closes and hands control back to this screen.
WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { sendOtp, enterGuestMode, signInWithApple, completeGoogleSignIn, signInWithPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // expo-apple-authentication's native capability (isAvailableAsync) only
  // resolves true on a real device running a build with the entitlement —
  // never in Expo Go. Showing the button unconditionally on iOS lets the
  // rest of the screen be reviewed in Expo Go; a tap there fails gracefully
  // (see handleApple) instead of the button just never appearing.
  const showAppleButton = Platform.OS === 'ios';

  // Google's iOS-type OAuth clients don't have a configurable "Authorized
  // redirect URIs" list in Cloud Console — they only accept a redirect
  // using the *reversed client ID* as the URL scheme, which is why this
  // can't just be the app's own `vistatransport` scheme (that produced a
  // real "doesn't comply with Google's OAuth 2.0 policy" 400 on a signed
  // build). The matching CFBundleURLTypes entry is registered in app.json.
  // Still resolves to an exp:// proxy URL automatically in Expo Go, no
  // extra config needed for that case.
  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme: `com.googleusercontent.apps.${GOOGLE_IOS_CLIENT_ID.split('.')[0]}`,
        path: 'oauthredirect',
      }),
    []
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    // Only exercised in the web dev preview (Platform.select falls through to
    // 'webClientId' there) — the shipped app is iOS-only, so this never
    // needs to be a real, separately-registered web OAuth client.
    webClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setGoogleLoading(false);
        Alert.alert('Sign in failed', 'Google did not return a sign-in token. Please try again.');
        return;
      }
      completeGoogleSignIn(idToken).then(({ error }) => {
        setGoogleLoading(false);
        if (error) Alert.alert('Sign in failed', error);
      });
    } else if (response.type === 'error') {
      setGoogleLoading(false);
      Alert.alert(
        'Sign in failed',
        response.error?.message ??
          'Google sign-in failed. If this is a 400 error, the OAuth consent screen may still be in "Testing" mode in Google Cloud Console — publish it or add this account as a test user.'
      );
    } else {
      // 'cancel' / 'dismiss' — the user backed out, nothing to report.
      setGoogleLoading(false);
    }
  }, [response, completeGoogleSignIn]);

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
    if (passwordMode) {
      const { error: pwError } = await signInWithPassword(email, password);
      setLoading(false);
      if (pwError) setServerError('Incorrect email or password. Please try again.');
      return;
    }
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
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Not available here',
          'Sign in with Apple needs a real iOS device running a development or production build — it never works inside Expo Go.'
        );
        return;
      }
      const { error, cancelled } = await signInWithApple();
      if (error && !cancelled) Alert.alert('Sign in failed', error);
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogle = () => {
    setGoogleLoading(true);
    promptAsync();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg }}>
          <Image
            source={require('../../../assets/vista-logo.png')}
            style={{ width: 48, height: 48, resizeMode: 'contain' }}
          />
        </View>

        <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '700', marginBottom: 6 }}>
          Sign in to VISTA
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: spacing.xl }}>
          {passwordMode ? 'Enter your email and password' : 'Enter your email to receive a 6-digit code'}
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
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.navy} />}
            />
          )}
        />

        {passwordMode && (
          <View style={{ marginTop: spacing.sm }}>
            <VISTAInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setServerError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.navy} />}
            />
          </View>
        )}

        <View style={{ height: spacing.md }} />

        <VISTAButton
          title={
            passwordMode
              ? loading ? 'Signing in...' : 'Sign in'
              : loading ? t('auth.sendingCode') : t('auth.sendVerificationCode')
          }
          variant="accent"
          loading={loading}
          disabled={!isValid || (passwordMode && password.length === 0)}
          onPress={handleSubmit(onSubmit)}
        />

        <Pressable
          onPress={() => {
            setPasswordMode((v) => !v);
            setPassword('');
            setServerError(null);
          }}
          style={{ paddingTop: spacing.sm, alignItems: 'center' }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
            {passwordMode ? 'Use an email code instead' : 'Sign in with a password instead'}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.lg }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>or continue with</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <View style={{ gap: spacing.sm }}>
          {showAppleButton && (
            // Apple's own native button, not a hand-styled lookalike: a
            // custom Pressable here rendered invisible-but-tappable on a
            // real signed build (a React Native styling bug this native
            // control can't have, since iOS draws it itself) — and Apple's
            // guidelines expect their own button for Sign in with Apple
            // anyway, not a recreation of it. Kept above Google (Apple's
            // guideline 4.8 wants it at least as prominent as other
            // third-party sign-in options, never below them).
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.button}
              style={{ width: '100%', height: 52, opacity: appleLoading ? 0.8 : 1 }}
              onPress={handleApple}
            />
          )}

          {/* Styled to match the black Apple button above (same fill, height,
              corner radius, white glyph) — the two used to look like they
              belonged to different apps side by side. */}
          <Pressable
            onPress={handleGoogle}
            disabled={!request || googleLoading}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: radius.button,
              backgroundColor: '#000000',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: pressed || googleLoading || !request ? 0.7 : 1,
            })}
          >
            <Ionicons name="logo-google" size={18} color="#FFFFFF" />
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue with Google</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => enterGuestMode()}
          style={{ paddingVertical: spacing.lg, alignItems: 'center' }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
            {t('auth.browseWithoutAccount')}
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', lineHeight: 18, paddingBottom: spacing.lg }}>
          {t('auth.termsAgreement')} {t('auth.termsOfService')} {t('auth.and')} {t('auth.privacyPolicy')}.
        </Text>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

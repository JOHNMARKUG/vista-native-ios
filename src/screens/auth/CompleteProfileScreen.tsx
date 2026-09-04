import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import VISTAButton from '../../components/VISTAButton';
import VISTAInput from '../../components/VISTAInput';
import { colors, spacing } from '../../lib/theme';

const schema = z.object({
  first_name: z.string().trim().min(1, 'Please enter your first name'),
  last_name: z.string().trim().min(1, 'Please enter your last name'),
  referral_code: z.string().trim().optional(),
  phone: z.string().trim().min(7, 'Please enter a valid phone number'),
  emergency_name: z.string().trim().optional(),
  emergency_phone: z.string().trim().optional(),
});
type FormData = z.infer<typeof schema>;

const STEP_FIELDS: (keyof FormData)[][] = [
  ['first_name', 'last_name', 'referral_code'],
  ['phone'],
  ['emergency_name', 'emergency_phone'],
];

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const { session, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      first_name: '',
      last_name: '',
      referral_code: '',
      phone: '+256',
      emergency_name: '',
      emergency_phone: '',
    },
  });

  const submit = async (skipEmergency: boolean) => {
    if (!session?.user) return;
    setLoading(true);
    setSubmitError(null);

    const values = getValues();
    const phone = values.phone.startsWith('+') ? values.phone : `+${values.phone.replace(/\D/g, '')}`;
    const referralCode = `VISTA${session.user.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    const payload = {
      id: session.user.id,
      email: session.user.email,
      full_name: `${values.first_name.trim()} ${values.last_name.trim()}`.trim(),
      phone,
      preferred_language: 'English',
      emergency_contact_name: skipEmergency ? null : values.emergency_name || null,
      emergency_contact_phone: skipEmergency ? null : values.emergency_phone || null,
      terms_agreed: true,
      terms_agreed_at: new Date().toISOString(),
      profile_complete: true,
      role: 'customer',
      referral_code: referralCode,
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      setSubmitError(error.message);
      setLoading(false);
      return;
    }

    const enteredCode = (values.referral_code || '').trim().toUpperCase();
    if (enteredCode.length >= 8) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', enteredCode)
        .maybeSingle();
      if (referrer && referrer.id !== session.user.id) {
        await supabase.from('referrals').insert({
          referrer_id: referrer.id,
          referred_id: session.user.id,
          referral_code: enteredCode,
          status: 'pending',
          reward_ugx: 10000,
        });
      }
    }

    await refreshProfile();
    setLoading(false);
    // AppNavigator swaps to TabNavigator automatically once profile_complete flips true.
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (!valid) return;
    if (step < 2) setStep(step + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>
          {t('profileSetup.step')} {step + 1} / 3
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i <= step ? colors.gold : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>{t('profileSetup.whatIsYourName')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20, marginBottom: spacing.sm }}>
              {t('profileSetup.weUseNameForBooking')}
            </Text>
            <Controller
              control={control}
              name="first_name"
              render={({ field: { onChange, value, onBlur } }) => (
                <VISTAInput
                  placeholder={t('profileSetup.firstNamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoComplete="given-name"
                  style={{ color: '#FFFFFF' }}
                  error={errors.first_name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="last_name"
              render={({ field: { onChange, value, onBlur } }) => (
                <VISTAInput
                  placeholder={t('profileSetup.lastNamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoComplete="family-name"
                  style={{ color: '#FFFFFF' }}
                  error={errors.last_name?.message}
                />
              )}
            />
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 18 }}>
              {t('profileSetup.referralCodeDesc')}
            </Text>
            <Controller
              control={control}
              name="referral_code"
              render={({ field: { onChange, value, onBlur } }) => (
                <VISTAInput
                  placeholder={t('profileSetup.referralPlaceholder')}
                  value={value}
                  onChangeText={(v) => onChange(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                  style={{ color: '#FFFFFF', letterSpacing: 1 }}
                />
              )}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>{t('profileSetup.yourPhoneNumber')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20, marginBottom: spacing.sm }}>
              {t('profileSetup.weUseWhatsApp')}
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value, onBlur } }) => (
                <VISTAInput
                  placeholder="+256 700 000 000"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  style={{ color: '#FFFFFF', fontSize: 20 }}
                  error={errors.phone?.message}
                />
              )}
            />
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 18 }}>
              {t('profileSetup.includeCountryCode')}
            </Text>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>{t('profileSetup.whoShouldWeCall')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20, marginBottom: spacing.sm }}>
              {t('profileSetup.optionalRecommended')}
            </Text>
            <Controller
              control={control}
              name="emergency_name"
              render={({ field: { onChange, value, onBlur } }) => (
                <VISTAInput
                  placeholder={t('profileSetup.contactNamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={{ color: '#FFFFFF' }}
                />
              )}
            />
            <Controller
              control={control}
              name="emergency_phone"
              render={({ field: { onChange, value, onBlur } }) => (
                <VISTAInput
                  placeholder={t('profileSetup.theirPhonePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  style={{ color: '#FFFFFF' }}
                />
              )}
            />
            {submitError ? (
              <Text style={{ color: '#FF6B60', fontSize: 13 }}>{submitError}</Text>
            ) : null}
          </>
        )}

        <View style={{ flex: 1 }} />

        {step < 2 ? (
          <VISTAButton title={t('common.continue')} variant="accent" onPress={handleNext} />
        ) : (
          <>
            <VISTAButton
              title={loading ? t('profileSetup.settingUpAccount') : t('profileSetup.completeRegistration')}
              variant="accent"
              loading={loading}
              onPress={() => submit(false)}
            />
            <Pressable onPress={() => submit(true)} disabled={loading} style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600' }}>
                {t('common.skipForNow')}
              </Text>
            </Pressable>
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

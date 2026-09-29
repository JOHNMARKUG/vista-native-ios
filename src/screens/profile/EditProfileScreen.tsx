import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import VISTAButton from '../../components/VISTAButton';
import VISTAInput from '../../components/VISTAInput';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const schema = z.object({
  first_name: z.string().trim().min(1, 'Please enter your first name'),
  last_name: z.string().trim().min(1, 'Please enter your last name'),
  phone: z.string().trim().min(7, 'Please enter a valid phone number'),
  emergency_name: z.string().trim().optional(),
  emergency_phone: z.string().trim().optional(),
});
type FormData = z.infer<typeof schema>;

// The only place profile fields can be changed after signup — before this,
// CompleteProfileScreen only ever ran once, during the sign-up flow itself.
export default function EditProfileScreen({ navigation }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [firstName, ...lastParts] = (profile?.full_name ?? '').trim().split(' ');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      first_name: firstName ?? '',
      last_name: lastParts.join(' '),
      phone: profile?.phone ?? '+256',
      emergency_name: profile?.emergency_contact_name ?? '',
      emergency_phone: profile?.emergency_contact_phone ?? '',
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!session?.user) return;
    setLoading(true);
    setSubmitError(null);

    const phone = values.phone.startsWith('+') ? values.phone : `+${values.phone.replace(/\D/g, '')}`;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: `${values.first_name.trim()} ${values.last_name.trim()}`.trim(),
        phone,
        emergency_contact_name: values.emergency_name || null,
        emergency_contact_phone: values.emergency_phone || null,
      })
      .eq('id', session.user.id);

    setLoading(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }

    await refreshProfile();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Your Name
        </Text>
        <Controller
          control={control}
          name="first_name"
          render={({ field: { onChange, value, onBlur } }) => (
            <VISTAInput
              label="First name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="given-name"
              error={errors.first_name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="last_name"
          render={({ field: { onChange, value, onBlur } }) => (
            <VISTAInput
              label="Last name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="family-name"
              error={errors.last_name?.message}
            />
          )}
        />

        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm }}>
          Phone
        </Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value, onBlur } }) => (
            <VISTAInput
              label="Phone number"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone?.message}
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.navy} />}
            />
          )}
        />

        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm }}>
          Emergency Contact
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: -spacing.sm }}>
          Who should we call if something goes wrong on a trip?
        </Text>
        <Controller
          control={control}
          name="emergency_name"
          render={({ field: { onChange, value, onBlur } }) => (
            <VISTAInput
              label="Contact name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.navy} />}
            />
          )}
        />
        <Controller
          control={control}
          name="emergency_phone"
          render={({ field: { onChange, value, onBlur } }) => (
            <VISTAInput
              label="Their phone number"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.navy} />}
            />
          )}
        />

        {submitError ? (
          <Text style={{ color: colors.error, fontSize: 13 }}>{submitError}</Text>
        ) : null}

        <View style={{ flex: 1 }} />

        <VISTAButton
          title={loading ? 'Saving...' : 'Save Changes'}
          variant="accent"
          loading={loading}
          disabled={!isValid}
          onPress={handleSubmit(onSubmit)}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

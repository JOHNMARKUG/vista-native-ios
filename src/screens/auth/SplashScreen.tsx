import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../lib/theme';

const ONBOARDED_KEY = 'vista_has_onboarded';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const hasOnboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
      navigation.replace(hasOnboarded ? 'Login' : 'Onboarding');
    }, 1400);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={{ alignItems: 'center', gap: 14 }}
      >
        <Image source={require('../../../assets/vista-logo.png')} style={styles.logo} />
        <Text style={styles.wordmark}>VISTA TRANSPORT</Text>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 88, height: 88, resizeMode: 'contain' },
  wordmark: { color: colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 3 },
});

import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../lib/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'WebPage'>;

/** Renders Terms of Service / Privacy Policy inside the app's own navigation
 * shell instead of handing off to the system browser — same content, but
 * you never actually leave VISTA. */
export default function WebPageScreen({ route }: Props) {
  const { url } = route.params;
  const [loading, setLoading] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <WebView source={{ uri: url }} onLoadEnd={() => setLoading(false)} style={{ flex: 1 }} />
      {loading && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator color={colors.navy} />
        </View>
      )}
    </View>
  );
}

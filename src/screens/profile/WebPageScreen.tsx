import React, { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { useHideTabBar } from '../../hooks/useHideTabBar';
import { colors } from '../../lib/theme';

type Props = {
  route: RouteProp<{ WebPage: { url: string; title: string } }, 'WebPage'>;
  navigation: NavigationProp<ParamListBase>;
};

/**
 * Renders a page inside the app's own navigation shell instead of handing
 * off to the system browser — used for Terms/Privacy (vista-customer's own
 * site) and the Pesapal payment redirect, both of which used to open
 * Safari and make it look like you'd left the app.
 *
 * The embedded vista-customer pages ship their own in-page "back" button
 * (a fixed-position circle in their hero header) meant for their own
 * standalone site — redundant and confusing next to this screen's real
 * native back button, so it's hidden via injected CSS. If the site
 * redirects away from the requested path (observed once: /terms-of-service
 * briefly landing on the login screen instead, likely an auth-check race
 * on their end) this reloads the intended URL once rather than silently
 * showing the wrong page.
 */
export default function WebPageScreen({ route, navigation }: Props) {
  const { url } = route.params;
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef<WebView>(null);
  const retried = useRef(false);

  useHideTabBar(navigation);

  const targetPath = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return null;
    }
  })();

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    if (navState.loading || retried.current || !targetPath || targetPath === '/') return;
    let landedPath: string | null = null;
    try {
      landedPath = new URL(navState.url).pathname;
    } catch {
      landedPath = null;
    }
    if (landedPath && landedPath !== targetPath) {
      retried.current = true;
      webviewRef.current?.injectJavaScript(`window.location.replace(${JSON.stringify(url)}); true;`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={`
          (function() {
            var style = document.createElement('style');
            style.innerHTML = 'button[style*="rgba(255, 255, 255, 0.12)"] { display: none !important; }';
            document.head.appendChild(style);
          })();
          true;
        `}
      />
      {loading && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator color={colors.navy} />
        </View>
      )}
    </View>
  );
}

import { useLayoutEffect } from 'react';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { VISIBLE_TAB_BAR_STYLE } from '../navigation/TabNavigator';

/**
 * Hides the (absolutely-positioned) bottom tab bar while a pushed screen is
 * focused, restoring it on unmount. Needed for any pushed screen with its
 * own sticky bottom button — without this the tab bar floats on top of it
 * since an absolute tabBarStyle isn't auto-hidden on nested-stack screens.
 */
export function useHideTabBar(navigation: NavigationProp<ParamListBase>) {
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent.setOptions({ tabBarStyle: VISIBLE_TAB_BAR_STYLE });
    };
  }, [navigation]);
}

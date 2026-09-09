/**
 * In-memory (not persisted) flag tracking whether the splash animation has
 * already played once this app session. AuthNavigator is fully unmounted and
 * remounted whenever the user drops out of guest mode or signs out, and
 * without this it would replay the splash + timer every time instead of
 * landing straight back on Login.
 */
let splashShown = false;

export function markSplashShown() {
  splashShown = true;
}

export function getAuthInitialRoute(): 'Splash' | 'Login' {
  return splashShown ? 'Login' : 'Splash';
}

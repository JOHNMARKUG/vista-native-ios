/**
 * VISTA Transport design tokens.
 * Mirrors tailwind.config.js — use this file wherever a raw value is needed
 * (shadows, StyleSheet.create, chart/map styling) instead of a className.
 */

export const colors = {
  navy: '#1B2E6B',
  navySoft: '#2C4089',
  gold: '#C8922A',
  goldSoft: '#F3E4C6',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#6C6C70',
  success: '#34C759',
  error: '#FF3B30',
  border: '#DEDEE3',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  control: 12,
  card: 16,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.4 },
  title: { fontSize: 28, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.3 },
  headline: { fontSize: 22, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.2 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 23 },
  bodyMedium: { fontSize: 17, fontWeight: '600' as const, lineHeight: 23 },
  subhead: { fontSize: 15, fontWeight: '500' as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 17 },
};

export const shadows = {
  card: {
    shadowColor: '#14161F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  subtle: {
    shadowColor: '#14161F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, typography, shadows };
export default theme;

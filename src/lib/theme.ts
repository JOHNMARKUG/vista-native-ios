/**
 * VISTA Transport design tokens.
 * Mirrors tailwind.config.js — use this file wherever a raw value is needed
 * (shadows, StyleSheet.create, chart/map styling) instead of a className.
 *
 * Palette is deliberately restricted to navy, gold, and neutrals — no
 * secondary accent colors (blue/purple/amber) anywhere in the UI. Success
 * and error are the only semantic exceptions, used solely for booking
 * status (never as decoration).
 */

export const colors = {
  navy: '#1B2E6B',
  gold: '#C8922A',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#6C6C70',
  success: '#34C759',
  error: '#FF3B30',
  border: '#E1E1E6',
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

// 8px is the ceiling everywhere in the app — no pill shapes, no oversized
// rounding. `tag` (4px) is for small inline status chips only.
export const radius = {
  tag: 4,
  control: 8,
  card: 8,
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

// One shadow, used everywhere a surface needs to lift off the background.
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, typography, shadows };
export default theme;

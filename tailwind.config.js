/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#1B2E6B',
        gold: '#C8922A',
        bg: '#F2F2F7',
        card: '#FFFFFF',
        ink: '#000000',
        'ink-soft': '#6C6C70',
        success: '#34C759',
        danger: '#FF3B30',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        card: '8px',
        control: '8px',
        tag: '4px',
      },
      fontSize: {
        display: ['34px', { lineHeight: '38px', fontWeight: '700' }],
        title: ['28px', { lineHeight: '32px', fontWeight: '700' }],
        headline: ['22px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['17px', { lineHeight: '23px', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '17px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};

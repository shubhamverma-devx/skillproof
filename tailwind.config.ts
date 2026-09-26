import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/** Token names come from docs/DESIGN.md; raw hex never appears in components. */
const rgb = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: rgb('--bg'),
        surface: rgb('--surface'),
        ink: rgb('--ink'),
        muted: rgb('--muted'),
        primary: { DEFAULT: rgb('--primary'), ink: rgb('--primary-ink') },
        claimed: { DEFAULT: rgb('--claimed'), ink: rgb('--claimed-ink') },
        observed: { DEFAULT: rgb('--observed'), ink: rgb('--observed-ink') },
        verified: { DEFAULT: rgb('--verified'), ink: rgb('--verified-ink') },
        missing: { DEFAULT: rgb('--missing'), ink: rgb('--missing-ink') },
        danger: { DEFAULT: rgb('--danger'), ink: rgb('--danger-ink') },
      },
      borderRadius: {
        panel: '14px',
        inner: '8px',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ui-sm': ['0.875rem', { lineHeight: '1.35rem' }],
        ui: ['1rem', { lineHeight: '1.6rem' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        h2: ['1.75rem', { lineHeight: '2.15rem', letterSpacing: '-0.015em' }],
        h1: ['2.5rem', { lineHeight: '2.85rem', letterSpacing: '-0.02em' }],
        display: ['4rem', { lineHeight: '4rem', letterSpacing: '-0.03em' }],
      },
      maxWidth: { prose: '70ch', shell: '1280px' },
      boxShadow: { overlay: '0 12px 32px -12px rgb(var(--ink) / 0.25)' },
      keyframes: {
        'fill-in': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: { 'fill-in': 'fill-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both' },
    },
  },
  plugins: [animate],
};

export default config;

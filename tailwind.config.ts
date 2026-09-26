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
        canvas: rgb('--canvas'),
        surface: { DEFAULT: rgb('--surface'), raised: rgb('--surface-raised') },
        line: rgb('--line'),
        ink: { DEFAULT: rgb('--ink'), muted: rgb('--ink-muted'), faint: rgb('--ink-faint') },
        accent: { DEFAULT: rgb('--accent'), ink: rgb('--accent-ink') },
        verified: { DEFAULT: rgb('--verified'), soft: rgb('--verified-soft') },
        observed: { DEFAULT: rgb('--observed'), soft: rgb('--observed-soft') },
        claimed: { DEFAULT: rgb('--claimed'), soft: rgb('--claimed-soft') },
        missing: { DEFAULT: rgb('--missing'), soft: rgb('--missing-soft') },
        danger: rgb('--danger'),
      },
      borderRadius: { panel: '12px', control: '8px' },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.875rem', { lineHeight: '1.375rem' }],
        base: ['1rem', { lineHeight: '1.625rem' }],
        lg: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.011em' }],
        xl: ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.016em' }],
        '2xl': ['2rem', { lineHeight: '2.375rem', letterSpacing: '-0.02em' }],
        display: ['3rem', { lineHeight: '3rem', letterSpacing: '-0.03em' }],
      },
      maxWidth: { content: '1120px', prose: '68ch' },
      boxShadow: {
        overlay: '0 16px 40px -16px rgb(0 0 0 / 0.22), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
      },
      transitionDuration: { DEFAULT: '160ms' },
      keyframes: {
        'sheet-in': {
          from: { transform: 'translateX(12px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'sheet-in': 'sheet-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 160ms ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;

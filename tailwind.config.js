/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        frame: 'rgb(var(--frame) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        active: 'rgb(var(--active) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        control: 'rgb(var(--control) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        positive: 'rgb(var(--positive) / <alpha-value>)',
        negative: 'rgb(var(--negative) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        title: ['22px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        section: ['16px', { lineHeight: '24px' }],
        kpi: ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        body: ['14px', { lineHeight: '20px' }],
        small: ['12px', { lineHeight: '18px' }],
      },
      borderRadius: {
        sheet: '16px',
        card: '8px',
        control: '6px',
      },
      spacing: {
        sheet: '8px',
        gutter: '24px',
        sidebar: '228px',
      },
      boxShadow: {
        overlay: '0 4px 12px rgba(19, 20, 22, 0.06)',
      },
    },
  },
  plugins: [],
}

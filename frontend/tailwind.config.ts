import type { Config } from 'tailwindcss';

// Colors are CSS variables (see styles/globals.css) so light/dark swap in one place.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token('primary'),
          fg: token('primary-fg'),
          soft: token('primary-soft'),
        },
        accent: {
          DEFAULT: token('accent'),
          fg: token('accent-fg'),
          soft: token('accent-soft'),
          ink: token('accent-ink'),
        },
        surface: {
          DEFAULT: token('surface'),
          raised: token('surface-raised'),
          sunken: token('surface-sunken'),
        },
        night: {
          DEFAULT: token('night'),
          fg: token('night-fg'),
        },
        ink: token('ink'),
        danger: {
          DEFAULT: token('danger'),
          soft: token('danger-soft'),
        },
        muted: {
          DEFAULT: token('muted'),
          line: token('muted-line'),
        },
        cover: {
          1: token('cover-1'),
          2: token('cover-2'),
          3: token('cover-3'),
          4: token('cover-4'),
          5: token('cover-5'),
          6: token('cover-6'),
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.06), 0 8px 24px -8px rgb(var(--shadow) / 0.18)',
        lift: '0 2px 4px rgb(var(--shadow) / 0.08), 0 16px 32px -12px rgb(var(--shadow) / 0.28)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

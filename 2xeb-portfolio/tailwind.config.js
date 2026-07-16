/** @type {import('tailwindcss').Config} */
// Ported 1:1 from the former inline `tailwind.config` in index.html (Play CDN).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  future: {
    // Gate hover: variants behind (hover) and (pointer: fine) so touch
    // devices don't get sticky hover states on tap.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px', // 1440p+ displays
      '4xl': '2400px', // 4K displays
    },
    extend: {
      fontFamily: {
        sans: ['General Sans', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SF Mono',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      colors: {
        bg: '#050505',
        card: '#0A0A0A',
        primary: '#2563EB',
        'swiss-blue': '#2563EB',
      },
      transitionTimingFunction: {
        // Strong curves — the built-in ease-out/ease-in-out are too weak
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'message-in': 'messageIn 0.25s cubic-bezier(0.23, 1, 0.32, 1) both',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        messageIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      maxWidth: {
        '8xl': '88rem', // 1408px
        '9xl': '96rem', // 1536px
        '10xl': '120rem', // 1920px
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Primary (Soft Sage Green) - Brand identity, primary actions
        primary: {
          900: '#1a3d2e',
          700: '#2d5a47',
          500: '#4a7c5d',
          300: '#7ba88e',
          100: '#d4e7dc',
          50: '#f0f7f3',
          DEFAULT: '#4a7c5d',
          foreground: '#ffffff',
        },
        // Secondary (Warm Terracotta) - Supporting elements
        secondary: {
          700: '#9d5a4a',
          500: '#c7826d',
          300: '#daa89a',
          100: '#f3e0d9',
          50: '#faf5f3',
          DEFAULT: '#c7826d',
          foreground: '#ffffff',
        },
        // Accent (Soft Gold) - Highlights, CTAs
        accent: {
          700: '#b8860b',
          500: '#d4a574',
          300: '#e6c9a8',
          100: '#f5ebdc',
          DEFAULT: '#d4a574',
          foreground: '#1c1917',
        },
        // Success (Nurturing Green)
        success: {
          700: '#2d6a4f',
          500: '#52b788',
          300: '#95d5b2',
          100: '#d8f3dc',
          DEFAULT: '#52b788',
        },
        // Warning (Gentle Amber)
        warning: {
          700: '#d97706',
          500: '#f59e0b',
          300: '#fbbf24',
          100: '#fef3c7',
          DEFAULT: '#f59e0b',
        },
        // Error (Supportive Rose)
        error: {
          700: '#be123c',
          500: '#e11d48',
          300: '#fb7185',
          100: '#ffe4e6',
          DEFAULT: '#e11d48',
        },
        // Info (Calming Sky)
        info: {
          700: '#0369a1',
          500: '#0ea5e9',
          300: '#7dd3fc',
          100: '#e0f2fe',
          DEFAULT: '#0ea5e9',
        },
        // Neutral (Warm Grays)
        neutral: {
          950: '#1c1917',
          800: '#44403c',
          600: '#78716c',
          400: '#a8a29e',
          300: '#d6d3d1',
          200: '#e7e5e4',
          100: '#f5f5f4',
          50: '#fafaf9',
        },
        // shadcn/ui semantic mappings
        border: '#e7e5e4',
        input: '#e7e5e4',
        ring: '#4a7c5d',
        background: '#fafaf9',
        foreground: '#1c1917',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1c1917',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1c1917',
        },
        muted: {
          DEFAULT: '#f5f5f4',
          foreground: '#78716c',
        },
        destructive: {
          DEFAULT: '#e11d48',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display styles (Poppins)
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-md': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        // Headings (Poppins)
        'h1': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h2': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '32px', letterSpacing: 'normal', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '28px', letterSpacing: 'normal', fontWeight: '600' }],
        'h5': ['18px', { lineHeight: '24px', letterSpacing: 'normal', fontWeight: '600' }],
        'h6': ['16px', { lineHeight: '24px', letterSpacing: 'normal', fontWeight: '600' }],
        // Body text (Inter)
        'body-lg': ['18px', { lineHeight: '28px', letterSpacing: 'normal', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', letterSpacing: 'normal', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', letterSpacing: 'normal', fontWeight: '400' }],
        'body-xs': ['12px', { lineHeight: '16px', letterSpacing: 'normal', fontWeight: '400' }],
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px 0 rgba(68, 64, 60, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(68, 64, 60, 0.08), 0 1px 2px 0 rgba(68, 64, 60, 0.06)',
        'md': '0 4px 6px -1px rgba(68, 64, 60, 0.08), 0 2px 4px -1px rgba(68, 64, 60, 0.06)',
        'lg': '0 10px 15px -3px rgba(68, 64, 60, 0.08), 0 4px 6px -2px rgba(68, 64, 60, 0.05)',
        'xl': '0 20px 25px -5px rgba(68, 64, 60, 0.08), 0 10px 10px -5px rgba(68, 64, 60, 0.04)',
        '2xl': '0 25px 50px -12px rgba(68, 64, 60, 0.12)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'moderate': '300ms',
        'slow': '400ms',
        'slower': '600ms',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

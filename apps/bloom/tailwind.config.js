/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // ============================================
        // BLOOM DESIGN SYSTEM - Miyazaki/Botanical Aesthetic
        // For Practitioners - "Craft Guild" Feel
        // See: docs/epics/DESIGN_SYSTEM_RESEARCH_FINDINGS.md
        // ============================================
        
        // Primary: Eucalyptus Sage (60% of interface)
        sage: {
          50: '#F5F7F5',
          100: '#E8EDE8',
          200: '#D1DCD1',
          300: '#A8B5A1',
          400: '#8FA892',   // softFern
          500: '#6B8E7F',   // eucalyptusSage - PRIMARY BRAND
          600: '#4A6B5C',   // deepSage - TEXT (4.5:1 contrast)
          700: '#3D5A4C',   // forestShadow - HEADERS (7:1 AAA)
          800: '#2E4A3D',
          900: '#1F3A2E',
        },
        
        // Secondary: Lavender (30% - care & empathy)
        lavender: {
          50: '#F7F5FA',
          100: '#E8E3F0',
          200: '#D4C8E3',
          300: '#C4B5D6',
          400: '#B4A7D6',
          500: '#9B8BC4',
          600: '#7D6BA3',
        },
        
        // Backgrounds: Warm Cream
        cream: {
          50: '#FFFFFE',    // warmWhite - card surfaces
          100: '#FAF7F2',   // warmCream - PRIMARY BACKGROUND
          200: '#F5F3EE',
          300: '#EFEBE5',
          400: '#E8E4DF',   // softStone - borders
        },
        
        // Accent: Sunset Blush (terracotta warmth)
        blush: {
          100: '#FFF5F2',
          200: '#FFE8E0',
          300: '#FFD4BC',
          400: '#D4A28F',   // softTerracotta
          500: '#C49080',
        },
        
        // Accent: Healing Teal (shared with NEXT-WEBSITE)
        teal: {
          100: '#E8F2F1',
          200: '#D0E5E3',
          300: '#A3C4C0',
          400: '#7FA9A3',
          500: '#0D9488',   // healingTeal - SUCCESS/GROWTH
          600: '#059669',   // SHARED wellness green
        },
        
        // Text Colors (warm, accessible)
        text: {
          primary: '#3D5A4C',    // forestShadow - 7:1 AAA
          secondary: '#4A6B5C',  // deepSage - 4.5:1 AA
          tertiary: '#6B8E7F',   // eucalyptusSage - decorative only
          muted: '#8A8A87',
        },
        
        // Semantic Colors (Research-validated)
        success: {
          DEFAULT: '#059669',    // SHARED wellness green
          light: '#D1FAE5',
          bg: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#D97706',    // SHARED across platforms
          light: '#FEF3C7',
          bg: '#FFFBEB',
        },
        error: {
          DEFAULT: '#DC2626',    // SHARED across platforms
          light: '#FEE2E2',
          bg: '#FEF2F2',
        },
        info: {
          DEFAULT: '#0284C7',
          light: '#E0F2FE',
          bg: '#F0F9FF',
        },
        
        // Legacy mappings for backward compatibility
        primary: {
          900: '#2E3B2F',
          700: '#4A5D4C',
          500: '#89A894',
          300: '#A8B5A1',
          100: '#E8EDE8',
          50: '#F5F7F5',
          DEFAULT: '#6B8066',
          foreground: '#ffffff',
        },
        secondary: {
          700: '#7D6BA3',
          500: '#B4A7D6',
          300: '#C4B5D6',
          100: '#E8E3F0',
          50: '#F7F5FA',
          DEFAULT: '#9B8BC4',
          foreground: '#ffffff',
        },
        accent: {
          700: '#7D6BA3',
          500: '#E8C5B5',
          300: '#F5B89E',
          100: '#FFF5F2',
          DEFAULT: '#E8C5B5',
          foreground: '#3D3D3A',
        },
        
        // Neutral (Warm Grays) - use sparingly
        neutral: {
          950: '#3D3D3A',
          800: '#5A5A57',
          600: '#8A8A87',
          400: '#B5B5B2',
          300: '#D1D1CE',
          200: '#E7E7E4',
          100: '#F5F5F4',
          50: '#FDFCFB',
        },
        
        // shadcn/ui semantic mappings (Bloom-ified)
        border: '#D1DCD1',  // sage-200
        input: '#D1DCD1',    // sage-200
        ring: '#6B8066',     // sage-600
        background: '#F5F3EE', // cream-100
        foreground: '#3D3D3A', // text-primary
        card: {
          DEFAULT: '#ffffff',
          foreground: '#3D3D3A',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#3D3D3A',
        },
        muted: {
          DEFAULT: '#E8EDE8',  // sage-100
          foreground: '#5A5A57', // text-secondary
        },
        destructive: {
          DEFAULT: '#F5A097',  // error
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        // Bloom Typography System
        display: ['Poppins', 'Montserrat', 'system-ui', 'sans-serif'],  // Emotional moments
        body: ['Inter', 'Open Sans', 'system-ui', 'sans-serif'],        // Interface clarity
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],            // Technical content
        sans: ['Inter', 'system-ui', 'sans-serif'],                     // Default
      },
      fontSize: {
        // Bloom Type Scale
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 16px - minimum body
        lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px - preferred body
        xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        
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
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.6',
        loose: '1.8',  // Preferred for body text
      },
      spacing: {
        // Bloom Spacing Scale (8px base unit)
        '0': '0px',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
        '20': '5rem',     // 80px
        '24': '6rem',     // 96px
      },
      borderRadius: {
        // Bloom Border Radius - Rounded Everything
        'none': '0px',
        'sm': '0.5rem',   // 8px - buttons
        DEFAULT: '0.75rem',  // 12px - cards
        'md': '0.75rem',  // 12px - cards
        'lg': '1rem',     // 16px - containers
        'xl': '1.5rem',   // 24px - pills/tags
        'full': '9999px', // Circular
      },
      boxShadow: {
        // Bloom Shadows - Soft Depth
        'sm': '0 1px 2px 0 rgba(61, 61, 58, 0.05)',
        DEFAULT: '0 4px 6px -1px rgba(61, 61, 58, 0.08)',
        'md': '0 4px 6px -1px rgba(61, 61, 58, 0.08)',
        'lg': '0 10px 15px -3px rgba(61, 61, 58, 0.1)',
        'xl': '0 20px 25px -5px rgba(61, 61, 58, 0.12)',
        'none': '0 0 #0000',
      },
      transitionDuration: {
        // Bloom Animation Durations
        'fast': '150ms',    // Micro-interactions
        DEFAULT: '200ms',   // Standard transitions
        'normal': '200ms',  // Standard transitions
        'slow': '300ms',    // Emphasis transitions
        'page': '400ms',    // Page transitions
      },
      transitionTimingFunction: {
        // Bloom Easing Functions
        'out': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
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

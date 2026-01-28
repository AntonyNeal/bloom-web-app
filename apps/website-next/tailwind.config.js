import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // NEXT-WEBSITE DESIGN SYSTEM
        // Modern Healthcare Institution Aesthetic
        // For Clients - "Trusted Institution" Feel
        // See: docs/epics/DESIGN_SYSTEM_RESEARCH_FINDINGS.md
        // ============================================
        
        // Primary: Trust Blue (institutional credibility)
        trust: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',   // calmSky - links, interactive
          600: '#2563EB',
          700: '#1E40AF',   // trustBlue - PRIMARY BRAND
          800: '#1E3A8A',
          900: '#1E3A5F',
        },
        
        // Secondary: Calm Sky (interactive elements)
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        },
        
        // Accent: Healing Teal (shared with BLOOM - wellness connection)
        healing: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',   // healingTeal - SUCCESS/WELLNESS
          700: '#0F766E',
          800: '#115E59',
        },
        
        // Backgrounds: Warm Cream (approachability)
        cream: {
          50: '#FFFFFF',    // cleanWhite - cards
          100: '#FEF9F5',   // warmCream - page backgrounds
          200: '#FDF7F2',
          300: '#FCF4ED',
        },
        
        // Text: Professional Grays
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#1F2937',   // professionalGray - PRIMARY TEXT
        },
        
        // Semantic Colors (shared across platforms)
        success: {
          DEFAULT: '#059669',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          DEFAULT: '#D97706',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        error: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          DEFAULT: '#0284C7',
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          600: '#0284C7',
        },
        
        // Legacy Life Psychology mapping
        'life-psychology': {
          primary: '#1E40AF',     // trustBlue
          secondary: '#64748B',   // slate-500
          accent: '#059669',      // healingTeal - SHARED
        },
        
        // Semantic UI tokens
        background: '#FFFFFF',
        foreground: '#1F2937',
        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#3B82F6',
        
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },
        primary: {
          DEFAULT: '#1E40AF',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#1F2937',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#0D9488',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
      },
      
      fontFamily: {
        // NEXT-WEBSITE Typography
        sans: [
          'Plus Jakarta Sans',
          'var(--font-plus-jakarta)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        // NEXT-WEBSITE Type Scale (Expressive)
        'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
        '5xl': ['3rem', { lineHeight: '1.16' }],          // 48px - hero
        '6xl': ['3.75rem', { lineHeight: '1.1' }],        // 60px - major hero
        
        // Semantic sizes
        'hero': ['3rem', { lineHeight: '1.16', letterSpacing: '-0.02em', fontWeight: '700' }],
        'page-title': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'section-title': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'card-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'body': ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'caption': ['0.75rem', { lineHeight: '1rem' }],
      },
      
      spacing: {
        // Shared spacing scale (8px base)
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
        '32': '8rem',     // 128px
      },
      
      borderRadius: {
        // Shared border radius scale
        'none': '0px',
        'sm': '0.25rem',  // 4px - inputs
        DEFAULT: '0.5rem',   // 8px - buttons
        'md': '0.5rem',   // 8px - buttons
        'lg': '0.75rem',  // 12px - cards
        'xl': '1rem',     // 16px - modals
        '2xl': '1.5rem',  // 24px - large containers
        'full': '9999px',
      },
      
      boxShadow: {
        // NEXT-WEBSITE Shadows - Clean Depth
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.06)',
        'none': '0 0 #0000',
      },
      
      transitionDuration: {
        'fast': '100ms',
        DEFAULT: '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [forms],
}

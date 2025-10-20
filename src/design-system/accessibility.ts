/**
 * Bloom Accessibility Design System
 * 
 * Optimized for users aged 40-70 with potential vision challenges:
 * - Larger base font sizes (minimum 16px, preferably 18px+)
 * - Increased line height for readability (1.6-1.8)
 * - Higher contrast ratios (WCAG AAA compliance where possible)
 * - Medium-bold font weights for body text
 * - Generous letter spacing
 * 
 * References:
 * - WCAG 2.1 Level AAA guidelines
 * - Material Design accessibility recommendations
 * - Apple Human Interface Guidelines (aging vision considerations)
 */

export const accessibleTypography = {
  // Base sizes - increased for aging vision
  baseFontSize: {
    mobile: '17px',    // Was 16px - iOS default, increased for better readability
    desktop: '18px',   // Was 16px - larger for desktop viewing
  },
  
  // Headings - maintaining hierarchy but ensuring readability
  headings: {
    h1: {
      mobile: '36px',  // Was 32px
      desktop: '48px', // Was 40px
      weight: 700,     // Bold
      lineHeight: 1.2,
    },
    h2: {
      mobile: '28px',  // Was 24px
      desktop: '36px', // Was 32px
      weight: 700,
      lineHeight: 1.3,
    },
    h3: {
      mobile: '24px',  // Was 20px
      desktop: '28px', // Was 24px
      weight: 600,
      lineHeight: 1.4,
    },
    h4: {
      mobile: '20px',  // Was 18px
      desktop: '24px', // Was 20px
      weight: 600,
      lineHeight: 1.4,
    },
  },
  
  // Body text - the most critical for readability
  body: {
    large: {
      mobile: '18px',  // Was 16px
      desktop: '20px', // Was 18px
      weight: 500,     // Medium - easier to read than regular (400)
      lineHeight: 1.7,
    },
    regular: {
      mobile: '17px',  // Was 15px
      desktop: '18px', // Was 16px
      weight: 500,     // Medium instead of 400
      lineHeight: 1.7,
    },
    small: {
      mobile: '16px',  // Was 14px - avoid going below 16px
      desktop: '17px', // Was 15px
      weight: 500,
      lineHeight: 1.6,
    },
  },
  
  // Form labels and inputs - critical for usability
  forms: {
    label: {
      mobile: '17px',  // Was 14px
      desktop: '18px', // Was 15px
      weight: 600,     // Semi-bold for easy scanning
      lineHeight: 1.5,
    },
    input: {
      mobile: '17px',  // Was 16px - iOS needs 16px minimum to prevent zoom
      desktop: '18px', // Was 16px
      weight: 500,
      lineHeight: 1.5,
    },
    helpText: {
      mobile: '16px',  // Was 14px
      desktop: '17px', // Was 14px
      weight: 400,
      lineHeight: 1.6,
    },
  },
  
  // Buttons - need to be easily readable
  buttons: {
    large: {
      mobile: '18px',  // Was 16px
      desktop: '19px', // Was 18px
      weight: 600,
      lineHeight: 1.5,
    },
    regular: {
      mobile: '17px',  // Was 15px
      desktop: '18px', // Was 16px
      weight: 600,
      lineHeight: 1.5,
    },
  },
  
  // Navigation and UI elements
  ui: {
    navigation: {
      mobile: '17px',
      desktop: '18px',
      weight: 500,
      lineHeight: 1.5,
    },
    caption: {
      mobile: '16px',  // Never below 16px
      desktop: '17px',
      weight: 400,
      lineHeight: 1.6,
    },
  },
  
  // Letter spacing - improves readability
  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    relaxed: '0.01em',
    loose: '0.02em',   // For headings
  },
  
  // Line height - generous spacing for easy reading
  lineHeight: {
    tight: 1.4,
    normal: 1.6,
    relaxed: 1.7,
    loose: 1.8,
  },
}

// Color contrast ratios for WCAG AAA compliance (7:1 for normal text, 4.5:1 for large text)
export const accessibleColors = {
  text: {
    primary: '#1A1A1A',      // Very dark gray - better than pure black
    secondary: '#4A4A4A',    // Medium dark gray - 7.5:1 contrast on white
    tertiary: '#6B6B6B',     // Lighter gray - 4.6:1 contrast (use for large text only)
    onDark: '#FFFFFF',       // White on dark backgrounds
  },
  
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F8F8',    // Very light gray
    tertiary: '#F0F0F0',     // Light gray
  },
  
  // Minimum contrast ratios
  minimumContrast: {
    normalText: 7,    // WCAG AAA for text under 18px
    largeText: 4.5,   // WCAG AAA for text 18px+ or 14px+ bold
    uiElements: 3,    // WCAG AA for UI components
  },
}

// Focus indicators - critical for keyboard navigation
export const accessibleFocus = {
  outlineWidth: '3px',        // Was 2px - more visible
  outlineStyle: 'solid',
  outlineColor: '#2563EB',    // High contrast blue
  outlineOffset: '2px',
  borderRadius: '4px',
}

// Touch targets - important for motor control
export const accessibleTargets = {
  minimum: '44px',            // WCAG 2.1 Level AAA
  recommended: '48px',        // Apple/Material Design
  spacing: '8px',             // Minimum spacing between targets
}

// Helper function to generate accessible font styles
export function getAccessibleFontStyle(
  category: keyof typeof accessibleTypography,
  variant: string,
  isMobile: boolean
) {
  const config = accessibleTypography[category as keyof typeof accessibleTypography]
  
  if (!config || typeof config === 'object' && !('mobile' in config)) {
    const typedConfig = config as Record<string, { mobile: string; desktop: string; weight: number; lineHeight: number }>
    const variantConfig = typedConfig[variant]
    
    if (!variantConfig) return {}
    
    return {
      fontSize: isMobile ? variantConfig.mobile : variantConfig.desktop,
      fontWeight: variantConfig.weight,
      lineHeight: variantConfig.lineHeight,
      letterSpacing: accessibleTypography.letterSpacing.normal,
    }
  }
  
  return {}
}

// Validation: Check if font size meets minimum requirements
export function isAccessibleFontSize(fontSize: string): boolean {
  const size = parseInt(fontSize)
  return size >= 16 // Minimum for accessibility
}

// Generate CSS custom properties for the accessibility system
export function generateAccessibleCSSVars() {
  return `
    :root {
      /* Accessible Typography */
      --font-size-base-mobile: ${accessibleTypography.baseFontSize.mobile};
      --font-size-base-desktop: ${accessibleTypography.baseFontSize.desktop};
      
      /* Accessible Colors */
      --color-text-primary: ${accessibleColors.text.primary};
      --color-text-secondary: ${accessibleColors.text.secondary};
      --color-text-tertiary: ${accessibleColors.text.tertiary};
      
      /* Accessible Focus */
      --focus-outline-width: ${accessibleFocus.outlineWidth};
      --focus-outline-color: ${accessibleFocus.outlineColor};
      --focus-outline-offset: ${accessibleFocus.outlineOffset};
      
      /* Accessible Touch Targets */
      --touch-target-min: ${accessibleTargets.minimum};
      --touch-target-recommended: ${accessibleTargets.recommended};
    }
  `
}

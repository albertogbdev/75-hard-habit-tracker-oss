/**
 * Dark theme configuration for the 75 Hard Habit Tracker app
 */

export const colors = {
  // Background colors
  background: '#1a1a1a',      // Dark charcoal background
  surface: '#2a2a2a',         // Slightly lighter surface
  surfaceElevated: '#333333', // Elevated surface (cards, modals)
  
  // Text colors
  text: '#ffffff',            // Primary text
  textSecondary: '#b3b3b3',   // Secondary text
  textMuted: '#808080',       // Muted text
  
  // Accent colors
  primary: '#4CAF50',         // Green for completed states
  primaryDark: '#388E3C',     // Darker green for pressed states
  secondary: '#2196F3',       // Blue for interactive elements
  secondaryDark: '#1976D2',   // Darker blue for pressed states
  
  // Status colors
  success: '#4CAF50',         // Success/completed
  warning: '#FF9800',         // Warning
  error: '#F44336',           // Error/failed
  
  // UI element colors
  border: '#404040',          // Border color
  borderLight: '#505050',     // Lighter border
  disabled: '#666666',        // Disabled elements
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  
  // Mood colors
  mood: {
    happy: '#FFD700',         // Gold
    sad: '#4FC3F7',           // Light blue
    angry: '#FF5722',         // Red-orange
    fearful: '#9C27B0',       // Purple
    strong: '#FF6F00',        // Orange
  },
} as const;

export const typography = {
  // Font family
  fontFamily: 'DM-Sans',

  titleFontFamily: 'Bebas-Neue',
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 26,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '600' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const spacing = {
  // Base spacing unit (8px)
  unit: 8,
  
  // Spacing scale
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

// Export Colors for compatibility with existing hooks
export const Colors = {
  light: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    icon: colors.textSecondary,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: colors.primary,
  },
  dark: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    icon: colors.textSecondary,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: colors.primary,
  },
};

export type Theme = typeof theme;
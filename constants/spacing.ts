/**
 * Sistema de espaciado basado en grid de 8px
 * Sigue Material Design 3
 */

export const Spacing = {
  xs: 4,    // 0.5x
  sm: 8,    // 1x
  md: 12,   // 1.5x
  lg: 16,   // 2x
  xl: 20,   // 2.5x
  xxl: 24,  // 3x
  xxxl: 32, // 4x
  huge: 40, // 5x
} as const;

// Alias útiles
export const space = {
  tight: Spacing.xs,
  compact: Spacing.sm,
  normal: Spacing.md,
  comfortable: Spacing.lg,
  roomy: Spacing.xl,
  airy: Spacing.xxl,
} as const;

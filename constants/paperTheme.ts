import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Colores personalizados basados en tu paleta actual
const customColors = {
  primary: '#0b5fff',
  onPrimary: '#fff',
  primaryContainer: '#eff6ff',
  onPrimaryContainer: '#0b5fff',
  secondary: '#6366f1',
  tertiary: '#f59e0b',
  background: '#fff',
  surface: '#f9fafb',
  surfaceVariant: '#f3f4f6',
  onSurface: '#111827',
  outline: '#d1d5db',
  error: '#ef4444',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: customColors.primary,
    onPrimary: customColors.onPrimary,
    primaryContainer: customColors.primaryContainer,
    onPrimaryContainer: customColors.onPrimaryContainer,
    secondary: customColors.secondary,
    tertiary: customColors.tertiary,
    background: customColors.background,
    surface: customColors.surface,
    surfaceVariant: customColors.surfaceVariant,
    onSurface: customColors.onSurface,
    onSurfaceVariant: '#6b7280',
    outline: customColors.outline,
    error: customColors.error,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    onPrimary: '#fff',
    primaryContainer: '#1e3a8a',
    onPrimaryContainer: '#93c5fd',
    secondary: '#818cf8',
    tertiary: '#fbbf24',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    onSurface: '#f1f5f9',
    onSurfaceVariant: '#cbd5e1',
    outline: '#64748b',
    error: '#f87171',
  },
};

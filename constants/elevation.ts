/**
 * Sistema de sombras/elevación Material Design 3
 */

import { StyleSheet } from 'react-native';

export const Elevation = {
  none: {
    shadowColor: 'transparent',
    elevation: 0,
  },
  
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },
  
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 4,
  },
  
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  
  level5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const styles = StyleSheet.create({
  elevated1: Elevation.level1,
  elevated2: Elevation.level2,
  elevated3: Elevation.level3,
  elevated4: Elevation.level4,
  elevated5: Elevation.level5,
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

type Props = {
  items: string[];
  selected?: string | null;
  onSelect: (item: string | null) => void;
  icons?: Record<string, string>;
};

export default function ProfessionChips({
  items,
  selected = null,
  onSelect,
  icons = {},
}: Props) {
  const isAllSelected = selected === null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Chip
          selected={isAllSelected}
          onPress={() => onSelect(null)}
          mode={isAllSelected ? 'flat' : 'outlined'}
          style={[styles.chip, isAllSelected && styles.selectedChip]}
          textStyle={[styles.chipText, isAllSelected && styles.selectedChipText]}
          icon={
            isAllSelected
              ? (props) => (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    {...props}
                  />
                )
              : undefined
          }
        >
          Todas
        </Chip>

        {items.map((it) => {
          const isSelected = selected === it;

          return (
            <Chip
              key={it}
              selected={isSelected}
              onPress={() => onSelect(isSelected ? null : it)}
              mode={isSelected ? 'flat' : 'outlined'}
              style={[styles.chip, isSelected && styles.selectedChip]}
              textStyle={[styles.chipText, isSelected && styles.selectedChipText]}
              icon={
                icons[it]
                  ? (props) => (
                      <MaterialCommunityIcons
                        name={icons[it] as any}
                        size={16}
                        {...props}
                      />
                    )
                  : undefined
              }
            >
              {it}
            </Chip>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
  },
  selectedChip: {
    backgroundColor: '#ede9fe',
    borderColor: '#c4b5fd',
  },
  chipText: {
    color: '#475569',
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#4c1d95',
    fontWeight: '700',
  },
});

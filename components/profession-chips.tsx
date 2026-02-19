import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  items: string[];
  selected?: string | null;
  onSelect: (item: string | null) => void;
  icons?: Record<string, string>;
};

export default function ProfessionChips({ items, selected, onSelect, icons }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable
          onPress={() => onSelect(null)}
          style={[styles.chip, selected === null ? styles.chipActive : null]}>
          <Text style={[styles.text, selected === null ? styles.textActive : null]}>Todas</Text>
        </Pressable>
        {items.map((it) => (
          <Pressable
            key={it}
            onPress={() => onSelect(it)}
            style={[styles.chip, selected === it ? styles.chipActive : null]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {icons && icons[it] ? (
                <MaterialCommunityIcons
                  name={icons[it] as any}
                  size={16}
                  color={selected === it ? '#fff' : '#374151'}
                  style={{ marginRight: 8 }}
                />
              ) : null}
              <Text style={[styles.text, selected === it ? styles.textActive : null]}>{it}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 10, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 12, alignItems: 'center' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eef2ff',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: '#0b5fff',
    borderColor: '#0b5fff',
  },
  text: { color: '#111', fontWeight: '600' },
  textActive: { color: '#fff', fontWeight: '700' },
});

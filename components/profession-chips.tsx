import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Chip } from 'react-native-paper';

type Props = {
  items: string[];
  selected?: string | null;
  onSelect: (item: string | null) => void;
  icons?: Record<string, string>;
};

export default function ProfessionChips({ items, selected, onSelect, icons }: Props) {
  return (
    <View style={{ paddingVertical: 10, backgroundColor: 'transparent' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center' }}>
        <Chip
          selected={selected === null}
          onPress={() => onSelect(null)}
          mode={selected === null ? 'flat' : 'outlined'}
          style={{ marginRight: 8 }}
        >
          Todas
        </Chip>
        {items.map((it) => (
          <Chip
            key={it}
            selected={selected === it}
            onPress={() => onSelect(it)}
            mode={selected === it ? 'flat' : 'outlined'}
            icon={icons && icons[it] ? (props) => <MaterialCommunityIcons name={icons[it] as any} size={16} {...props} /> : undefined}
            style={{ marginRight: 8 }}
          >
            {it}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

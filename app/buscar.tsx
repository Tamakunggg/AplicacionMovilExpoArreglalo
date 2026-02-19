import React, { useMemo, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfessionChips from '@/components/profession-chips';
import { AuthContext } from './auth-context';
import { useRouter } from 'expo-router';

type Item = { id: string; name: string; profession: string; rating: number; location?: string; avatar?: any; distance?: number };

const PROFESSIONS = [
  'Electricista',
  'Plomero',
  'Carpintero',
  'Jardinero',
  'Pintor',
  'Cerrajero',
  'Soldador',
  'Yesero',
  'Albañil',
  'Técnico en audio',
  'Fontanero',
];

const AVATAR = require('../assets/images/icon.png');

const SAMPLE: Item[] = [
  { id: '1', name: 'Juan Pérez', profession: 'Electricista', rating: 4.9, location: 'Culiacán', avatar: AVATAR, distance: 3 },
  { id: '2', name: 'Ana López', profession: 'Plomero', rating: 4.7, location: 'Culiacán', avatar: AVATAR, distance: 6 },
  { id: '3', name: 'Carlos Ruiz', profession: 'Electricista', rating: 4.5, location: 'Los Mochis', avatar: AVATAR, distance: 120 },
  { id: '4', name: 'María Gómez', profession: 'Carpintero', rating: 4.8, location: 'Culiacán', avatar: AVATAR, distance: 8 },
  { id: '5', name: 'Luis Díaz', profession: 'Jardinero', rating: 4.6, location: 'Mazatlán', avatar: AVATAR, distance: 220 },
  { id: '6', name: 'Pedro Castillo', profession: 'Pintor', rating: 4.4, location: 'Culiacán', avatar: AVATAR, distance: 12 },
  { id: '7', name: 'Rosa Martínez', profession: 'Soldador', rating: 4.5, location: 'Culiacán', avatar: AVATAR, distance: 4 },
  { id: '8', name: 'Diego Fernández', profession: 'Yesero', rating: 4.3, location: 'Mazatlán', avatar: AVATAR, distance: 210 },
  { id: '9', name: 'Marcos Torres', profession: 'Albañil', rating: 4.6, location: 'Culiacán', avatar: AVATAR, distance: 7 },
  { id: '10', name: 'Sofía Ramírez', profession: 'Técnico en audio', rating: 4.8, location: 'Los Mochis', avatar: AVATAR, distance: 115 },
];

export default function Buscar() {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | null>('rating');
  const { setViewUser } = useContext(AuthContext);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = SAMPLE.filter((s) => {
      if (selected && s.profession !== selected) return false;
      if (maxDistance !== null && typeof s.distance === 'number' && s.distance > maxDistance) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.profession.toLowerCase().includes(q) || (s.location || '').toLowerCase().includes(q);
    });

    if (sortBy === 'rating') {
      out = out.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      out = out.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return out;
  }, [selected, query, maxDistance, sortBy]);

  const ICONS: Record<string, string> = {
    'Electricista': 'flash-outline',
    'Plomero': 'pipe-wrench',
    'Carpintero': 'hammer',
    'Jardinero': 'leaf',
    'Pintor': 'brush',
    'Cerrajero': 'key-variant',
    'Soldador': 'fire',
    'Yesero': 'tools',
    'Albañil': 'domain',
    'Técnico en audio': 'music',
    'Fontanero': 'pipe',
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top","bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Contratar profesionales</Text>
          <TextInput
            placeholder="Buscar por nombre, profesión o ubicación"
            placeholderTextColor="#999"
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        <ProfessionChips items={PROFESSIONS} selected={selected} onSelect={setSelected} icons={ICONS} />

        <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 8, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <Text style={{ marginRight: 8, color: '#374151' }}>Distancia</Text>
            <Pressable onPress={() => setMaxDistance(prev => prev === 10 ? null : 10)} style={[styles.filterBtn, maxDistance === 10 ? styles.filterBtnActive : null]}>
              <Text style={maxDistance === 10 ? styles.filterTextActive : styles.filterText}>10 km</Text>
            </Pressable>
            <Pressable onPress={() => setMaxDistance(prev => prev === 25 ? null : 25)} style={[styles.filterBtn, maxDistance === 25 ? styles.filterBtnActive : null]}>
              <Text style={maxDistance === 25 ? styles.filterTextActive : styles.filterText}>25 km</Text>
            </Pressable>
            <Pressable onPress={() => setMaxDistance(null)} style={[styles.filterBtn, maxDistance === null ? styles.filterBtnActive : null]}>
              <Text style={maxDistance === null ? styles.filterTextActive : styles.filterText}>Todos</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
            <Text style={{ marginRight: 8, color: '#374151' }}>Ordenar</Text>
            <Pressable onPress={() => setSortBy(prev => prev === 'rating' ? null : 'rating')} style={[styles.filterBtn, sortBy === 'rating' ? styles.filterBtnActive : null]}>
              <Text style={sortBy === 'rating' ? styles.filterTextActive : styles.filterText}>Calificación</Text>
            </Pressable>
            <Pressable onPress={() => setSortBy(prev => prev === 'distance' ? null : 'distance')} style={[styles.filterBtn, sortBy === 'distance' ? styles.filterBtnActive : null]}>
              <Text style={sortBy === 'distance' ? styles.filterTextActive : styles.filterText}>Distancia</Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListEmptyComponent={<Text style={styles.empty}>No se encontraron resultados</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => {
                    setViewUser && setViewUser({
                      id: item.id,
                      name: item.name,
                      type: 'profesionista',
                      specialty: item.profession,
                      rating: item.rating,
                      avatar: item.avatar,
                      reviews: [],
                    });
                    router.push('/perfil');
                  }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={item.avatar} style={styles.avatar} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.profession} · {item.location} {item.distance ? `· ${item.distance} km` : ''}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rating}>{item.rating.toFixed(1)}★</Text>
              </View>
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  search: { backgroundColor: '#fff', borderRadius: 8, height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e6e9ef' },
  list: { paddingHorizontal: 12, paddingTop: 8 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e6eefc' },
  name: { fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4 },
  rating: { color: '#0b5fff', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 20, color: '#6b7280' },
  filterBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#e6e9ef', marginRight: 8, backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#0b5fff', borderColor: '#0b5fff' },
  filterText: { color: '#374151', fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
});

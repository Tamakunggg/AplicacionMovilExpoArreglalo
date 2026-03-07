import ProfessionChips from '@/components/profession-chips';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from './auth-context';

import { collection, query as firestoreQuery, getDocs, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Actualizamos el tipo para incluir los campos que el perfil necesita mostrar
type Item = {
  id: string;
  name: string;
  profession: string;
  rating: number;
  location?: string;
  avatar?: any;
  distance?: number;
  // Campos adicionales para el perfil detallado
  bio?: string;
  categories?: string[];
  yearsExp?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

const PROFESSIONS = [
  'Electricista', 'Plomero', 'Carpintero', 'Jardinero', 'Pintor',
  'Cerrajero', 'Soldador', 'Yesero', 'Albañil', 'Técnico en audio', 'Fontanero',
];

const AVATAR = require('../assets/images/icon.png');

let searchCache: Item[] | null = null;

export default function Buscar() {
  const [selected, setSelected] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [maxDistance] = useState<number | null>(null);
  const [sortBy] = useState<'rating' | 'distance' | null>('rating');

  const [profesionistas, setProfesionistas] = useState<Item[]>(searchCache || []);
  const [loading, setLoading] = useState(!searchCache);
  const [refreshing, setRefreshing] = useState(false);

  const { setViewUser } = useContext(AuthContext);
  const router = useRouter();

  const cargarProfesionales = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing && !searchCache) setLoading(true);

    try {
      const q = firestoreQuery(collection(db, "usuarios"), where("type", "==", "profesionista"));
      const querySnapshot = await getDocs(q);

      const lista: Item[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Construimos el nombre completo si vienen separados
        const calculatedName = data.name || (data.firstName ? `${data.firstName} ${data.lastName}` : 'Usuario');
        
        return {
          id: doc.id,
          name: calculatedName,
          firstName: data.firstName,
          lastName: data.lastName,
          profession: data.specialty || 'General',
          rating: data.rating || 0,
          location: data.location || "Culiacán",
          avatar: data.avatar || null,
          distance: Math.floor(Math.random() * 25) + 1,
          // Extraemos los datos necesarios para el perfil detallado
          bio: data.bio || '',
          categories: data.categories || [],
          yearsExp: data.yearsExp || 'N/A',
          email: data.email || '',
        };
      });

      setProfesionistas(lista);
      searchCache = lista;
    } catch (error) {
      console.log("Error cargando profesionistas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!searchCache) {
      cargarProfesionales();
    }
  }, [cargarProfesionales]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarProfesionales(true);
  };

  const results = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    let out = profesionistas.filter((s) => {
      if (selected && s.profession !== selected) return false;
      if (maxDistance !== null && s.distance && s.distance > maxDistance) return false;
      if (!q) return true;

      return (
        s.name.toLowerCase().includes(q) ||
        s.profession.toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q)
      );
    });

    if (sortBy === 'rating') {
      out = out.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      out = out.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return out;
  }, [profesionistas, selected, searchInput, maxDistance, sortBy]);

  const ICONS: Record<string, string> = {
    'Electricista': 'flash-outline', 'Plomero': 'pipe-wrench', 'Carpintero': 'hammer',
    'Jardinero': 'leaf', 'Pintor': 'brush', 'Cerrajero': 'key-variant',
    'Soldador': 'fire', 'Yesero': 'tools', 'Albañil': 'domain',
    'Técnico en audio': 'music', 'Fontanero': 'pipe',
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Contratar profesionales</Text>
          <TextInput
            placeholder="Buscar por nombre, profesión o ubicación"
            placeholderTextColor="#999"
            style={styles.search}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
        </View>

        <ProfessionChips items={PROFESSIONS} selected={selected} onSelect={setSelected} icons={ICONS} />

        {loading ? (
          <ActivityIndicator size="large" color="#0b5fff" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(i) => i.id}
            style={styles.list}
            contentContainerStyle={results.length === 0 ? styles.emptyList : { paddingBottom: 140 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0b5fff']} tintColor="#0b5fff" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>No se encontraron resultados</Text>
                <Text style={styles.subEmpty}>Desliza hacia abajo para actualizar</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => {
                  // Enviamos el objeto 'item' que ya contiene todos los campos descargados
                  setViewUser?.({
                    ...item,
                    type: 'profesionista', // Aseguramos que el Perfil.tsx sepa qué renderizar
                  });
                  router.push('/perfil');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Image
                    source={item.avatar ? { uri: item.avatar } : AVATAR}
                    style={styles.avatar}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.profession} · {item.location} {item.distance ? `· ${item.distance} km` : ''}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={styles.rating}>{item.rating.toFixed(1)}★</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  search: { backgroundColor: '#fff', borderRadius: 10, height: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e6e9ef', fontSize: 15 },
  list: { flex: 1 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center' },
  empty: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  subEmpty: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  card: { 
    backgroundColor: '#fff', 
    padding: 14, 
    borderRadius: 12, 
    marginHorizontal: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e6eefc' },
  name: { fontWeight: '700', fontSize: 16 },
  meta: { color: '#6b7280', marginTop: 4, fontSize: 13 },
  rating: { color: '#0b5fff', fontWeight: '700', fontSize: 15 },
});
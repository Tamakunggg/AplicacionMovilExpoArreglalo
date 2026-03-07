import ProfessionChips from '@/components/profession-chips';
import { useRouter } from 'expo-router';
import { collection, query as firestoreQuery, getDocs, where } from "firebase/firestore";
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
    View,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from "../firebaseConfig";
import { AuthContext } from './auth-context';

type Item = {
  id: string;
  name: string;
  profession: string;
  rating: number;
  location?: string;
  avatar?: any;
  distance?: number;
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
    if (!searchCache) cargarProfesionales();
  }, [cargarProfesionales]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarProfesionales(true);
  };

  // BUSQUEDA INTELIGENTE: Filtra por Nombre, Especialidad y Array de Categorías (Oficios)
  const results = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    let out = profesionistas.filter((s) => {
      if (selected && s.profession !== selected) return false;
      if (maxDistance !== null && s.distance && s.distance > maxDistance) return false;
      if (!q) return true;

      // Verifica si el texto buscado está en el array de categorías
      const matchesCategory = s.categories?.some(cat => cat.toLowerCase().includes(q));

      return (
        s.name.toLowerCase().includes(q) ||
        s.profession.toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q) ||
        matchesCategory
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
          <Text variant="headlineMedium" style={styles.title}>Contratar profesionales</Text>
          <TextInput
            placeholder="Buscar por nombre, oficio o especialidad..."
            style={styles.search}
            value={searchInput}
            onChangeText={setSearchInput}
            mode="outlined"
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
                <Text style={styles.subEmpty}>Prueba con otra palabra o desliza para actualizar</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => {
                  setViewUser?.({ ...item, type: 'profesionista' });
                  router.push('/perfil');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                  <Image
                    source={item.avatar ? { uri: item.avatar } : AVATAR}
                    style={styles.avatar}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)} ★</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.specialtyText}>{item.profession}</Text>

                    <View style={styles.categoriesContainer}>
                      {item.categories && item.categories.length > 0 ? (
                        item.categories.slice(0, 3).map((cat, index) => (
                          <View key={index} style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{cat}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.metaText}>General</Text>
                      )}
                      {item.categories && item.categories.length > 3 && (
                        <Text style={styles.moreCategories}>+{item.categories.length - 3}</Text>
                      )}
                    </View>

                    <View style={styles.locationRow}>
                      <Text style={styles.metaText}>📍 {item.location} {item.distance ? `· ${item.distance} km` : ''}</Text>
                    </View>
                  </View>
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
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  header: { padding: 16 },
  title: { marginBottom: 14, color: '#0f172a', fontWeight: '800' },
  search: { 
    marginBottom: 12,
  },
  list: { flex: 1 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', padding: 20 },
  empty: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  subEmpty: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginHorizontal: 16, 
    marginBottom: 14, 
    flexDirection: 'row', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  avatar: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#f1f5f9' },
  name: { fontWeight: '700', fontSize: 17, color: '#1e293b', flex: 1, marginRight: 8 },
  
  ratingBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingText: {
    color: '#d97706', 
    fontWeight: '800',
    fontSize: 13,
  },

  specialtyText: {
    color: '#0b5fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
    alignItems: 'center'
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  moreCategories: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  locationRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
});
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
let searchCache: Item[] | null = null;

const normalizeText = (text: any) => {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const normalizeCategories = (categories: any): string[] => {
  if (Array.isArray(categories)) {
    return categories.map((cat) => normalizeText(cat));
  }

  if (typeof categories === 'string' && categories.trim() !== '') {
    return [normalizeText(categories)];
  }

  return [];
};

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
      const q = firestoreQuery(
        collection(db, "usuarios"),
        where("type", "==", "profesionista")
      );

      const querySnapshot = await getDocs(q);

      const lista: Item[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        const calculatedName =
          data.name ||
          (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : 'Usuario');

        return {
          id: docSnap.id,
          name: calculatedName,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          profession: data.specialty || 'General',
          rating: Number(data.rating || 0),
          location: data.location || "Culiacán",
          avatar: data.avatar || null,
          distance: Math.floor(Math.random() * 25) + 1,
          bio: data.bio || '',
          categories: Array.isArray(data.categories)
            ? data.categories
            : data.categories
              ? [data.categories]
              : [],
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

  const results = useMemo(() => {
    const normalizedSearch = normalizeText(searchInput);
    const normalizedSelected = normalizeText(selected);

    let out = profesionistas.filter((item) => {
      const fullName = normalizeText(
        `${item.firstName || ''} ${item.lastName || ''} ${item.name || ''}`
      );

      const profession = normalizeText(item.profession);
      const bio = normalizeText(item.bio);
      const location = normalizeText(item.location);
      const categories = normalizeCategories(item.categories);

      const matchesCategory =
        !normalizedSelected ||
        categories.includes(normalizedSelected) ||
        profession.includes(normalizedSelected);

      const matchesDistance =
        maxDistance === null || !item.distance || item.distance <= maxDistance;

      const matchesSearch =
        normalizedSearch === '' ||
        fullName.includes(normalizedSearch) ||
        profession.includes(normalizedSearch) ||
        bio.includes(normalizedSearch) ||
        location.includes(normalizedSearch) ||
        categories.some((cat) => cat.includes(normalizedSearch));

      return matchesCategory && matchesDistance && matchesSearch;
    });

    if (sortBy === 'rating') {
      out = [...out].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      out = [...out].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return out;
  }, [profesionistas, selected, searchInput, maxDistance, sortBy]);

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

  const activeFilterText = selected
    ? `Filtro activo: ${selected}`
    : 'Mostrando todas las especialidades';

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Contratar profesionales
          </Text>

          <TextInput
            placeholder="Buscar por nombre, oficio, especialidad, ubicación o descripción..."
            style={styles.search}
            value={searchInput}
            onChangeText={setSearchInput}
            mode="outlined"
          />

          <Text style={styles.resultsInfo}>
            {results.length} resultado{results.length === 1 ? '' : 's'}
          </Text>

          <Text style={styles.filterInfo}>
            {activeFilterText}
          </Text>
        </View>

        <ProfessionChips
          items={PROFESSIONS}
          selected={selected}
          onSelect={setSelected}
          icons={ICONS}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0b5fff" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(i) => i.id}
            style={styles.list}
            contentContainerStyle={
              results.length === 0 ? styles.emptyList : { paddingBottom: 140 }
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0b5fff']}
                tintColor="#0b5fff"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>No se encontraron resultados</Text>
                <Text style={styles.subEmpty}>
                  Prueba con otro nombre, oficio, ubicación o especialidad
                </Text>
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
                <View style={styles.cardContent}>
                  <Image
                    source={item.avatar ? { uri: item.avatar } : AVATAR}
                    style={styles.avatar}
                  />

                  <View style={styles.infoWrap}>
                    <View style={styles.topRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>
                          {Number(item.rating || 0).toFixed(1)} ★
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.specialtyText}>
                      {item.profession || 'General'}
                    </Text>

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
                        <Text style={styles.moreCategories}>
                          +{item.categories.length - 3}
                        </Text>
                      )}
                    </View>

                    {item.bio ? (
                      <Text style={styles.bioText} numberOfLines={2}>
                        {item.bio}
                      </Text>
                    ) : null}

                    <View style={styles.locationRow}>
                      <Text style={styles.metaText}>
                        📍 {item.location} {item.distance ? `· ${item.distance} km` : ''}
                      </Text>
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
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    marginBottom: 14,
    color: '#0f172a',
    fontWeight: '800',
  },
  search: {
    marginBottom: 10,
  },
  resultsInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  filterInfo: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  empty: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  subEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  infoWrap: {
    marginLeft: 12,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontWeight: '700',
    fontSize: 17,
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
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
    alignItems: 'center',
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
  bioText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
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
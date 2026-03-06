import ProfessionChips from '@/components/profession-chips';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from './auth-context';

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

type Item = {
  id: string;
  name: string;
  profession: string;
  rating: number;
  location?: string;
  avatar?: any;
  distance?: number;
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

export default function Buscar() {

  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | null>('rating');

  const [profesionistas, setProfesionistas] = useState<Item[]>([]);

  const { setViewUser } = useContext(AuthContext);
  const router = useRouter();

  // 🔥 Cargar datos desde Firebase
  useEffect(() => {

    const cargarProfesionales = async () => {

      try {

        const querySnapshot = await getDocs(collection(db, "usuarios"));

        const lista: Item[] = [];

        querySnapshot.forEach((doc) => {

          const data = doc.data();

          if (data.type === "profesionista") {

            lista.push({
              id: doc.id,
              name: data.name,
              profession: data.specialty,
              rating: data.rating || 0,
              location: "Culiacán",
              avatar: data.avatar || null,
              distance: Math.floor(Math.random() * 25) + 1
            });

          }

        });

        setProfesionistas(lista);

      } catch (error) {
        console.log("Error cargando profesionistas:", error);
      }

    };

    cargarProfesionales();

  }, []);


  const results = useMemo(() => {

    const q = query.trim().toLowerCase();

    let out = profesionistas.filter((s) => {

      if (selected && s.profession !== selected) return false;

      if (maxDistance !== null && typeof s.distance === 'number' && s.distance > maxDistance) return false;

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

  }, [profesionistas, selected, query, maxDistance, sortBy]);


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

                  <Image
                    source={
                      item.avatar
                        ? { uri: item.avatar }
                        : AVATAR
                    }
                    style={styles.avatar}
                  />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.profession} · {item.location} {item.distance ? `· ${item.distance} km` : ''}
                  </Text>
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
});
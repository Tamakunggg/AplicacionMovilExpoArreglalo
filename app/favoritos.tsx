import React, { useContext, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ScrollView } from 'react-native';
import { AuthContext } from './auth-context';
import { useRouter } from 'expo-router';

type Item = { id: string; name: string; profession: string; rating: number; location?: string; avatar?: any; myRating?: number };

const AVATAR = require('../assets/images/icon.png');

const FAVORITES: Item[] = [
  { id: 'f1', name: 'Juan Pérez', profession: 'Electricista', rating: 4.9, location: 'Culiacán', avatar: AVATAR },
  { id: 'f2', name: 'María Gómez', profession: 'Carpintero', rating: 4.8, location: 'Culiacán', avatar: AVATAR },
];

const HIRED: Item[] = [
  { id: 'h1', name: 'Ana López', profession: 'Plomero', rating: 4.7, location: 'Culiacán', avatar: AVATAR, myRating: 4.0 },
  { id: 'h2', name: 'Pedro Castillo', profession: 'Pintor', rating: 4.4, location: 'Culiacán', avatar: AVATAR, myRating: 3.2 },
  { id: 'h3', name: 'Rosa Martínez', profession: 'Soldador', rating: 4.5, location: 'Culiacán', avatar: AVATAR, myRating: 4.6 },
];

export default function Favoritos() {
  const { setViewUser } = useContext(AuthContext);
  const router = useRouter();
  const [favorites, setFavorites] = useState<Item[]>(FAVORITES);

  const hiredGood = HIRED.filter((h) => (h.myRating ?? 0) > 3.5);

  const openProfile = (item: Item) => {
    setViewUser && setViewUser({
      id: item.id,
      name: item.name,
      type: 'profesionista',
      specialty: item.profession,
      rating: item.rating,
      avatar: item.avatar,
    });
    router.push('/perfil');
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top","bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Favoritos</Text>

        {favorites.length === 0 ? (
          <Text style={styles.empty}>Aún no tienes favoritos</Text>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(i) => i.id}
            style={styles.list}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.cardRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Image source={item.avatar} style={styles.avatar} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>{item.profession} · {item.location}</Text>
                  </View>
                </View>

                <View style={{ width: 120, alignItems: 'flex-end' }}>
                  <Text style={styles.rating}>{item.rating.toFixed(1)}★</Text>
                  <Pressable style={styles.smallBtn} onPress={() => openProfile(item)}>
                    <Text style={styles.smallBtnText}>Ver / Contratar</Text>
                  </Pressable>
                  <Pressable style={[styles.smallBtn, { backgroundColor: '#ef4444' }]} onPress={() => setFavorites(favorites.filter(f => f.id !== item.id))}>
                    <Text style={[styles.smallBtnText, { color: '#fff' }]}>Quitar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}

        <View style={{ height: 18 }} />

        <Text style={styles.title}>Contratados (mi calificación &gt; 3.5)</Text>

        {hiredGood.length === 0 ? (
          <Text style={styles.empty}>No hay contrataciones con nota superior a 3.5</Text>
        ) : (
          <FlatList
            data={hiredGood}
            keyExtractor={(i) => i.id}
            style={styles.list}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.cardRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Image source={item.avatar} style={styles.avatar} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>{item.profession} · {item.location}</Text>
                  </View>
                </View>

                <View style={{ width: 120, alignItems: 'flex-end' }}>
                  <Text style={styles.rating}>{item.rating.toFixed(1)}★</Text>
                  <Pressable style={styles.smallBtn} onPress={() => openProfile(item)}>
                    <Text style={styles.smallBtnText}>Ver / Contratar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  empty: { color: '#6b7280', marginBottom: 8 },
  list: { marginBottom: 12 },
  cardRow: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e6eefc' },
  name: { fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4 },
  rating: { color: '#0b5fff', fontWeight: '700' },
  smallBtn: { marginTop: 8, backgroundColor: '#0b5fff', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontWeight: '700' },
});

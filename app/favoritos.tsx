import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from './auth-context';

import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

type Item = {
  id: string;
  name: string;
  profession: string;
  rating: number;
  avatar?: any;
  bio?: string;
  categories?: string[];
  yearsExp?: string;
  email?: string;
  location?: string;
};

const AVATAR = require('../assets/images/icon.png');
let favoritesCache: Item[] | null = null;

export default function Favoritos() {
  const { setViewUser } = useContext(AuthContext);
  const router = useRouter();

  const [favorites, setFavorites] = useState<Item[]>(favoritesCache || []);
  const [loading, setLoading] = useState(!favoritesCache);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing && !favoritesCache) setLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const favQuery = query(
        collection(db, "favoritos"),
        where("userId", "==", currentUser.uid)
      );

      const favSnapshot = await getDocs(favQuery);
      const ids = favSnapshot.docs.map(d => d.data().profesionalId);

      if (ids.length === 0) {
        setFavorites([]);
        favoritesCache = [];
        return;
      }

      const usersQuery = query(
        collection(db, "usuarios"),
        where("__name__", "in", ids.slice(0, 30))
      );

      const usersSnapshot = await getDocs(usersQuery);

      const items: Item[] = usersSnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || (data.firstName ? `${data.firstName} ${data.lastName}` : 'Usuario'),
          profession: data.specialty || 'General',
          rating: data.rating || 0,
          avatar: data.avatar || null,
          bio: data.bio || '',
          categories: data.categories || [],
          yearsExp: data.yearsExp || 'N/A',
          email: data.email || '',
          location: data.location || 'No especificada'
        };
      });

      setFavorites(items);
      favoritesCache = items;
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!favoritesCache) loadFavorites();
  }, [loadFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites(true);
  };

  const removeFavorite = async (profId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Optimistic update
      const updatedList = favorites.filter(f => f.id !== profId);
      setFavorites(updatedList);
      favoritesCache = updatedList;

      const q = query(
        collection(db, "favoritos"),
        where("userId", "==", currentUser.uid),
        where("profesionalId", "==", profId)
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "favoritos", d.id)));
      await Promise.all(deletePromises);

    } catch (error) {
      Alert.alert("Error", "No se pudo quitar de favoritos");
      loadFavorites();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Mis Favoritos</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0b5fff" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(i) => i.id}
            contentContainerStyle={favorites.length === 0 ? styles.emptyListContent : styles.listContent}
            style={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0b5fff']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="heart-outline" size={80} color="#cbd5e1" />
                <Text variant="titleMedium" style={styles.empty}>Tu lista está vacía</Text>
                <Text variant="bodyMedium" style={styles.subEmpty}>Guarda a los profesionales que más te gusten para tenerlos a mano.</Text>
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
                        <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)} ★</Text>
                      </View>
                    </View>

                    <Text style={styles.specialtyText}>{item.profession}</Text>

                    {/* Chips de categorías para mantener consistencia */}
                    <View style={styles.categoriesContainer}>
                      {item.categories && item.categories.length > 0 ? (
                        item.categories.slice(0, 2).map((cat, index) => (
                          <View key={index} style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{cat}</Text>
                          </View>
                        ))
                      ) : null}
                    </View>

                    <View style={styles.locationRow}>
                      <Text style={styles.metaText}>📍 {item.location}</Text>
                    </View>
                  </View>
                </View>

                {/* Botón de eliminar con Paper IconButton */}
                <IconButton
                  icon="heart-remove"
                  iconColor="#ef4444"
                  size={24}
                  onPress={(e) => {
                    removeFavorite(item.id);
                  }}
                />
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', marginHorizontal: 16, marginTop: 16, marginBottom: 16, color: '#0f172a' },
  list: { flex: 1 },
  listContent: { paddingBottom: 100 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  empty: { color: '#64748b', fontSize: 18, fontWeight: '700', marginTop: 16 },
  subEmpty: { color: '#94a3b8', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  
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
  ratingText: { color: '#d97706', fontWeight: '800', fontSize: 13 },
  
  specialtyText: { color: '#0b5fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  categoryBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  
  locationRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
});
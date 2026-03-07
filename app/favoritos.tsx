import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
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
  // Campos extra necesarios para el nuevo PerfilProfesionista
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

      // Traer perfiles con todos sus campos
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
          // Mapeamos los campos extra para el perfil
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
    if (!favoritesCache) {
      loadFavorites();
    }
  }, [loadFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites(true);
  };

  const removeFavorite = async (profId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

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
      console.log("Error al eliminar:", error);
      loadFavorites();
    }
  };

  const openProfile = (item: Item) => {
    // Pasamos el item completo (que ahora incluye bio, categories, etc.)
    setViewUser?.({
      ...item,
      type: 'profesionista', 
      specialty: item.profession,
      reviews: [], 
    });

    router.push('/perfil');
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Favoritos</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0b5fff" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(i) => i.id}
            contentContainerStyle={favorites.length === 0 ? styles.emptyListContent : styles.listContent}
            style={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0b5fff']} tintColor={'#0b5fff'} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>Aún no tienes favoritos</Text>
                <Text style={styles.subEmpty}>Desliza hacia abajo para actualizar</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.cardRow} onPress={() => openProfile(item)}>
                <View style={styles.infoContainer}>
                  <Image 
                    source={item.avatar ? { uri: item.avatar } : AVATAR} 
                    style={styles.avatar} 
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>{item.profession}</Text>
                  </View>
                </View>

                <View style={styles.actionsContainer}>
                  <Text style={styles.rating}>{item.rating.toFixed(1)}★</Text>
                  <Pressable 
                    style={[styles.smallBtn, { backgroundColor: '#ef4444' }]} 
                    onPress={(e) => {
                      e.stopPropagation();
                      removeFavorite(item.id);
                    }}
                  >
                    <Text style={styles.smallBtnText}>Quitar</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  container: { paddingHorizontal: 16, paddingTop: 16, flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
  subEmpty: { color: '#9ca3af', fontSize: 14, marginTop: 8 },
  cardRow: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
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
  infoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  actionsContainer: { width: 100, alignItems: 'flex-end' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e6eefc' },
  name: { fontWeight: '700', fontSize: 16 },
  meta: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  rating: { color: '#0b5fff', fontWeight: '700', marginBottom: 4 },
  smallBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center'
  },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
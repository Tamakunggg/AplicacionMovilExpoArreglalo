import { MaterialCommunityIcons } from '@expo/vector-icons'; // Asegúrate de tener instalado expo-icons
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { auth, db, storage } from '../firebaseConfig';
import { styles } from '../styles';
import { AuthContext } from './auth-context';

type PerfilProfesionistaProps = {
  displayed: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | any;
    categories?: string[];
    specialty?: string;
    bio?: string;
    yearsExp?: string;
    rating?: number;
    email?: string;
    location?: string;
  };
  isViewingOther: boolean;
};

export default function PerfilProfesionista({ displayed, isViewingOther }: PerfilProfesionistaProps) {
  const { logout, user, setUser, setViewUser } = useContext(AuthContext);
  const router = useRouter();

  const [favorite, setFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false); // Estado para el loading del botón
  const [hireModalVisible, setHireModalVisible] = useState(false);

  const fullName = useMemo(() => {
    if (displayed?.firstName && displayed?.lastName) {
      return `${displayed.firstName} ${displayed.lastName}`;
    }
    return displayed?.name || 'Profesionista';
  }, [displayed]);

  const avatarSource = useMemo(() => {
    if (!displayed?.avatar) return null;
    if (typeof displayed.avatar === 'string') return { uri: displayed.avatar };
    return displayed.avatar;
  }, [displayed?.avatar]);

  // Verificar si es favorito al cargar
  useEffect(() => {
    const checkFavorite = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !displayed?.id || !isViewingOther) return;
      try {
        const q = query(
          collection(db, "favoritos"),
          where("userId", "==", currentUser.uid),
          where("profesionalId", "==", displayed.id)
        );
        const snapshot = await getDocs(q);
        setFavorite(!snapshot.empty);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };
    checkFavorite();
  }, [displayed?.id, isViewingOther]);

  const pickImage = async () => {
    if (isViewingOther) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && user?.id) {
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const filename = `avatars/${user.id}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);

        const userRef = doc(db, "usuarios", user.id);
        await updateDoc(userRef, { avatar: url });
        setUser({ ...user, avatar: url });
        Alert.alert("Éxito", "Foto actualizada");
      } catch (error) {
        Alert.alert("Error", "No se pudo subir la imagen.");
      }
    }
  };

  // Función de Favoritos MEJORADA
  const toggleFavorite = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !displayed?.id) {
      Alert.alert("Atención", "Inicia sesión para guardar favoritos.");
      return;
    }

    setFavLoading(true); // Iniciamos animación de carga
    try {
      const q = query(
        collection(db, "favoritos"),
        where("userId", "==", currentUser.uid),
        where("profesionalId", "==", displayed.id)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Eliminar de favoritos
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "favoritos", d.id)));
        await Promise.all(deletePromises);
        setFavorite(false);
      } else {
        // Añadir a favoritos
        await addDoc(collection(db, "favoritos"), {
          userId: currentUser.uid,
          profesionalId: displayed.id,
          createdAt: serverTimestamp(),
        });
        setFavorite(true);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Ocurrió un problema al actualizar favoritos.");
    } finally {
      setFavLoading(false); // Detenemos carga
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {/* Botón Volver Flotante a la Izquierda */}
          {isViewingOther && (
            <Pressable 
              style={{ position: 'absolute', left: 20, top: 50, zIndex: 10 }} 
              onPress={() => { setViewUser?.(null); router.back(); }}
            >
              <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
            </Pressable>
          )}

          {/* Botón Favorito Flotante a la Derecha */}
          {isViewingOther && (
            <Pressable 
              style={{ position: 'absolute', right: 20, top: 50, zIndex: 10 }} 
              onPress={toggleFavorite}
              disabled={favLoading}
            >
              {favLoading ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <MaterialCommunityIcons 
                  name={favorite ? "heart" : "heart-outline"} 
                  size={30} 
                  color={favorite ? "#ef4444" : "#6b7280"} 
                />
              )}
            </Pressable>
          )}

          <Pressable style={styles.avatarWrap} onPress={!isViewingOther ? pickImage : undefined}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {!isViewingOther && <View style={styles.editBadge}><Text style={styles.editBadgeText}>Editar</Text></View>}
          </Pressable>

          <View style={styles.headerInfo}>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.badgeRow}>
               <Text style={styles.role}>Profesionista</Text>
               {displayed.location && <Text style={styles.locationBadge}>📍 {displayed.location}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sobre mí</Text>
          <Text style={styles.sectionText}>{displayed.bio || 'Sin descripción disponible.'}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Experiencia</Text>
              <Text style={styles.statValue}>{displayed.yearsExp || '0'} años</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Calificación</Text>
              <Text style={styles.statValue}>{displayed.rating ? `${displayed.rating.toFixed(1)} ★` : '—'}</Text>
            </View>
          </View>

          <View style={{ marginTop: 30 }}>
            {isViewingOther ? (
              <Pressable 
                style={[styles.primaryBtn, { backgroundColor: '#0b5fff', height: 56 }]} 
                onPress={() => setHireModalVisible(true)}
              >
                <Text style={styles.primaryText}>Contratar ahora</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
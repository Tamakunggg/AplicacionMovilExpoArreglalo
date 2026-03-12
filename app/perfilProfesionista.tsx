import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { auth, db, storage } from '../firebaseConfig';
import { getOrCreateChat } from '../services/chat';
import {
  getProfessionalReviews,
  getProfessionalReviewsSummary,
} from '../services/reviewsService';
import { styles } from '../styles';
import { AuthContext } from './auth-context';

type ReviewItem = {
  id: string;
  professionalId?: string;
  clientId?: string;
  clientName?: string;
  serviceId?: string;
  rating?: number;
  comment?: string;
  createdAt?: any;
};

type ReviewSummary = {
  average: number;
  total: number;
  counts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

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
    digitalSignature?: string;
    reviewsCount?: number;
    latitude?: number | null;
    longitude?: number | null;
  };
  isViewingOther: boolean;
};

export default function PerfilProfesionista({
  displayed,
  isViewingOther,
}: PerfilProfesionistaProps) {
  const { logout, user, setUser, setViewUser } = useContext(AuthContext);
  const router = useRouter();

  const [favorite, setFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [firmaDigital, setFirmaDigital] = useState(displayed?.digitalSignature || '');
  const [savingSignature, setSavingSignature] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary>({
    average: 0,
    total: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

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

  const promedioCalificacion = useMemo(() => {
    if (summary.total > 0) return summary.average.toFixed(1);
    if (typeof displayed?.rating === 'number') return Number(displayed.rating).toFixed(1);
    return '0.0';
  }, [summary.total, summary.average, displayed?.rating]);

  const totalResenas = useMemo(() => {
    if (summary.total > 0) return summary.total;
    if (typeof displayed?.reviewsCount === 'number') return displayed.reviewsCount;
    return reviews.length;
  }, [summary.total, displayed?.reviewsCount, reviews.length]);

  const recomendado = useMemo(() => {
    return Number(promedioCalificacion) >= 4.5 && totalResenas >= 3;
  }, [promedioCalificacion, totalResenas]);

  useEffect(() => {
    setFirmaDigital(displayed?.digitalSignature || '');
  }, [displayed?.digitalSignature]);

  useEffect(() => {
    const checkFavorite = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !displayed?.id || !isViewingOther) return;

      try {
        const qNew = query(
          collection(db, 'favoritos'),
          where('userId', '==', currentUser.uid),
          where('professionalId', '==', displayed.id)
        );

        const snapshotNew = await getDocs(qNew);

        if (!snapshotNew.empty) {
          setFavorite(true);
          return;
        }

        const qOld = query(
          collection(db, 'favoritos'),
          where('userId', '==', currentUser.uid),
          where('profesionalId', '==', displayed.id)
        );

        const snapshotOld = await getDocs(qOld);
        setFavorite(!snapshotOld.empty);
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    };

    checkFavorite();
  }, [displayed?.id, isViewingOther]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!displayed?.id) return;

      try {
        setLoadingReviews(true);

        const data = await getProfessionalReviews(displayed.id);
        const dataSummary = await getProfessionalReviewsSummary(displayed.id);

        setReviews(data as ReviewItem[]);
        setSummary(dataSummary);
      } catch (error) {
        console.error('Error cargando reseñas:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    loadReviews();
  }, [displayed?.id]);

  const formatReviewDate = (createdAt: any) => {
    if (!createdAt?.seconds) return 'Fecha no disponible';

    const date = new Date(createdAt.seconds * 1000);

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, size = 18) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color="#f59e0b"
            style={{ marginRight: 1 }}
          />
        ))}
      </View>
    );
  };

  const pickImage = async () => {
    if (isViewingOther) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
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

        const userRef = doc(db, 'usuarios', user.id);
        await updateDoc(userRef, { avatar: url });

        setUser({ ...user, avatar: url });
        Alert.alert('Éxito', 'Foto actualizada');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'No se pudo subir la imagen.');
      }
    }
  };

  const guardarFirmaDigital = async () => {
    if (isViewingOther) return;

    if (!user?.id) {
      Alert.alert('Error', 'No se encontró el usuario actual.');
      return;
    }

    if (!firmaDigital.trim()) {
      Alert.alert('Campo requerido', 'Ingresa una firma digital.');
      return;
    }

    try {
      setSavingSignature(true);

      const userRef = doc(db, 'usuarios', user.id);
      await updateDoc(userRef, {
        digitalSignature: firmaDigital.trim(),
      });

      setUser({
        ...user,
        digitalSignature: firmaDigital.trim(),
      });

      Alert.alert('Éxito', 'Firma digital guardada correctamente.');
    } catch (error) {
      console.error('Error guardando firma digital:', error);
      Alert.alert('Error', 'No se pudo guardar la firma digital.');
    } finally {
      setSavingSignature(false);
    }
  };

  const toggleFavorite = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser || !displayed?.id) {
      Alert.alert('Atención', 'Inicia sesión para guardar favoritos.');
      return;
    }

    setFavLoading(true);

    try {
      const qNew = query(
        collection(db, 'favoritos'),
        where('userId', '==', currentUser.uid),
        where('professionalId', '==', displayed.id)
      );

      const snapshotNew = await getDocs(qNew);

      if (!snapshotNew.empty) {
        const deletePromises = snapshotNew.docs.map((d) =>
          deleteDoc(doc(db, 'favoritos', d.id))
        );
        await Promise.all(deletePromises);
        setFavorite(false);
        return;
      }

      const qOld = query(
        collection(db, 'favoritos'),
        where('userId', '==', currentUser.uid),
        where('profesionalId', '==', displayed.id)
      );

      const snapshotOld = await getDocs(qOld);

      if (!snapshotOld.empty) {
        const deletePromises = snapshotOld.docs.map((d) =>
          deleteDoc(doc(db, 'favoritos', d.id))
        );
        await Promise.all(deletePromises);
        setFavorite(false);
      } else {
        await addDoc(collection(db, 'favoritos'), {
          userId: currentUser.uid,
          professionalId: displayed.id,
          createdAt: serverTimestamp(),
        });
        setFavorite(true);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un problema al actualizar favoritos.');
    } finally {
      setFavLoading(false);
    }
  };

  const irASolicitudServicio = () => {
    if (!displayed?.id) {
      Alert.alert('Error', 'No se encontró el profesionista seleccionado.');
      return;
    }

    router.push({
      pathname: '/solicitudServicio',
      params: {
        professionalId: displayed.id,
        professionalName: fullName,
      },
    });
  };

  const abrirChat = async () => {
    if (!user?.id || !user?.name) {
      Alert.alert('Atención', 'Debes iniciar sesión para enviar mensajes.');
      return;
    }

    if (!displayed?.id) {
      Alert.alert('Error', 'No se encontró el profesionista.');
      return;
    }

    try {
      const chatId = await getOrCreateChat({
        clientId: user.id,
        professionalId: displayed.id,
        clientName: user.name,
        professionalName: fullName,
      });

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creando chat:', error);
      Alert.alert('Error', 'No se pudo abrir el chat.');
    }
  };

  const abrirUbicacion = async () => {
    if (!displayed?.location) {
      Alert.alert('Información', 'No hay ubicación disponible.');
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayed.location)}`;
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('Error', 'No se pudo abrir el mapa.');
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {isViewingOther && (
          <Pressable
            style={{ position: 'absolute', left: 20, top: 50, zIndex: 10 }}
            onPress={() => {
              setViewUser?.(null);
              router.back();
            }}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
          </Pressable>
        )}

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
                name={favorite ? 'heart' : 'heart-outline'}
                size={30}
                color={favorite ? '#ef4444' : '#6b7280'}
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

          {!isViewingOther && (
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>Editar</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{fullName}</Text>

          <View style={styles.badgeRow}>
            <Text style={styles.role}>Profesionista</Text>

            {recomendado && (
              <Text
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  fontWeight: '700',
                  overflow: 'hidden',
                  marginLeft: 8,
                }}
              >
                Recomendado
              </Text>
            )}

            {displayed.location && (
              <Text style={styles.locationBadge}>📍 {displayed.location}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Oficios y Servicios</Text>

        <View style={styles.tagRow}>
          {displayed.categories && displayed.categories.length > 0 ? (
            displayed.categories.map((cat, i) => (
              <View key={i} style={styles.profileTag}>
                <Text style={styles.profileTagText}>{cat}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.sectionText}>Sin oficios registrados.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Especialidad</Text>
        <Text style={styles.sectionText}>{displayed.specialty || 'General'}</Text>

        <Text style={styles.sectionTitle}>Sobre mí</Text>
        <Text style={styles.sectionText}>
          {displayed.bio || 'Sin descripción disponible.'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Experiencia</Text>
            <Text style={styles.statValue}>{displayed.yearsExp || '0'} años</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Calificación</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.statValue}>{promedioCalificacion} ★</Text>
              {renderStars(Math.round(Number(promedioCalificacion)), 16)}
            </View>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.statLabel}>Total de reseñas</Text>
          <Text style={styles.sectionText}>
            {totalResenas > 0 ? `${totalResenas} reseña(s)` : 'Aún no tiene reseñas'}
          </Text>
        </View>

        {displayed.email ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Contacto</Text>
            <Text style={styles.sectionText}>{displayed.email}</Text>
          </>
        ) : null}

        {displayed.location ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Ubicación</Text>
            <Text style={styles.sectionText}>{displayed.location}</Text>

            <Button
              mode="outlined"
              onPress={abrirUbicacion}
              style={{ marginTop: 10 }}
              icon="map-marker"
            >
              Ver ubicación en mapa
            </Button>
          </>
        ) : null}

        <Divider style={{ marginTop: 24, marginBottom: 20 }} />

        <Text style={styles.sectionTitle}>Reseñas</Text>

        {loadingReviews ? (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        ) : reviews.length === 0 ? (
          <Text style={styles.sectionText}>Aún no hay reseñas para este profesionista.</Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {reviews.map((review) => {
              const ratingValue = Number(review.rating || 0);

              return (
                <View
                  key={review.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: '#111827' }}>
                      {review.clientName || 'Cliente'}
                    </Text>

                    <Text style={{ color: '#6b7280', fontSize: 12 }}>
                      {formatReviewDate(review.createdAt)}
                    </Text>
                  </View>

                  <View style={{ marginTop: 6 }}>
                    {renderStars(ratingValue, 18)}
                  </View>

                  <Text style={{ marginTop: 8, color: '#374151' }}>
                    {review.comment || 'Sin comentario'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {!isViewingOther && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Firma digital</Text>
            <Text style={styles.sectionText}>
              Esta firma se utilizará para confirmar contratos dentro de la aplicación.
            </Text>

            <TextInput
              label="Firma digital"
              value={firmaDigital}
              onChangeText={setFirmaDigital}
              mode="outlined"
              style={{ marginTop: 12, backgroundColor: '#fff' }}
              placeholder="Ej. Ana2026"
            />

            <Button
              mode="contained"
              onPress={guardarFirmaDigital}
              loading={savingSignature}
              disabled={savingSignature}
              style={{ marginTop: 14 }}
            >
              Guardar firma digital
            </Button>
          </>
        )}

        <View style={{ marginTop: 30, gap: 12 }}>
          {isViewingOther ? (
            <>
              <Button
                mode="contained"
                onPress={irASolicitudServicio}
                style={{ paddingVertical: 8 }}
                icon="briefcase-plus"
              >
                Contratar ahora
              </Button>

              <Button
                mode="outlined"
                onPress={abrirChat}
                icon="chat-outline"
              >
                Contactar
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="outlined"
                onPress={() => router.push('/misChats')}
                icon="chat"
              >
                Mis chats
              </Button>

              <Button
                mode="contained"
                onPress={logout}
                buttonColor="#ef4444"
              >
                Cerrar sesión
              </Button>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
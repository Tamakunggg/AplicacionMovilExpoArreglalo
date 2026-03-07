import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useContext, useMemo } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { db, storage } from '../firebaseConfig';
import { styles } from '../styles'; // Asegúrate que la ruta sea correcta según tu carpeta
import { AuthContext } from './auth-context';

type PerfilClienteProps = {
  displayed: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | any;
    phone?: string;
    location?: string;
    email?: string;
  };
  isViewingOther: boolean;
};

export default function PerfilCliente({ displayed, isViewingOther }: PerfilClienteProps) {
  const { logout, user, setUser } = useContext(AuthContext);

  // Lógica para el Nombre Completo
  const fullName = useMemo(() => 
    displayed?.firstName ? `${displayed.firstName} ${displayed.lastName}` : (displayed?.name || 'Cliente')
  , [displayed]);

  // Lógica para el Avatar (Imagen remota o local)
  const avatarSource = useMemo(() => {
    if (!displayed?.avatar) return null;
    return typeof displayed.avatar === 'string' ? { uri: displayed.avatar } : displayed.avatar;
  }, [displayed?.avatar]);

  // Función para cambiar la foto (Solo si es MI perfil)
  const pickImage = async () => {
    if (isViewingOther) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos para cambiar el avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && user?.id) {
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${user.id}.jpg`);
        
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);

        const userRef = doc(db, "usuarios", user.id);
        await updateDoc(userRef, { avatar: url });
        
        // Actualizamos el estado global para que se refleje el cambio de inmediato
        setUser({ ...user, avatar: url });
        Alert.alert("Éxito", "Foto de perfil actualizada.");
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo subir la imagen.");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
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
            <Text style={styles.role}>Cliente</Text>
            {displayed.location && <Text style={styles.locationBadge}>📍 {displayed.location}</Text>}
          </View>
          {displayed.email && <Text style={styles.email}>{displayed.email}</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información de Contacto</Text>
        
        <Text style={styles.sectionTitle}>Teléfono</Text>
        <Text style={styles.sectionText}>{displayed.phone || 'No registrado'}</Text>

        <Text style={styles.sectionTitle}>Ubicación Principal</Text>
        <Text style={styles.sectionText}>{displayed.location || 'No especificada'}</Text>

        {!isViewingOther && (
          <View style={{ marginTop: 20 }}>
            <Button 
              mode="contained" 
              onPress={logout}
              buttonColor="#ef4444"
            >
              Cerrar sesión
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
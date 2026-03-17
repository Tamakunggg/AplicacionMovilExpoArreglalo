import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
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
import { db, storage } from '../firebaseConfig';
import { styles } from '../styles';
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
    digitalSignature?: string;
  };
  isViewingOther: boolean;
};

export default function PerfilCliente({
  displayed,
  isViewingOther,
}: PerfilClienteProps) {
  const router = useRouter();
  const { logout, user, setUser, setViewUser } = useContext(AuthContext);

  const [firmaDigital, setFirmaDigital] = useState(
    displayed?.digitalSignature || ''
  );
  const [savingSignature, setSavingSignature] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fullName = useMemo(() => {
    if (displayed?.firstName) {
      return `${displayed.firstName} ${displayed.lastName || ''}`.trim();
    }
    return displayed?.name || 'Cliente';
  }, [displayed]);

  const avatarSource = useMemo(() => {
    if (!displayed?.avatar) return null;
    return typeof displayed.avatar === 'string'
      ? { uri: displayed.avatar }
      : displayed.avatar;
  }, [displayed?.avatar]);

  useEffect(() => {
    setFirmaDigital(displayed?.digitalSignature || '');
  }, [displayed?.digitalSignature]);

  const pickImage = async () => {
    if (isViewingOther) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tus fotos para cambiar el avatar.'
      );
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
        setUploadingAvatar(true);

        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${user.id}.jpg`);

        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);

        const userRef = doc(db, 'usuarios', user.id);
        await updateDoc(userRef, { avatar: url });

        setUser({
          ...user,
          avatar: url,
        });

        Alert.alert('Éxito', 'Foto de perfil actualizada.');
      } catch (error) {
        console.error('Error subiendo avatar:', error);
        Alert.alert('Error', 'No se pudo subir la imagen.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const guardarFirmaDigital = async () => {
    if (isViewingOther) {
      Alert.alert('Aviso', 'No puedes editar la firma de otro usuario.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'No se encontró el id del usuario actual.');
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
            <Text style={{ fontSize: 28, color: '#111827' }}>{'‹'}</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.avatarWrap}
          onPress={!isViewingOther ? pickImage : undefined}
        >
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {!isViewingOther && (
            <View style={styles.editBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.editBadgeText}>Editar</Text>
              )}
            </View>
          )}
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.role}>Cliente</Text>
            {displayed.location && (
              <Text style={styles.locationBadge}>📍 {displayed.location}</Text>
            )}
          </View>
          {displayed.email ? (
            <Text style={styles.email}>{displayed.email}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información de contacto</Text>

        <Text style={styles.sectionTitle}>Teléfono</Text>
        <Text style={styles.sectionText}>
          {displayed.phone || 'No registrado'}
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Ubicación principal</Text>
        <Text style={styles.sectionText}>
          {displayed.location || 'No especificada'}
        </Text>

        {displayed.email ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Correo</Text>
            <Text style={styles.sectionText}>{displayed.email}</Text>
          </>
        ) : null}

        <Divider style={{ marginTop: 24, marginBottom: 20 }} />

        {!isViewingOther && (
          <>
            <Text style={styles.sectionTitle}>Firma digital</Text>
            <Text style={styles.sectionText}>
              Esta firma se utilizará para confirmar contratos dentro de la
              aplicación.
            </Text>

            <TextInput
              label="Firma digital"
              value={firmaDigital}
              onChangeText={setFirmaDigital}
              mode="outlined"
              style={{ marginTop: 12, backgroundColor: '#fff' }}
              placeholder="Ej. Blanca2026"
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

            <View style={{ marginTop: 24, gap: 12 }}>
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
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
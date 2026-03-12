import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';

export default function TrabajosRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirigir = async () => {
      try {
        const user = auth.currentUser;

        if (!user?.uid) {
          router.replace('/login');
          return;
        }

        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.replace('/login');
          return;
        }

        const userData = userSnap.data();

        const tipo = String(
          userData.type ||
            userData.tipo ||
            userData.role ||
            userData.rol ||
            ''
        )
          .trim()
          .toLowerCase();

        console.log('Tipo detectado en trabajos.tsx:', tipo);

        if (
          tipo === 'client' ||
          tipo === 'cliente' ||
          tipo === 'usuario'
        ) {
          router.replace('/trabajosCliente');
          return;
        }

        if (
          tipo === 'professional' ||
          tipo === 'profesional' ||
          tipo === 'profesionista' ||
          tipo === 'trabajador' ||
          tipo === 'worker'
        ) {
          router.replace('/trabajosProfesional');
          return;
        }

        router.replace('/buscar');
      } catch (error) {
        console.error('Error al redirigir desde trabajos.tsx:', error);
        router.replace('/buscar');
      }
    };

    redirigir();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6f42c1" />
      <Text style={styles.text}>Cargando trabajos...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f4fb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 14,
    color: '#5a3d99',
    fontSize: 16,
    fontWeight: '600',
  },
});
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { User } from './auth-context';

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig';

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

type Props = {
  onLogin?: (user?: User) => void;
  onNavigate?: (route: string) => void;
};

export default function Login({ onLogin, onNavigate }: Props) {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (route: string) => {
    if (onNavigate) return onNavigate(route);
    router.push(route);
  };

const handleLogin = async () => {
  setIsLoading(true);
  try {

    const userCredential = await signInWithEmailAndPassword(
      auth,
      user,
      password
    );

    const firebaseUser = userCredential.user;

    console.log("Usuario logueado:", firebaseUser.email);

    // 🔹 Buscar datos en Firestore
    const userRef = doc(db, "usuarios", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let userData = {};

    if (userSnap.exists()) {
      userData = userSnap.data();
      console.log("Datos Firestore:", userData);
    }

    if (onLogin) {
      onLogin({
        id: firebaseUser.uid,
        name: userData.name || "",
        email: firebaseUser.email ?? "",
        phone: userData.phone || "",
        type: userData.type || "cliente",
        avatar: userData.avatar || undefined,
        specialty: userData.specialty || undefined,
        credential: userData.credential || undefined,
        yearsExp: userData.yearsExp || undefined,
        rating: userData.rating || 0
      });
    } else {
      router.replace("/home");
    }

  } catch (error: any) {
    alert("Error al iniciar sesión: " + error.message);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.brand}>
          <Text variant="headlineLarge" style={{ fontWeight: '700', color: '#0b5fff' }}>
            Arreglalo
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 4, color: '#6b7280' }}>
            Expertos al servicio
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="titleLarge" style={{ marginBottom: 20, fontWeight: '600' }}>
            Iniciar sesión
          </Text>

          <TextInput
            label="Usuario o correo"
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />

          <Button 
            mode="contained" 
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.primaryButton}
          >
            Ingresar
          </Button>

          <Button 
            mode="text" 
            onPress={() => handleNavigate('/forgot-password')}
            style={{ marginTop: 12 }}
          >
            ¿Olvidaste tu contraseña?
          </Button>

          <Text variant="bodyMedium" style={styles.or}>O iniciar con</Text>

          <View style={styles.socialRow}>
            <Button
              mode="outlined"
              onPress={() => alert('Google login aún no implementado')}
              style={styles.socialBtn}
            >
              Google
            </Button>

            <Button
              mode="contained"
              onPress={() => alert('Facebook login aún no implementado')}
              style={[styles.socialBtn, { backgroundColor: '#1877f2' }]}
            >
              Facebook
            </Button>
          </View>

          <View style={styles.row}>
            <Text variant="bodySmall" style={{ color: '#6b7280' }}>
              ¿No tienes cuenta?
            </Text>
            <Button 
              mode="text" 
              onPress={() => handleNavigate('/register')}
              compact
            >
              Regístrate
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },

  container: { flex: 1, padding: 20, justifyContent: 'center' },

  brand: { alignItems: 'center', marginBottom: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  input: {
    marginBottom: 12,
  },

  primaryButton: {
    marginTop: 4,
    paddingVertical: 6,
  },

  or: { textAlign: 'center', marginVertical: 12, color: '#6b7280' },

  socialRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },

  socialBtn: {
    flex: 1,
  },

  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14 },
});
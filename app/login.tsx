import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

  const handleNavigate = (route: string) => {
    if (onNavigate) return onNavigate(route);
    router.push(route);
  };

const handleLogin = async () => {
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
  }
};



  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>Arreglalo</Text>
          <Text style={styles.brandSubtitle}>Expertos al servicio</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Iniciar sesión</Text>

          <TextInput
            placeholder="Usuario o correo"
            placeholderTextColor="#999"
            value={user}
            onChangeText={setUser}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          <Pressable style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Ingresar</Text>
          </Pressable>

          <Pressable onPress={() => handleNavigate('/forgot-password')}>
            <Text style={[styles.link, { textAlign: 'center', marginTop: 12 }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <Text style={styles.or}>O iniciar con</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, styles.google]}
              onPress={() => alert('Google login aún no implementado')}
            >
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, styles.facebook]}
              onPress={() => alert('Facebook login aún no implementado')}
            >
              <Text style={[styles.socialText, { color: '#fff' }]}>
                Facebook
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.small}>¿No tienes cuenta?</Text>
            <Pressable onPress={() => handleNavigate('/register')}>
              <Text style={styles.link}> Regístrate</Text>
            </Pressable>
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

  brandTitle: { fontSize: 28, fontWeight: '700', color: '#0b5fff' },

  brandSubtitle: { color: '#6b7280', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  heading: { fontSize: 20, fontWeight: '600', marginBottom: 12 },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e6e9ef',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: '#111827',
  },

  primaryButton: {
    height: 48,
    backgroundColor: '#0b5fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  primaryButtonText: { color: '#fff', fontWeight: '600' },

  or: { textAlign: 'center', marginVertical: 12, color: '#6b7280' },

  socialRow: { flexDirection: 'row', justifyContent: 'space-between' },

  socialBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },

  google: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e9ef' },

  facebook: { backgroundColor: '#1877f2' },

  socialText: { color: '#111', fontWeight: '600' },

  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },

  small: { color: '#6b7280' },

  link: { color: '#0b5fff', fontWeight: '600' },
});
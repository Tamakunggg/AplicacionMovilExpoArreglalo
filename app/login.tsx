import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { User } from './auth-context';

import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";

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

      const loggedUser = userCredential.user;

      console.log("Usuario logueado:", loggedUser.email);

      if (onLogin) {
        onLogin({
          id: loggedUser.uid,
          name: loggedUser.email ?? "",
          email: loggedUser.email ?? "",
          phone: "",
          type: "cliente",
          avatar: undefined,
          rating: 0
        });
      } else {
        router.replace("/home");
      }

    } catch (error: any) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  const demoClient = {
    id: 'u-client',
    name: 'Cliente Demo',
    email: 'cliente@demo.com',
    phone: '55 5555 5555',
    type: 'cliente' as const,
    avatar: undefined,
    rating: 4.6,
  };

  const demoProf = {
    id: 'u-prof',
    name: 'Profesionista Demo',
    email: 'prof@demo.com',
    phone: '66 6666 6666',
    type: 'profesionista' as const,
    specialty: 'Electricista',
    credential: 'CED-123456',
    yearsExp: '8',
    avatar: undefined,
    rating: 4.9,
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

          <View style={{ marginTop: 12 }}>
            <Text style={{ textAlign: 'center', color: '#6b7280' }}>
              Accesos de prueba
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
              <Pressable
                style={[styles.socialBtn, { backgroundColor: '#f3f4f6' }]}
                onPress={() => (onLogin ? onLogin(demoClient) : handleLogin())}
              >
                <Text style={{ color: '#111', fontWeight: '600' }}>
                  Cliente demo
                </Text>
              </Pressable>

              <Pressable
                style={[styles.socialBtn, { backgroundColor: '#f3f4f6' }]}
                onPress={() => (onLogin ? onLogin(demoProf) : handleLogin())}
              >
                <Text style={{ color: '#111', fontWeight: '600' }}>
                  Profes. demo
                </Text>
              </Pressable>
            </View>
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
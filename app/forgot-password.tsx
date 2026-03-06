import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebaseConfig';

type Props = {
  onNavigate?: (route: string) => void;
};

export default function ForgotPassword({ onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleNavigate = (route: string) => {
    if (onNavigate) return onNavigate(route);
  };

  const handleSendReset = async () => {
    if (!email || !email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      // Firebase devuelve códigos de error específicos
      if (err.code === 'auth/user-not-found') {
        setError('No encontramos una cuenta con este correo');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo no es válido');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde');
      } else {
        setError('Error al enviar el correo. Intenta de nuevo');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <View style={styles.brand}>
            <Text style={styles.brandTitle}>Arreglalo</Text>
            <Text style={styles.brandSubtitle}>Expertos al servicio</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>

            <Text style={styles.successTitle}>¡Correo enviado!</Text>

            <Text style={styles.successMessage}>
              Hemos enviado un enlace de recuperación a{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
              {'\n\n'}
              Revisa tu correo (incluyendo la carpeta de spam) y sigue los pasos para crear una nueva contraseña.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => handleNavigate('/login')}>
              <Text style={styles.primaryButtonText}>Volver al inicio de sesión</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setSuccess(false);
                setEmail('');
              }}>
              <Text style={styles.secondaryButtonText}>Intentar con otro correo</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>Arreglalo</Text>
          <Text style={styles.brandSubtitle}>Expertos al servicio</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Recuperar contraseña</Text>

          <Text style={styles.description}>
            Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
          </Text>

          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSendReset}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Enviar enlace de recuperación</Text>
            )}
          </Pressable>

          <View style={styles.row}>
            <Text style={styles.small}>¿Recuerdas tu contraseña?</Text>
            <Pressable onPress={() => handleNavigate('/login')}>
              <Text style={styles.link}> Inicia sesión</Text>
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

  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e6e9ef',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: '#111827',
  },

  error: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },

  primaryButton: {
    height: 48,
    backgroundColor: '#0b5fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  secondaryButton: {
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  secondaryButtonText: { color: '#0b5fff', fontWeight: '600', fontSize: 16 },

  buttonDisabled: { opacity: 0.7 },

  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },

  small: { color: '#6b7280' },

  link: { color: '#0b5fff', fontWeight: '600' },

  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },

  successIconText: {
    fontSize: 40,
    color: '#16a34a',
    fontWeight: '700',
  },

  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },

  successMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  successEmail: {
    fontWeight: '600',
    color: '#0b5fff',
  },
});

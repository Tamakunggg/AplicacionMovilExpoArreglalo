import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
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
            <Text variant="headlineLarge" style={{ fontWeight: '700', color: '#0b5fff' }}>
              Arreglalo
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 4, color: '#6b7280' }}>
              Expertos al servicio
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>

            <Text variant="titleLarge" style={styles.successTitle}>
              ¡Correo enviado!
            </Text>

            <Text variant="bodyMedium" style={styles.successMessage}>
              Hemos enviado un enlace de recuperación a{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
              {'\n\n'}
              Revisa tu correo (incluyendo la carpeta de spam) y sigue los pasos para crear una nueva contraseña.
            </Text>

            <Button 
              mode="contained"
              onPress={() => handleNavigate('/login')}
              style={styles.button}
            >
              Volver al inicio de sesión
            </Button>

            <Button 
              mode="outlined"
              onPress={() => {
                setSuccess(false);
                setEmail('');
              }}
              style={styles.button}
            >
              Intentar con otro correo
            </Button>
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
          <Text variant="headlineLarge" style={{ fontWeight: '700', color: '#0b5fff' }}>
            Arreglalo
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 4, color: '#6b7280' }}>
            Expertos al servicio
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="titleLarge" style={{ marginBottom: 12, fontWeight: '600' }}>
            Recuperar contraseña
          </Text>

          <Text variant="bodyMedium" style={styles.description}>
            Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
          </Text>

          <TextInput
            label="Correo electrónico"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            mode="outlined"
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button 
            mode="contained"
            onPress={handleSendReset}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Enviar enlace de recuperación
          </Button>

          <View style={styles.row}>
            <Text variant="bodySmall" style={{ color: '#6b7280' }}>
              ¿Recuerdas tu contraseña?
            </Text>
            <Button 
              mode="text" 
              onPress={() => handleNavigate('/login')}
              compact
            >
              Inicia sesión
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

  description: {
    marginBottom: 16,
    lineHeight: 20,
    color: '#6b7280',
  },

  input: {
    marginBottom: 12,
  },

  error: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },

  button: {
    marginVertical: 6,
  },

  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14 },

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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type Props = {
  onRegisterSuccess?: () => void;
  onNavigate?: (route: string) => void;
};

export default function Register({ onRegisterSuccess, onNavigate }: Props) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [professionista, setProfessionista] = useState(false);

  const [professionTitle, setProfessionTitle] = useState('');
  const [credential, setCredential] = useState('');
  const [yearsExp, setYearsExp] = useState('');

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Registro</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Soy profesionista</Text>
              <Switch value={professionista} onValueChange={setProfessionista} />
            </View>

            {professionista && (
              <View style={styles.professionBlock}>
                <Text style={styles.label}>Especialidad</Text>
                <TextInput style={styles.input} value={professionTitle} onChangeText={setProfessionTitle} />

                <Text style={styles.label}>Credencial / Registro</Text>
                <TextInput style={styles.input} value={credential} onChangeText={setCredential} />

                <Text style={styles.label}>Años de experiencia</Text>
                <TextInput style={styles.input} value={yearsExp} onChangeText={setYearsExp} keyboardType="numeric" />
              </View>
            )}

            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (onRegisterSuccess) return onRegisterSuccess();
                alert('Registro (simulado)');
              }}>
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            </Pressable>

            <View style={styles.rowCenter}>
              <Text style={styles.small}>¿Ya tienes cuenta?</Text>
              <Pressable onPress={() => (onNavigate ? onNavigate('/login') : router.push('/login'))}>
                <Text style={styles.link}> Inicia sesión</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#0b5fff', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  label: { color: '#374151', marginBottom: 6, marginTop: 8 },
  input: { height: 44, borderWidth: 1, borderColor: '#e6e9ef', borderRadius: 8, paddingHorizontal: 10, color: '#111827' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  professionBlock: { marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e6e9ef' },
  primaryButton: { height: 48, backgroundColor: '#0b5fff', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  rowCenter: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  small: { color: '#6b7280' },
  link: { color: '#0b5fff', fontWeight: '600' },
});

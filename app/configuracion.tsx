import { doc, updateDoc } from 'firebase/firestore';
import { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Switch, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import { AuthContext } from './auth-context';

export default function ConfiguracionScreen() {
  const { user, setUser } = useContext(AuthContext);

  const [nombre, setNombre] = useState(user?.name || '');
  const [correo, setCorreo] = useState(user?.email || '');
  const [notificaciones, setNotificaciones] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const guardarCambios = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No se encontró el usuario.');
      return;
    }

    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }

    if (!correo.trim()) {
      Alert.alert('Error', 'El correo no puede estar vacío.');
      return;
    }

    try {
      setGuardando(true);

      await updateDoc(doc(db, 'usuarios', user.id), {
        name: nombre.trim(),
        email: correo.trim(),
        notificaciones,
      });

      setUser({
        ...user,
        name: nombre.trim(),
        email: correo.trim(),
        notificaciones,
      });

      Alert.alert('Éxito', 'Configuración guardada correctamente.');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Configuración
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          <TextInput
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Correo"
            value={correo}
            onChangeText={setCorreo}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Notificaciones</Text>
              <Text style={styles.optionText}>
                Recibir avisos sobre mensajes, trabajos y contratos.
              </Text>
            </View>
            <Switch value={notificaciones} onValueChange={setNotificaciones} />
          </View>

          <Button
            mode="contained"
            onPress={guardarCambios}
            loading={guardando}
            disabled={guardando}
            style={styles.button}
          >
            Guardar cambios
          </Button>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <Text style={styles.optionText}>
            Más adelante aquí podrás cambiar tu contraseña y reforzar la seguridad de tu cuenta.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  optionText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  button: {
    marginTop: 18,
    borderRadius: 12,
  },
});
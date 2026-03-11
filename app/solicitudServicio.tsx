import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';
import { isEmpty } from '../utils/validators';
import { AuthContext } from './auth-context';

export default function SolicitudServicio() {
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();

  const profesionalId = String(params.profesionalId || '');
  const profesionalNombre = String(params.profesionalNombre || 'Profesionista');

  const [servicio, setServicio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    servicio: '',
    descripcion: '',
    direccion: '',
    fecha: '',
    hora: '',
    presupuesto: '',
  });

  const resetForm = () => {
    setServicio('');
    setDescripcion('');
    setDireccion('');
    setFecha('');
    setHora('');
    setPresupuesto('');
    setErrors({
      servicio: '',
      descripcion: '',
      direccion: '',
      fecha: '',
      hora: '',
      presupuesto: '',
    });
  };

  const validarFecha = (value: string) => {
    return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(value.trim());
  };

  const validarHora = (value: string) => {
    return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/.test(value.trim());
  };

  const validarFormulario = () => {
    const currentUid = auth?.currentUser?.uid;

    const nuevosErrores = {
      servicio: '',
      descripcion: '',
      direccion: '',
      fecha: '',
      hora: '',
      presupuesto: '',
    };

    if (isEmpty(servicio)) {
      nuevosErrores.servicio = 'Ingresa el tipo de servicio.';
    }

    if (isEmpty(descripcion)) {
      nuevosErrores.descripcion = 'Describe el problema o servicio solicitado.';
    }

    if (isEmpty(direccion)) {
      nuevosErrores.direccion = 'Ingresa la dirección.';
    }

    if (isEmpty(fecha)) {
      nuevosErrores.fecha = 'Ingresa la fecha.';
    } else if (!validarFecha(fecha)) {
      nuevosErrores.fecha = 'Usa el formato DD/MM/AAAA.';
    }

    if (isEmpty(hora)) {
      nuevosErrores.hora = 'Ingresa la hora.';
    } else if (!validarHora(hora)) {
      nuevosErrores.hora = 'Usa el formato 10:00 AM.';
    }

    if (!isEmpty(presupuesto)) {
      if (isNaN(Number(presupuesto))) {
        nuevosErrores.presupuesto = 'El presupuesto debe ser numérico.';
      } else if (Number(presupuesto) < 0) {
        nuevosErrores.presupuesto = 'El presupuesto no puede ser negativo.';
      }
    }

    setErrors(nuevosErrores);

    if (!currentUid) {
      return 'No se encontró el usuario autenticado.';
    }

    if (!profesionalId) {
      return 'No se encontró el profesionista seleccionado.';
    }

    const hayErrores = Object.values(nuevosErrores).some((error) => error !== '');
    if (hayErrores) {
      return 'Corrige los campos marcados.';
    }

    return '';
  };

  const guardarSolicitud = async () => {
    const error = validarFormulario();

    if (error) {
      Alert.alert('Formulario inválido', error);
      return;
    }

    try {
      setLoading(true);

      const currentUid = auth?.currentUser?.uid;

      await addDoc(collection(db, 'solicitudesServicio'), {
        servicio: servicio.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        fecha: fecha.trim(),
        hora: hora.trim(),
        presupuesto: presupuesto.trim() ? Number(presupuesto) : 0,
        estado: 'request',
        clientId: currentUid || '',
        clientName: user?.name || 'Cliente',
        professionalId: profesionalId,
        professionalName: profesionalNombre,
        professionalDigitalSignature: '',
        signedByClient: false,
        signedByProfessional: false,
        alreadyRated: false,
        createdAt: serverTimestamp(),
      });

      resetForm();
      Alert.alert('Éxito', 'La solicitud se envió correctamente.');
      router.replace('/trabajos');
    } catch (error) {
      console.error('Error al guardar la solicitud:', error);
      Alert.alert('Error', 'No se pudo guardar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Solicitud de servicio</Text>

        <Text style={styles.subtitle}>
          Profesionista seleccionado: {profesionalNombre}
        </Text>

        <TextInput
          label="Tipo de servicio"
          value={servicio}
          onChangeText={(text) => {
            setServicio(text);
            if (errors.servicio) setErrors((prev) => ({ ...prev, servicio: '' }));
          }}
          mode="outlined"
          style={styles.input}
          placeholder="Ej. Jardinería"
        />
        <HelperText type="error" visible={!!errors.servicio}>
          {errors.servicio}
        </HelperText>

        <TextInput
          label="Descripción del problema"
          value={descripcion}
          onChangeText={(text) => {
            setDescripcion(text);
            if (errors.descripcion) setErrors((prev) => ({ ...prev, descripcion: '' }));
          }}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
          placeholder="Describe lo que necesitas"
        />
        <HelperText type="error" visible={!!errors.descripcion}>
          {errors.descripcion}
        </HelperText>

        <TextInput
          label="Dirección"
          value={direccion}
          onChangeText={(text) => {
            setDireccion(text);
            if (errors.direccion) setErrors((prev) => ({ ...prev, direccion: '' }));
          }}
          mode="outlined"
          style={styles.input}
          placeholder="Calle, número, colonia"
        />
        <HelperText type="error" visible={!!errors.direccion}>
          {errors.direccion}
        </HelperText>

        <TextInput
          label="Fecha"
          value={fecha}
          onChangeText={(text) => {
            setFecha(text);
            if (errors.fecha) setErrors((prev) => ({ ...prev, fecha: '' }));
          }}
          mode="outlined"
          style={styles.input}
          placeholder="DD/MM/AAAA"
        />
        <HelperText type="error" visible={!!errors.fecha}>
          {errors.fecha}
        </HelperText>

        <TextInput
          label="Hora"
          value={hora}
          onChangeText={(text) => {
            setHora(text);
            if (errors.hora) setErrors((prev) => ({ ...prev, hora: '' }));
          }}
          mode="outlined"
          style={styles.input}
          placeholder="Ej. 10:00 AM"
        />
        <HelperText type="error" visible={!!errors.hora}>
          {errors.hora}
        </HelperText>

        <TextInput
          label="Presupuesto estimado"
          value={presupuesto}
          onChangeText={(text) => {
            setPresupuesto(text);
            if (errors.presupuesto) setErrors((prev) => ({ ...prev, presupuesto: '' }));
          }}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ej. 500"
        />
        <HelperText type="error" visible={!!errors.presupuesto}>
          {errors.presupuesto}
        </HelperText>

        <View style={styles.buttonsWrap}>
          <Button
            mode="contained"
            onPress={guardarSolicitud}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Enviar solicitud
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.secondaryButton}
          >
            Cancelar
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
  },
  buttonsWrap: {
    marginTop: 12,
  },
  button: {
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f97316',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
  },
});
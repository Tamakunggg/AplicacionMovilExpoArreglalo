import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { crearResena } from '../services/resenasService';

type Props = {
  profesionalId: string;
  clienteId: string;
  servicioId: string;
  onResenaGuardada?: () => void;
};

export default function FormularioResena({
  profesionalId,
  clienteId,
  servicioId,
  onResenaGuardada,
}: Props) {
  const [calificacion, setCalificacion] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const guardarResena = async () => {
    if (calificacion === 0) {
      Alert.alert('Error', 'Debes seleccionar una calificación.');
      return;
    }

    if (!comentario.trim()) {
      Alert.alert('Error', 'Debes escribir un comentario.');
      return;
    }

    try {
      setLoading(true);

      await crearResena({
        profesionalId,
        clienteId,
        servicioId,
        calificacion,
        comentario,
      });

      Alert.alert('Éxito', 'Tu reseña se guardó correctamente.');
      setCalificacion(0);
      setComentario('');

      onResenaGuardada?.();
    } catch (error: any) {
      Alert.alert('Aviso', error?.message || 'No se pudo guardar la reseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text variant="titleMedium" style={styles.titulo}>
        Deja tu reseña
      </Text>

      <View style={styles.estrellasContainer}>
        {[1, 2, 3, 4, 5].map((estrella) => (
          <TouchableOpacity
            key={estrella}
            onPress={() => setCalificacion(estrella)}
          >
            <MaterialIcons
              name={estrella <= calificacion ? 'star' : 'star-border'}
              size={36}
              color="#f5b301"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        label="Comentario"
        mode="outlined"
        multiline
        value={comentario}
        onChangeText={setComentario}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={guardarResena}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {loading ? <ActivityIndicator color="#fff" /> : 'Guardar reseña'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    elevation: 2,
  },
  titulo: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  estrellasContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  star: {
    marginRight: 6,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  button: {
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  buttonContent: {
    height: 48,
  },
});
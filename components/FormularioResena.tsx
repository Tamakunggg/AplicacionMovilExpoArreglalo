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
  professionalId: string;
  clientId: string;
  serviceId: string;
  onResenaGuardada?: () => void;
};

export default function FormularioResena({
  professionalId,
  clientId,
  serviceId,
  onResenaGuardada,
}: Props) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const guardarResena = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Debes seleccionar una calificación.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Error', 'Debes escribir un comentario.');
      return;
    }

    try {
      setLoading(true);

      await crearResena({
        professionalId,
        clientId,
        serviceId,
        rating,
        comment,
      });

      Alert.alert('Éxito', 'Tu reseña se guardó correctamente.');
      setRating(0);
      setComment('');

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
            onPress={() => setRating(estrella)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={estrella <= rating ? 'star' : 'star-border'}
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
        value={comment}
        onChangeText={setComment}
        style={styles.input}
        placeholder="Escribe cómo fue tu experiencia con el servicio"
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
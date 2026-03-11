import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addReview } from '../services/reviews';
import { isEmpty, isValidRating } from '../utils/validators';

export default function CalificarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const professionalId = String(params.professionalId || '');
  const clientId = String(params.clientId || '');
  const clientName = String(params.clientName || '');

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const submitReview = async () => {
    if (!professionalId || !clientId || !clientName) {
      Alert.alert('Error', 'Faltan datos para enviar la calificación.');
      return;
    }

    if (!isValidRating(rating)) {
      Alert.alert('Error', 'La calificación debe ser entre 1 y 5.');
      return;
    }

    if (isEmpty(comment.trim())) {
      Alert.alert('Error', 'Escribe un comentario.');
      return;
    }

    try {
      setLoading(true);

      await addReview({
        professionalId,
        clientId,
        clientName,
        rating,
        comment: comment.trim(),
      });

      Alert.alert('Éxito', 'Calificación enviada correctamente.');
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo guardar la calificación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Button mode="text" onPress={() => router.back()} style={styles.backButton}>
          Volver
        </Button>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Calificar servicio
            </Text>

            <Text style={styles.subtitle}>
              Selecciona una calificación y escribe tu comentario.
            </Text>

            <Text style={styles.label}>Calificación</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={star <= rating ? 'star' : 'star-border'}
                    size={38}
                    color="#f5b301"
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.selectedRating}>{rating} de 5 estrellas</Text>

            <TextInput
              label="Comentario"
              mode="outlined"
              multiline
              numberOfLines={5}
              value={comment}
              onChangeText={setComment}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              placeholder="Cuéntanos cómo fue el servicio"
            />

            <Button
              mode="contained"
              onPress={submitReview}
              style={styles.button}
              contentStyle={styles.buttonContent}
              loading={loading}
              disabled={loading}
            >
              Enviar calificación
            </Button>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 3,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#6b7280',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  star: {
    marginHorizontal: 4,
  },
  selectedRating: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#4b5563',
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderRadius: 14,
  },
  button: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#2563eb',
  },
  buttonContent: {
    height: 50,
  },
});
import * as Linking from 'expo-linking';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AyudaScreen() {
  const abrirCorreo = async () => {
    const url = 'mailto:soporte@arreglalo.com?subject=Soporte%20Arreglalo';
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('Error', 'No se pudo abrir el correo.');
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Ayuda y soporte
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>¿Necesitas ayuda?</Text>
          <Text style={styles.text}>
            Si tienes problemas con tu cuenta, contratos, reseñas o chats, puedes comunicarte con
            nuestro equipo de soporte.
          </Text>

          <Button
            mode="contained"
            onPress={abrirCorreo}
            icon="email-outline"
            style={styles.button}
          >
            Contactar soporte
          </Button>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>

          <Text style={styles.question}>¿Cómo contrato a un profesionista?</Text>
          <Text style={styles.answer}>
            Entra al perfil del profesionista y presiona el botón "Contratar ahora".
          </Text>

          <Text style={styles.question}>¿Cómo califico un servicio?</Text>
          <Text style={styles.answer}>
            Cuando el trabajo esté finalizado, podrás dejar una reseña desde la sección de trabajos.
          </Text>

          <Text style={styles.question}>¿Cómo guardo mi firma digital?</Text>
          <Text style={styles.answer}>
            Desde tu perfil puedes escribir y guardar tu firma digital para usarla en contratos.
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
    marginBottom: 10,
  },
  text: {
    color: '#4b5563',
    lineHeight: 21,
    marginBottom: 14,
  },
  button: {
    borderRadius: 12,
  },
  question: {
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
  },
  answer: {
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 20,
  },
});
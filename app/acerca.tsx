import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AcercaScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Acerca de Arreglalo
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Versión</Text>
          <Text style={styles.text}>1.0.0</Text>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Descripción</Text>
          <Text style={styles.text}>
            Arreglalo es una aplicación diseñada para conectar clientes con profesionistas de
            distintos oficios y servicios, facilitando la contratación, mensajería, contratos
            digitales y calificaciones.
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Objetivo</Text>
          <Text style={styles.text}>
            Brindar una plataforma práctica, segura y confiable para solicitar servicios del hogar
            y del trabajo diario.
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Desarrollado por</Text>
          <Text style={styles.text}>Equipo Arreglalo</Text>
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
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  text: {
    color: '#4b5563',
    lineHeight: 21,
  },
});
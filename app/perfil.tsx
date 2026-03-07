import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from './auth-context';

// Asegúrate de que los nombres de los archivos coincidan (Case sensitive en algunos sistemas)
import PerfilCliente from './perfilCliente';
import PerfilProfesionista from './perfilProfesionista';

export default function Perfil() {
  const { user, viewUser } = useContext(AuthContext);

  // 1. Determinamos qué datos mostrar:
  // Si 'viewUser' existe, estamos viendo el perfil de alguien más (desde Buscar o Favoritos).
  // Si es null, estamos viendo nuestro propio perfil ('user').
  const displayed = viewUser ?? user;

  // 2. Estado de carga por si los datos del usuario aún no están disponibles
  if (!displayed) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b5fff" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  // 3. Renderizado condicional basado en el campo 'type' de la base de datos
  // 'isViewingOther' será true si 'viewUser' tiene contenido, desactivando botones de edición.
  return displayed.type === 'profesionista' ? (
    <PerfilProfesionista 
      displayed={displayed} 
      isViewingOther={!!viewUser} 
    />
  ) : (
    <PerfilCliente 
      displayed={displayed} 
      isViewingOther={!!viewUser} 
    />
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f6f8fb' 
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
  }
});
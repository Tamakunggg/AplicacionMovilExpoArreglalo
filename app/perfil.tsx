import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { AuthContext } from './auth-context';
import { useRouter } from 'expo-router';

export default function Perfil() {
  const { logout, user, viewUser, setViewUser } = useContext(AuthContext);
  const { setUser } = useContext(AuthContext);
  const [favorite, setFavorite] = useState(false);
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const router = useRouter();

  const displayed = viewUser ?? user;

  if (!displayed) {
    return (
      <View style={styles.center}>
        <Text>No hay usuario</Text>
      </View>
    );
  }

  const isViewingOther = !!viewUser;
  const isProf = displayed.type === 'profesionista';
  const avatarSource = displayed.avatar
    ? (typeof displayed.avatar === 'string' ? { uri: displayed.avatar } : displayed.avatar)
    : null;

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {avatarSource ? (
              <Image source={avatarSource as any} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{displayed.name ? displayed.name.charAt(0) : 'U'}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name}>{displayed.name}</Text>
            <Text style={styles.role}>{isProf ? 'Profesionista' : 'Cliente'}</Text>
            <Text style={styles.email}>{displayed.email}</Text>
          </View>

          {isViewingOther ? (
            <Pressable style={styles.closeView} onPress={() => { setViewUser && setViewUser(null); router.back(); }}>
              <Text style={{ color: '#0b5fff', fontWeight: '700' }}>Volver</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          {isProf ? (
            <>
              <Text style={styles.sectionTitle}>Especialidad</Text>
              <Text style={styles.sectionText}>{displayed.specialty || '-'}</Text>

              <Text style={styles.sectionTitle}>Credencial</Text>
              <Text style={styles.sectionText}>{displayed.credential || '-'}</Text>

              <Text style={styles.sectionTitle}>Años de experiencia</Text>
              <Text style={styles.sectionText}>{displayed.yearsExp || '-'}</Text>

              <Text style={styles.sectionTitle}>Calificación</Text>
              <Text style={styles.sectionText}>{displayed.rating ? displayed.rating.toFixed(1) : 'Sin calificaciones'}</Text>

              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Reseñas</Text>
              {displayed.reviews && displayed.reviews.length > 0 ? (
                displayed.reviews.map((r) => (
                  <View key={r.id} style={styles.review}>
                    <Text style={styles.reviewAuthor}>{r.author} · {r.rating}★</Text>
                    <Text style={styles.reviewText}>{r.comment}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sectionText}>Aún no hay reseñas</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Información del cliente</Text>
              <Text style={styles.sectionText}>Teléfono: {displayed.phone || '-'}</Text>
              <Text style={styles.sectionText}>Correo: {displayed.email || '-'}</Text>

              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Calificación</Text>
              <Text style={styles.sectionText}>{displayed.rating ? displayed.rating.toFixed(1) : 'Sin calificaciones'}</Text>

              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Reseñas</Text>
              {displayed.reviews && displayed.reviews.length > 0 ? (
                displayed.reviews.map((r) => (
                  <View key={r.id} style={styles.review}>
                    <Text style={styles.reviewAuthor}>{r.author} · {r.rating}★</Text>
                    <Text style={styles.reviewText}>{r.comment}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sectionText}>Aún no hay reseñas</Text>
              )}
            </>
          )}

          {!isViewingOther && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Firma digital</Text>
              <Text style={styles.sectionText}>Esta firma será usada para firmar contratos. Se guarda y se oculta como contraseña.</Text>
              <TextInput placeholder="Tu firma digital" secureTextEntry value={user?.digitalSignature || ''} onChangeText={(t) => {
                setUser && setUser(user ? { ...user, digitalSignature: t } : user);
              }} style={{ height: 44, borderColor: '#e6e9ef', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginTop: 8 }} />
            </>
          )}

          {isViewingOther ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Pressable style={[styles.primaryBtn, { flex: 1, marginRight: 8 }]} onPress={() => setFavorite(f => !f)}>
                <Text style={styles.primaryText}>{favorite ? 'Favorito' : 'Guardar favorito'}</Text>
              </Pressable>
              <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setHireModalVisible(true)}>
                <Text style={styles.primaryText}>Contratar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal visible={hireModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ width: '92%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Contratar a {displayed.name}</Text>
            <TextInput placeholder="Descripción del trabajo" value={jobDesc} onChangeText={setJobDesc} multiline style={{ height: 80, borderColor: '#e6e9ef', borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Ubicación del cliente" value={jobLocation} onChangeText={setJobLocation} style={{ height: 44, borderColor: '#e6e9ef', borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Contacto (tel/email)" value={contactInfo} onChangeText={setContactInfo} style={{ height: 44, borderColor: '#e6e9ef', borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={[styles.primaryBtn, { flex: 1, marginRight: 8 }]} onPress={() => {
                if (!jobDesc) { Alert.alert('Error', 'Describe el trabajo'); return; }
                Alert.alert('Solicitud enviada', `Se solicitó a ${displayed.name}`);
                setHireModalVisible(false);
                setJobDesc(''); setJobLocation(''); setContactInfo('');
              }}>
                <Text style={styles.primaryText}>Enviar solicitud</Text>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setHireModalVisible(false)}>
                <Text style={styles.secondaryText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#e6eefc', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 32, color: '#0b5fff', fontWeight: '700' },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' },
  role: { color: '#6b7280', marginTop: 4 },
  email: { color: '#374151', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontWeight: '600', marginTop: 8 },
  sectionText: { color: '#374151', marginTop: 4 },
  review: { marginTop: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e6e9ef' },
  reviewAuthor: { fontWeight: '600' },
  reviewText: { color: '#374151', marginTop: 4 },
  logoutBtn: { height: 48, marginTop: 16, backgroundColor: '#ef4444', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700' },
  primaryBtn: { height: 48, marginTop: 16, backgroundColor: '#0b5fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { height: 48, marginTop: 16, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e6e9ef' },
  secondaryText: { color: '#374151', fontWeight: '700' },
  closeView: { position: 'absolute', right: 12, top: 12 },
});

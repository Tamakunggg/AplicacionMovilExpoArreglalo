import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';

const CATEGORIES = [
  "Electricista", "Plomero", "Carpintero", "Jardinero", "Pintor",
  "Cerrajero", "Soldador", "Albañil", "Fontanero", "Climatización"
];

const EXP_OPTIONS = [
  { label: "Menos de 1 año", value: "0-1" },
  { label: "1 a 3 años", value: "1-3" },
  { label: "3 a 5 años", value: "3-5" },
  { label: "5 a 10 años", value: "5-10" },
  { label: "Más de 10 años", value: "10+" },
];

export default function Register({ onRegisterSuccess, onNavigate }: any) {
  const router = useRouter();

  // Estados de Nombre Divididos
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(''); // Nueva Mejora: Ubicación
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [professionista, setProfessionista] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState('');
  const [yearsExp, setYearsExp] = useState('1-3');
  const [bio, setBio] = useState('');

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !location) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "usuarios", uid), {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Mantenemos el nombre completo para el perfil
        email,
        phone,
        location,
        type: professionista ? "profesionista" : "cliente",
        categories: professionista ? selectedCategories : [],
        specialty: professionista ? specialty : null,
        yearsExp: professionista ? yearsExp : null,
        bio: professionista ? bio : null,
        rating: 0,
        createdAt: serverTimestamp()
      });

      alert("¡Cuenta creada correctamente!");
      onRegisterSuccess ? onRegisterSuccess() : router.replace('/login');
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.title}>Registro</Text>

          <View style={styles.card}>
            {/* Nombres y Apellidos en la misma fila */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Nombre(s)</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Ej. Juan" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Apellidos</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Ej. Pérez" />
              </View>
            </View>

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Ciudad / Zona</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ej. CDMX" />
              </View>
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { borderWidth: 0, flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? "Ocultar" : "Mostrar"}</Text>
              </Pressable>
            </View>

            {/* Indicador de fortaleza (Mejora visual) */}
            {password.length > 0 && (
              <View style={[styles.strengthBar, { width: password.length > 8 ? '100%' : '40%', backgroundColor: password.length > 8 ? '#10b981' : '#ef4444' }]} />
            )}

            <View style={styles.switchRow}>
              <Text style={styles.label}>¿Quieres ofrecer tus servicios?</Text>
              <Switch value={professionista} onValueChange={setProfessionista} trackColor={{ true: '#0b5fff' }} />
            </View>

            {professionista && (
              <View style={styles.professionBlock}>
                <Text style={styles.sectionTitle}>Perfil del Profesional</Text>
                
                <Text style={styles.label}>¿Qué oficios realizas?</Text>
                <View style={styles.tagContainer}>
                  {CATEGORIES.map((cat) => (
                    <Pressable key={cat} onPress={() => toggleCategory(cat)} style={[styles.tag, selectedCategories.includes(cat) && styles.tagSelected]}>
                      <Text style={[styles.tagText, selectedCategories.includes(cat) && styles.tagTextSelected]}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Especialidad detallada</Text>
                <TextInput style={styles.input} placeholder="Ej. Plomería industrial y gas" value={specialty} onChangeText={setSpecialty} />

                <Text style={styles.label}>Experiencia</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={yearsExp} onValueChange={setYearsExp} style={styles.picker}>
                    {EXP_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                  </Picker>
                </View>

                <Text style={styles.label}>Descripción breve (Bio)</Text>
                <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} multiline placeholder="Cuéntales por qué deberían contratarte..." />
              </View>
            )}

            <Pressable style={styles.primaryBtn} onPress={handleRegister}>
              <Text style={styles.primaryBtnText}>Registrarme ahora</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 32, fontWeight: '900', color: '#0b5fff', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#4b5563', marginBottom: 5, marginTop: 15, fontWeight: '600', fontSize: 13 },
  input: { height: 48, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 15, backgroundColor: '#f9fafb' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#f9fafb' },
  eyeBtn: { paddingRight: 15 },
  eyeText: { color: '#0b5fff', fontWeight: 'bold', fontSize: 12 },
  strengthBar: { height: 4, marginTop: 6, borderRadius: 2 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937', marginTop: 10 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#0b5fff' },
  tagSelected: { backgroundColor: '#0b5fff' },
  tagText: { color: '#0b5fff', fontSize: 12, fontWeight: '600' },
  tagTextSelected: { color: '#fff' },
  pickerContainer: { height: 48, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, justifyContent: 'center', backgroundColor: '#f9fafb' },
  picker: { width: '100%' },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  primaryBtn: { height: 55, backgroundColor: '#0b5fff', borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
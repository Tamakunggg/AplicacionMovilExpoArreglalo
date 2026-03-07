import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Button, Chip, Switch, Text, TextInput } from 'react-native-paper';
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
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [professionista, setProfessionista] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState('');
  const [yearsExp, setYearsExp] = useState('1-3');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "usuarios", uid), {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
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
      if (onRegisterSuccess) {
        onRegisterSuccess();
      } else {
        router.replace('/login');
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <Text variant="headlineLarge" style={styles.title}>
            Registro
          </Text>

          <View style={styles.card}>
            {/* Nombres y Apellidos */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextInput 
                  label="Nombre(s)"
                  value={firstName} 
                  onChangeText={setFirstName} 
                  placeholder="Ej. Juan"
                  mode="outlined"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput 
                  label="Apellidos"
                  value={lastName} 
                  onChangeText={setLastName} 
                  placeholder="Ej. Pérez"
                  mode="outlined"
                  style={styles.input}
                />
              </View>
            </View>

            <TextInput 
              label="Correo electrónico"
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextInput 
                  label="Teléfono"
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                  maxLength={10}
                  mode="outlined"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput 
                  label="Ciudad / Zona"
                  value={location} 
                  onChangeText={setLocation} 
                  placeholder="Ej. CDMX"
                  mode="outlined"
                  style={styles.input}
                />
              </View>
            </View>

            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                ¿Quieres ofrecer tus servicios?
              </Text>
              <Switch value={professionista} onValueChange={setProfessionista} />
            </View>

            {professionista && (
              <View style={styles.professionBlock}>
                <Text variant="titleMedium" style={{ fontWeight: '800', marginTop: 10 }}>
                  Perfil del Profesional
                </Text>
                
                <Text variant="bodyMedium" style={{ fontWeight: '600', marginTop: 15 }}>
                  ¿Qué oficios realizas?
                </Text>
                <View style={styles.tagContainer}>
                  {CATEGORIES.map((cat) => (
                    <Chip
                      key={cat}
                      selected={selectedCategories.includes(cat)}
                      onPress={() => toggleCategory(cat)}
                      mode={selectedCategories.includes(cat) ? 'flat' : 'outlined'}
                      style={{ marginRight: 6, marginBottom: 6 }}
                    >
                      {cat}
                    </Chip>
                  ))}
                </View>

                <TextInput 
                  label="Especialidad detallada"
                  placeholder="Ej. Plomería industrial y gas" 
                  value={specialty} 
                  onChangeText={setSpecialty}
                  mode="outlined"
                  style={styles.input}
                />

                <Text variant="bodyMedium" style={{ fontWeight: '600', marginTop: 15 }}>
                  Experiencia
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={yearsExp} onValueChange={setYearsExp} style={styles.picker}>
                    {EXP_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                  </Picker>
                </View>

                <TextInput 
                  label="Descripción breve (Bio)"
                  value={bio} 
                  onChangeText={setBio} 
                  multiline 
                  numberOfLines={4}
                  placeholder="Cuéntales por qué deberían contratarte..." 
                  mode="outlined"
                  style={[styles.input, styles.textArea]}
                />
              </View>
            )}

            <Button 
              mode="contained" 
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.primaryBtn}
            >
              Registrarme ahora
            </Button>
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
  title: { fontWeight: '900', color: '#0b5fff', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  input: { marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  professionBlock: { marginTop: 20 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 12 },
  pickerContainer: { height: 48, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, justifyContent: 'center', backgroundColor: '#f9fafb', marginBottom: 12 },
  picker: { width: '100%' },
  textArea: { height: 100 },
  primaryBtn: { marginTop: 30, paddingVertical: 6 },
});
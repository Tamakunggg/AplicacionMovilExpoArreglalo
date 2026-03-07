import React, { useContext, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from './auth-context';

type Job = {
  id: string;
  title: string;
  description: string;
  budget: number;
  contractId?: string;
  professional: { id: string; name: string; digitalSignature?: string };
  client: { id: string; name: string };
  status: 'completed' | 'active' | 'request';
  signedByClient?: boolean;
  signedByProfessional?: boolean;
  contract?: {
    address?: string;
    agreement?: string;
    description?: string;
    eta?: string;
    payment?: number;
    clientSignature?: string;
    professionalSignature?: string;
  };
};

const SAMPLE_JOBS: Job[] = [
  { id: 'j1', title: 'Arreglo de instalación eléctrica', description: 'Revisar y reparar tablero eléctrico', budget: 1200, professional: { id: 'p1', name: 'Juan Pérez', digitalSignature: 'JPerezSig' }, client: { id: 'c1', name: 'Cliente Demo' }, status: 'completed', signedByClient: true, signedByProfessional: true, contract: { address: 'Calle 1 #123', agreement: 'Ambas partes aceptan el trabajo y el pago', description: 'Reparación completa del tablero, reemplazo de piezas dañadas', eta: '2 días', payment: 1200, clientSignature: 'ClienteSig', professionalSignature: 'JPerezSig' } },
  { id: 'j2', title: 'Pintura de sala', description: 'Pintar sala 20m2', budget: 800, professional: { id: 'p2', name: 'María Gómez', digitalSignature: 'MGomezSig' }, client: { id: 'c1', name: 'Cliente Demo' }, status: 'active', signedByClient: true, signedByProfessional: true, contract: { address: 'Avenida 5 #45', agreement: 'Pintura de sala conforme a colores acordados', description: 'Limpieza previa y 2 manos de pintura', eta: '1 día', payment: 800, clientSignature: 'ClienteSig', professionalSignature: 'MGomezSig' } },
  { id: 'j3', title: 'Instalación de tubería', description: 'Cambiar tubería en cocina', budget: 600, professional: { id: 'p3', name: 'Ana López', digitalSignature: 'ALopezSig' }, client: { id: 'c1', name: 'Cliente Demo' }, status: 'request', signedByClient: false, signedByProfessional: false },
];

export default function Trabajos() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState<Job[]>(SAMPLE_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [createContractVisible, setCreateContractVisible] = useState(false);
  const [form, setForm] = useState({ address: '', agreement: '', description: '', eta: '', payment: '' });
  const [signatureInput, setSignatureInput] = useState('');

  const completed = jobs.filter(j => j.status === 'completed');
  const active = jobs.filter(j => j.status === 'active');
  const requests = jobs.filter(j => j.status === 'request');

  const openContractView = (job: Job) => {
    setSelectedJob(job);
    setContractModalVisible(true);
  };

  const openCreateContract = (job: Job) => {
    setSelectedJob(job);
    setForm({ address: '', agreement: '', description: job.description || '', eta: '', payment: String(job.budget) });
    setSignatureInput('');
    setCreateContractVisible(true);
  };

  const submitCreateContract = () => {
    if (!selectedJob) return;
    if (!form.address || !form.agreement || !form.description || !form.eta || !form.payment) {
      Alert.alert('Error', 'Completa todos los campos del contrato');
      return;
    }
    if (!user || !user.digitalSignature) {
      Alert.alert('Falta firma', 'Configura tu firma digital en tu perfil antes de crear el contrato');
      return;
    }

    // verify entered signature matches stored signature
    if (signatureInput !== user.digitalSignature) {
      Alert.alert('Firma inválida', 'La firma ingresada no coincide con tu firma registrada');
      return;
    }

    // professional must have registered signature
    if (!selectedJob.professional.digitalSignature) {
      Alert.alert('Profesional sin firma', 'El profesional no ha registrado su firma digital. Pídele que la registre en su perfil antes de crear el contrato.');
      return;
    }

    setJobs(prev => prev.map(j => j.id === selectedJob.id ? {
      ...j,
      contract: {
        address: form.address,
        agreement: form.agreement,
        description: form.description,
        eta: form.eta,
        payment: Number(form.payment),
        clientSignature: user.digitalSignature,
        professionalSignature: j.professional.digitalSignature,
      },
      signedByClient: true,
      signedByProfessional: true,
      status: 'active'
    } : j));

    setCreateContractVisible(false);
    Alert.alert('Contrato creado', 'El contrato fue firmado por ambas partes (simulado).');
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top","bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Trabajos realizados</Text>
        {completed.length === 0 ? <Text style={styles.empty}>No hay trabajos realizados</Text> : (
          <FlatList data={completed} keyExtractor={i => i.id} scrollEnabled={false} renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.jobMeta}>{item.description}</Text>
              <Text style={styles.jobMeta}>Presupuesto: ${item.budget}</Text>
              <Text style={styles.jobMeta}>Profesional: {item.professional.name}</Text>
            </View>
          )} />
        )}

        <Text style={[styles.heading, { marginTop: 12 }]}>Trabajos activos</Text>
        {active.length === 0 ? <Text style={styles.empty}>No hay trabajos activos</Text> : (
          <FlatList data={active} keyExtractor={i => i.id} scrollEnabled={false} renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.jobMeta}>{item.description}</Text>
              <Text style={styles.jobMeta}>Presupuesto: ${item.budget}</Text>
              <Text style={styles.jobMeta}>Profesional: {item.professional.name}</Text>
              <Button 
                mode="contained" 
                onPress={() => openContractView(item)}
                style={{ marginTop: 12 }}
              >
                Ver contrato
              </Button>
            </View>
          )} />
        )}

        <Text style={[styles.heading, { marginTop: 12 }]}>Solicitudes enviadas</Text>
        {requests.length === 0 ? <Text style={styles.empty}>No hay solicitudes</Text> : (
          <FlatList data={requests} keyExtractor={i => i.id} scrollEnabled={false} renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.jobMeta}>{item.description}</Text>
              <Text style={styles.jobMeta}>Presupuesto: ${item.budget}</Text>
              <Text style={styles.jobMeta}>Profesional: {item.professional.name}</Text>
              <Text style={styles.jobMeta}>Firmado por cliente: {item.signedByClient ? 'Sí' : 'No'}</Text>
              <Text style={styles.jobMeta}>Firmado por profesional: {item.signedByProfessional ? 'Sí' : 'No'}</Text>
              <Button 
                mode="contained" 
                onPress={() => openCreateContract(item)}
                style={{ marginTop: 12 }}
              >
                Crear contrato
              </Button>
            </View>
          )} />
        )}

        <View style={{ height: 120 }} />

        <Modal visible={contractModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>Contrato</Text>
              {selectedJob?.contract ? (
                <ScrollView style={{ maxHeight: 300 }}>
                  <Text style={{ fontWeight: '700', marginTop: 6 }}>Trabajo: {selectedJob?.title}</Text>
                  <Text style={{ marginTop: 6 }}>Dirección: {selectedJob?.contract?.address}</Text>
                  <Text style={{ marginTop: 6 }}>Acuerdo: {selectedJob?.contract?.agreement}</Text>
                  <Text style={{ marginTop: 6 }}>Descripción: {selectedJob?.contract?.description}</Text>
                  <Text style={{ marginTop: 6 }}>ETA: {selectedJob?.contract?.eta}</Text>
                  <Text style={{ marginTop: 6 }}>Pago: ${selectedJob?.contract?.payment}</Text>
                  <Text style={{ marginTop: 6 }}>Firmado por cliente: {selectedJob?.signedByClient ? 'Sí' : 'No'}</Text>
                  <Text style={{ marginTop: 6 }}>Firmado por profesional: {selectedJob?.signedByProfessional ? 'Sí' : 'No'}</Text>
                </ScrollView>
              ) : (
                <Text>No hay contrato asociado a este trabajo.</Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                <Button 
                  mode="contained" 
                  onPress={() => setContractModalVisible(false)}
                  style={{ flex: 1 }}
                >
                  Cerrar
                </Button>
                {selectedJob && !selectedJob.contract && (
                  <Button 
                    mode="outlined" 
                    onPress={() => { setContractModalVisible(false); openCreateContract(selectedJob); }}
                    style={{ flex: 1 }}
                  >
                    Crear contrato
                  </Button>
                )}
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={createContractVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>Crear contrato</Text>
              <TextInput 
                label="Dirección" 
                value={form.address} 
                onChangeText={v => setForm(f => ({ ...f, address: v }))} 
                mode="outlined"
                style={styles.input}
              />
              <TextInput 
                label="Acuerdo (resumen)" 
                value={form.agreement} 
                onChangeText={v => setForm(f => ({ ...f, agreement: v }))}
                mode="outlined"
                style={styles.input}
              />
              <TextInput 
                label="Descripción completa" 
                value={form.description} 
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
                multiline
                numberOfLines={4}
                mode="outlined"
                style={[styles.input, { height: 100 }]}
              />
              <TextInput 
                label="ETA (p.ej. 2 días)" 
                value={form.eta} 
                onChangeText={v => setForm(f => ({ ...f, eta: v }))}
                mode="outlined"
                style={styles.input}
              />
              <TextInput 
                label="Pago total" 
                keyboardType="numeric" 
                value={form.payment} 
                onChangeText={v => setForm(f => ({ ...f, payment: v }))}
                mode="outlined"
                style={styles.input}
              />
              <Text style={{ marginTop: 6, marginBottom: 6, color: '#374151' }}>
                Ingresa tu firma (oculta) para confirmar. Debe coincidir con la firma registrada en tu perfil.
              </Text>
              <TextInput 
                label="Firma" 
                secureTextEntry 
                value={signatureInput} 
                onChangeText={setSignatureInput}
                mode="outlined"
                style={styles.input}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button 
                  mode="contained" 
                  onPress={submitCreateContract}
                  style={{ flex: 1 }}
                >
                  Crear
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setCreateContractVisible(false)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  container: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  empty: { color: '#6b7280' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  jobTitle: { fontWeight: '700' },
  jobMeta: { color: '#374151', marginTop: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { width: '92%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  input: { marginBottom: 12 },
});

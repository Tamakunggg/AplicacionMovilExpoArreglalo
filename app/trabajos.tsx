import { MaterialIcons } from '@expo/vector-icons';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { addReview } from '../services/reviews';
import { isEmpty, isValidRating } from '../utils/validators';
import { AuthContext } from './auth-context';

type Job = {
  id: string;
  title: string;
  description: string;
  budget: number;
  contractId?: string;
  professional: {
    id: string;
    name: string;
    digitalSignature?: string;
  };
  client: {
    id: string;
    name: string;
  };
  status: 'completed' | 'active' | 'request';
  signedByClient?: boolean;
  signedByProfessional?: boolean;
  alreadyRated?: boolean;
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

export default function Trabajos() {
  const { user } = useContext(AuthContext);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [createContractVisible, setCreateContractVisible] = useState(false);

  const [form, setForm] = useState({
    address: '',
    agreement: '',
    description: '',
    eta: '',
    payment: '',
  });

  const [signatureInput, setSignatureInput] = useState('');

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [jobToRate, setJobToRate] = useState<Job | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;

    if (!currentUid) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'solicitudesServicio'),
      where('clientId', '==', currentUid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista: Job[] = snapshot.docs.map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.servicio || 'Servicio',
            description: data.descripcion || '',
            budget: Number(data.presupuesto || 0),
            professional: {
              id: data.professionalId || '',
              name: data.professionalName || 'Profesionista',
              digitalSignature: data.professionalDigitalSignature || '',
            },
            client: {
              id: data.clientId || '',
              name: data.clientName || 'Cliente',
            },
            status: (data.estado || 'request') as 'completed' | 'active' | 'request',
            signedByClient: Boolean(data.signedByClient),
            signedByProfessional: Boolean(data.signedByProfessional),
            alreadyRated: Boolean(data.alreadyRated),
            contract: data.contract
              ? {
                  address: data.contract.address || '',
                  agreement: data.contract.agreement || '',
                  description: data.contract.description || '',
                  eta: data.contract.eta || '',
                  payment: Number(data.contract.payment || 0),
                  clientSignature: data.contract.clientSignature || '',
                  professionalSignature: data.contract.professionalSignature || '',
                }
              : undefined,
          };
        });

        setJobs(lista);
        setLoading(false);
      },
      (error: any) => {
        console.error('Error escuchando solicitudes:', error);

        if (
          String(error?.message || '').includes('index') ||
          String(error?.message || '').includes('requires an index')
        ) {
          Alert.alert(
            'Índice de Firebase requerido',
            'Firestore necesita un índice para esta consulta. Revisa la consola y crea el índice desde el enlace que aparece en el error.'
          );
        } else {
          Alert.alert('Error', 'No se pudieron cargar las solicitudes en tiempo real.');
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const completed = jobs.filter((j) => j.status === 'completed');
  const active = jobs.filter((j) => j.status === 'active');
  const requests = jobs.filter((j) => j.status === 'request');

  const getStatusColor = (status: Job['status']) => {
    if (status === 'request') return '#f59e0b';
    if (status === 'active') return '#2563eb';
    return '#16a34a';
  };

  const getStatusLabel = (status: Job['status']) => {
    if (status === 'request') return 'Pendiente';
    if (status === 'active') return 'En proceso';
    return 'Finalizado';
  };

  const resetContractForm = () => {
    setForm({
      address: '',
      agreement: '',
      description: '',
      eta: '',
      payment: '',
    });
    setSignatureInput('');
    setSelectedJob(null);
  };

  const resetRatingForm = () => {
    setJobToRate(null);
    setRatingValue(5);
    setRatingComment('');
  };

  const openContractView = (job: Job) => {
    setSelectedJob(job);
    setContractModalVisible(true);
  };

  const openCreateContract = (job: Job) => {
    setSelectedJob(job);
    setForm({
      address: '',
      agreement: '',
      description: job.description || '',
      eta: '',
      payment: String(job.budget),
    });
    setSignatureInput('');
    setCreateContractVisible(true);
  };

  const submitCreateContract = async () => {
    if (!selectedJob) {
      Alert.alert('Error', 'No se encontró la solicitud seleccionada.');
      return;
    }

    if (
      isEmpty(form.address) ||
      isEmpty(form.agreement) ||
      isEmpty(form.description) ||
      isEmpty(form.eta) ||
      isEmpty(form.payment)
    ) {
      Alert.alert('Error', 'Completa todos los campos del contrato.');
      return;
    }

    if (isNaN(Number(form.payment)) || Number(form.payment) <= 0) {
      Alert.alert('Error', 'El pago total debe ser un número mayor a cero.');
      return;
    }

    if (!user || !user.digitalSignature) {
      Alert.alert(
        'Falta firma',
        'Configura tu firma digital en tu perfil antes de crear el contrato.'
      );
      return;
    }

    if (signatureInput.trim() !== user.digitalSignature.trim()) {
      Alert.alert('Firma inválida', 'La firma ingresada no coincide con tu firma registrada.');
      return;
    }

    try {
      const contractData = {
        address: form.address.trim(),
        agreement: form.agreement.trim(),
        description: form.description.trim(),
        eta: form.eta.trim(),
        payment: Number(form.payment),
        clientSignature: user.digitalSignature.trim(),
        professionalSignature: 'firmaPendiente',
      };

      await updateDoc(doc(db, 'solicitudesServicio', selectedJob.id), {
        contract: contractData,
        signedByClient: true,
        signedByProfessional: true,
        estado: 'active',
      });

      setCreateContractVisible(false);
      resetContractForm();

      Alert.alert('Contrato creado', 'El contrato fue creado correctamente.');
    } catch (error) {
      console.error('Error al crear contrato:', error);
      Alert.alert('Error', 'No se pudo crear el contrato.');
    }
  };

  const finalizarTrabajo = async (job: Job) => {
    if (!job?.id) {
      Alert.alert('Error', 'No se encontró el trabajo a finalizar.');
      return;
    }

    try {
      await updateDoc(doc(db, 'solicitudesServicio', job.id), {
        estado: 'completed',
      });

      Alert.alert(
        'Éxito',
        'El trabajo se marcó como finalizado y debe pasar a "Trabajos realizados".'
      );
    } catch (error) {
      console.error('Error al finalizar trabajo:', error);
      Alert.alert('Error', 'No se pudo finalizar el trabajo.');
    }
  };

  const abrirCalificacion = (job: Job) => {
    if (job.alreadyRated) {
      Alert.alert('Información', 'Este trabajo ya fue calificado.');
      return;
    }

    setJobToRate(job);
    setRatingValue(5);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const guardarCalificacion = async () => {
    if (!jobToRate) {
      Alert.alert('Error', 'No se encontró el trabajo a calificar.');
      return;
    }

    if (!user?.id || !user?.name) {
      Alert.alert('Error', 'No se encontró la información del usuario.');
      return;
    }

    if (!isValidRating(ratingValue)) {
      Alert.alert('Error', 'La calificación debe ser entre 1 y 5.');
      return;
    }

    if (isEmpty(ratingComment.trim())) {
      Alert.alert('Error', 'Escribe un comentario sobre el servicio.');
      return;
    }

    setSavingRating(true);

    try {
      await addReview({
        professionalId: jobToRate.professional.id,
        clientId: user.id,
        clientName: user.name,
        rating: ratingValue,
        comment: ratingComment.trim(),
      });

      await updateDoc(doc(db, 'solicitudesServicio', jobToRate.id), {
        alreadyRated: true,
      });

      setRatingModalVisible(false);
      resetRatingForm();

      Alert.alert('Gracias', 'La calificación se guardó correctamente.');
    } catch (error) {
      console.error('Error guardando calificación:', error);
      Alert.alert('Error', 'No se pudo guardar la calificación.');
    } finally {
      setSavingRating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text>Cargando solicitudes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Trabajos realizados</Text>
        {completed.length === 0 ? (
          <Text style={styles.empty}>No hay trabajos realizados.</Text>
        ) : (
          <FlatList
            data={completed}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobMeta}>{item.description}</Text>
                <Text style={styles.jobMeta}>Presupuesto: ${item.budget}</Text>
                <Text style={styles.jobMeta}>Profesional: {item.professional.name}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  Estado actual: {getStatusLabel(item.status)}
                </Text>

                {item.alreadyRated ? (
                  <Button mode="outlined" disabled style={styles.topButton}>
                    Servicio ya calificado
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={() => abrirCalificacion(item)}
                    style={styles.topButton}
                  >
                    Calificar servicio
                  </Button>
                )}
              </View>
            )}
          />
        )}

        <Text style={[styles.heading, { marginTop: 12 }]}>Trabajos activos</Text>
        {active.length === 0 ? (
          <Text style={styles.empty}>No hay trabajos activos.</Text>
        ) : (
          <FlatList
            data={active}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobMeta}>{item.description}</Text>
                <Text style={styles.jobMeta}>Presupuesto: ${item.budget}</Text>
                <Text style={styles.jobMeta}>Profesional: {item.professional.name}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  Estado actual: {getStatusLabel(item.status)}
                </Text>

                <View style={styles.buttonGroup}>
                  <Button mode="contained" onPress={() => openContractView(item)}>
                    Ver contrato
                  </Button>

                  <Button mode="outlined" onPress={() => finalizarTrabajo(item)}>
                    Finalizar trabajo
                  </Button>
                </View>
              </View>
            )}
          />
        )}

        <Text style={[styles.heading, { marginTop: 12 }]}>Solicitudes enviadas</Text>
        {requests.length === 0 ? (
          <Text style={styles.empty}>No hay solicitudes.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobMeta}>{item.description}</Text>
                <Text style={styles.jobMeta}>Presupuesto: ${item.budget}</Text>
                <Text style={styles.jobMeta}>Profesional: {item.professional.name}</Text>
                <Text style={styles.jobMeta}>
                  Firmado por cliente: {item.signedByClient ? 'Sí' : 'No'}
                </Text>
                <Text style={styles.jobMeta}>
                  Firmado por profesional: {item.signedByProfessional ? 'Sí' : 'No'}
                </Text>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  Estado actual: {getStatusLabel(item.status)}
                </Text>

                <Button
                  mode="contained"
                  onPress={() => openCreateContract(item)}
                  style={styles.topButton}
                >
                  Crear contrato
                </Button>
              </View>
            )}
          />
        )}

        <View style={{ height: 120 }} />

        <Modal visible={contractModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Contrato</Text>

              {selectedJob?.contract ? (
                <ScrollView style={{ maxHeight: 300 }}>
                  <Text style={styles.contractTitle}>Trabajo: {selectedJob.title}</Text>
                  <Text style={styles.contractLine}>
                    Dirección: {selectedJob.contract.address}
                  </Text>
                  <Text style={styles.contractLine}>
                    Acuerdo: {selectedJob.contract.agreement}
                  </Text>
                  <Text style={styles.contractLine}>
                    Descripción: {selectedJob.contract.description}
                  </Text>
                  <Text style={styles.contractLine}>ETA: {selectedJob.contract.eta}</Text>
                  <Text style={styles.contractLine}>
                    Pago: ${selectedJob.contract.payment}
                  </Text>
                  <Text style={styles.contractLine}>
                    Firmado por cliente: {selectedJob.signedByClient ? 'Sí' : 'No'}
                  </Text>
                  <Text style={styles.contractLine}>
                    Firmado por profesional: {selectedJob.signedByProfessional ? 'Sí' : 'No'}
                  </Text>
                </ScrollView>
              ) : (
                <Text>No hay contrato asociado a este trabajo.</Text>
              )}

              <View style={styles.modalButtonRow}>
                <Button
                  mode="contained"
                  onPress={() => {
                    setContractModalVisible(false);
                    setSelectedJob(null);
                  }}
                  style={{ flex: 1 }}
                >
                  Cerrar
                </Button>

                {selectedJob && !selectedJob.contract && (
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setContractModalVisible(false);
                      openCreateContract(selectedJob);
                    }}
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
              <Text style={styles.modalTitle}>Crear contrato</Text>

              <TextInput
                label="Dirección"
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Acuerdo (resumen)"
                value={form.agreement}
                onChangeText={(v) => setForm((f) => ({ ...f, agreement: v }))}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Descripción completa"
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                numberOfLines={4}
                mode="outlined"
                style={[styles.input, { height: 100 }]}
              />

              <TextInput
                label="ETA (p. ej. 2 días)"
                value={form.eta}
                onChangeText={(v) => setForm((f) => ({ ...f, eta: v }))}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Pago total"
                keyboardType="numeric"
                value={form.payment}
                onChangeText={(v) => setForm((f) => ({ ...f, payment: v }))}
                mode="outlined"
                style={styles.input}
              />

              <Text style={styles.helperText}>
                Ingresa tu firma para confirmar. Debe coincidir con la firma registrada en tu
                perfil.
              </Text>

              <TextInput
                label="Firma"
                secureTextEntry
                value={signatureInput}
                onChangeText={setSignatureInput}
                mode="outlined"
                style={styles.input}
              />

              <View style={styles.modalButtonRow}>
                <Button mode="contained" onPress={submitCreateContract} style={{ flex: 1 }}>
                  Crear
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setCreateContractVisible(false);
                    resetContractForm();
                  }}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={ratingModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Calificar servicio</Text>

              <Text style={{ marginBottom: 12 }}>
                ¿Cómo calificarías el trabajo de {jobToRate?.professional.name}?
              </Text>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRatingValue(star)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={star <= ratingValue ? 'star' : 'star-border'}
                      size={38}
                      color="#f5b301"
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.selectedRatingText}>
                {ratingValue} de 5 estrellas
              </Text>

              <TextInput
                label="Comentario"
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline
                numberOfLines={4}
                mode="outlined"
                style={[styles.input, { height: 110 }]}
                placeholder="Cuéntanos cómo fue el servicio"
              />

              <View style={styles.modalButtonRow}>
                <Button
                  mode="contained"
                  onPress={guardarCalificacion}
                  loading={savingRating}
                  disabled={savingRating}
                  style={{ flex: 1 }}
                >
                  Guardar
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => {
                    setRatingModalVisible(false);
                    resetRatingForm();
                  }}
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
  safe: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  empty: {
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  jobTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  jobMeta: {
    color: '#374151',
    marginTop: 6,
  },
  statusText: {
    fontWeight: '700',
    marginTop: 6,
  },
  topButton: {
    marginTop: 12,
  },
  buttonGroup: {
    marginTop: 12,
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  modalCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 16,
    color: '#111827',
  },
  contractTitle: {
    fontWeight: '700',
    marginTop: 6,
    color: '#111827',
  },
  contractLine: {
    marginTop: 6,
    color: '#374151',
  },
  helperText: {
    marginTop: 6,
    marginBottom: 6,
    color: '#374151',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  star: {
    marginHorizontal: 4,
  },
  selectedRatingText: {
    textAlign: 'center',
    marginBottom: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
});
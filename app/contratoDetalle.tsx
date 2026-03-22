import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../firebaseConfig';
import {
  finishContract,
  getContractById,
  markContractAsPaid,
  updateContractStatus,
  uploadContractEvidence,
  type ContractItem,
} from '../services/contractsService';
import { AuthContext } from './auth-context';

export default function ContratoDetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const contractId = String(params.contractId || '');

  const [contract, setContract] = useState<ContractItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const actualizarSolicitudPorContrato = async (
    contractIdValue: string,
    data: Record<string, any>
  ) => {
    try {
      const q = query(
        collection(db, 'solicitudesServicio'),
        where('contractId', '==', contractIdValue)
      );

      const snap = await getDocs(q);

      if (snap.empty) return;

      await Promise.all(
        snap.docs.map((item) =>
          updateDoc(item.ref, {
            ...data,
            updatedAt: serverTimestamp(),
          })
        )
      );
    } catch (error) {
      console.error('Error actualizando solicitud relacionada:', error);
    }
  };

  const cargarContrato = async () => {
    try {
      if (!contractId) {
        Alert.alert('Error', 'No se recibió el id del contrato.');
        router.back();
        return;
      }

      setLoading(true);
      const data = await getContractById(contractId);

      if (!data) {
        Alert.alert('Error', 'No se encontró el contrato.');
        router.back();
        return;
      }

      setContract(data);
    } catch (error) {
      console.error('Error cargando contrato:', error);
      Alert.alert('Error', 'No se pudo cargar el contrato.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarContrato();
  }, [contractId]);

  const esCliente = useMemo(() => {
    return !!user?.id && !!contract?.clientId && user.id === contract.clientId;
  }, [user?.id, contract?.clientId]);

  const esProfesionista = useMemo(() => {
    return !!user?.id && !!contract?.professionalId && user.id === contract.professionalId;
  }, [user?.id, contract?.professionalId]);

  const aceptarContrato = async () => {
    try {
      setActionLoading(true);

      await updateContractStatus(contractId, 'aceptado');

      await actualizarSolicitudPorContrato(contractId, {
        status: 'solicitud_enviada',
      });

      Alert.alert('Éxito', 'Contrato aceptado.');
      await cargarContrato();
    } catch (error: any) {
      console.error('Error aceptando contrato:', error);
      Alert.alert('Error', error?.message || 'No se pudo aceptar el contrato.');
    } finally {
      setActionLoading(false);
    }
  };

  const iniciarTrabajo = async () => {
    try {
      setActionLoading(true);

      await updateContractStatus(contractId, 'en_proceso');

      await actualizarSolicitudPorContrato(contractId, {
        status: 'trabajo_activo',
      });

      Alert.alert('Éxito', 'El trabajo cambió a en proceso.');
      await cargarContrato();
    } catch (error: any) {
      console.error('Error iniciando trabajo:', error);
      Alert.alert('Error', error?.message || 'No se pudo iniciar el trabajo.');
    } finally {
      setActionLoading(false);
    }
  };

  const subirEvidencia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a tus fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (result.canceled) return;

      setActionLoading(true);

      await uploadContractEvidence(contractId, result.assets[0].uri);

      Alert.alert('Éxito', 'Evidencia subida correctamente.');
      await cargarContrato();
    } catch (error: any) {
      console.error('Error subiendo evidencia:', error);
      Alert.alert('Error', error?.message || 'No se pudo subir la evidencia.');
    } finally {
      setActionLoading(false);
    }
  };

  const marcarTerminado = async () => {
    try {
      setActionLoading(true);

      await finishContract(contractId);

      await actualizarSolicitudPorContrato(contractId, {
        status: 'trabajo_realizado',
      });

      Alert.alert('Éxito', 'Trabajo marcado como terminado.');
      await cargarContrato();
    } catch (error: any) {
      console.error('Error finalizando contrato:', error);
      Alert.alert('Error', error?.message || 'No se pudo finalizar el trabajo.');
    } finally {
      setActionLoading(false);
    }
  };

  const realizarPago = async () => {
    try {
      setActionLoading(true);

      await markContractAsPaid(contractId);

      await actualizarSolicitudPorContrato(contractId, {
        paymentStatus: 'pagado',
        status: 'trabajo_realizado',
      });

      Alert.alert(
        '✅ ¡Pago Realizado!',
        'El pago ha sido registrado exitosamente. Ahora puedes dejar una reseña para el profesionista.',
        [
          {
            text: 'Dejar reseña',
            onPress: () => {
              if (contract) {
                router.push({
                  pathname: '/calificar',
                  params: {
                    contractId: contract.id,
                    professionalId: contract.professionalId,
                    clientId: contract.clientId,
                    clientName: contract.clientName,
                    serviceId: contract.id,
                  },
                });
              }
            }
          },
          { text: 'Más tarde', style: 'cancel' }
        ]
      );
      await cargarContrato();
    } catch (error: any) {
      console.error('Error registrando pago:', error);
      Alert.alert('Error', error?.message || 'No se pudo registrar el pago.');
    } finally {
      setActionLoading(false);
    }
  };

  const irACalificar = () => {
    if (!contract) {
      Alert.alert('Error', 'No se encontró la información del contrato.');
      return;
    }

    router.push({
      pathname: '/calificar',
      params: {
        contractId: contract.id,
        professionalId: contract.professionalId,
        clientId: contract.clientId,
        clientName: contract.clientName,
        serviceId: contract.id,
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'aceptado':
        return 'Aceptado';
      case 'en_proceso':
        return 'En proceso';
      case 'terminado':
        return 'Terminado';
      case 'pagado':
        return 'Pagado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Sin estado';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pendiente':
        return '#f59e0b';
      case 'aceptado':
        return '#2563eb';
      case 'en_proceso':
        return '#7c3aed';
      case 'terminado':
        return '#0891b2';
      case 'pagado':
        return '#16a34a';
      case 'cancelado':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Cargando contrato...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>No se encontró el contrato.</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 14 }}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Button mode="text" onPress={() => router.back()} style={styles.backButton}>
          Volver
        </Button>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Detalle del contrato
            </Text>

            <Text style={styles.subtitle}>{contract.serviceTitle}</Text>

            <View style={styles.chipsRow}>
              <Chip
                style={[
                  styles.chip,
                  { backgroundColor: `${getStatusColor(contract.status)}22` },
                ]}
                textStyle={{ color: getStatusColor(contract.status), fontWeight: '700' }}
              >
                Estado: {getStatusLabel(contract.status)}
              </Chip>

              <Chip
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      contract.paymentStatus === 'pagado' ? '#dcfce7' : '#fef3c7',
                  },
                ]}
                textStyle={{
                  color: contract.paymentStatus === 'pagado' ? '#166534' : '#92400e',
                  fontWeight: '700',
                }}
              >
                Pago: {contract.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{contract.clientName}</Text>

            <Text style={styles.label}>Profesionista</Text>
            <Text style={styles.value}>{contract.professionalName}</Text>

            <Text style={styles.label}>Descripción del servicio</Text>
            <Text style={styles.value}>{contract.serviceDescription}</Text>

            <Text style={styles.label}>Precio pactado</Text>
            <Text style={styles.value}>{formatCurrency(contract.agreedPrice)}</Text>

            <Text style={styles.label}>Condiciones</Text>
            <Text style={styles.value}>
              {contract.conditions || 'Sin condiciones registradas.'}
            </Text>

            <Text style={styles.label}>Dirección</Text>
            <Text style={styles.value}>
              {contract.address || 'Sin dirección registrada.'}
            </Text>

            <Text style={styles.label}>Fecha programada</Text>
            <Text style={styles.value}>
              {contract.scheduledDate || 'Sin fecha programada.'}
            </Text>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Evidencias</Text>

            {contract.evidence && contract.evidence.length > 0 ? (
              <View>
                {contract.evidence.map((url, index) => (
                  <Image
                    key={`${url}-${index}`}
                    source={{ uri: url }}
                    style={styles.evidenceImage}
                    resizeMode="cover"
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Aún no hay evidencias cargadas.</Text>
            )}

            <View style={styles.actions}>
              {esProfesionista && contract.status === 'pendiente' && (
                <Button
                  mode="contained"
                  onPress={aceptarContrato}
                  loading={actionLoading}
                  disabled={actionLoading}
                  style={styles.primaryButton}
                >
                  Aceptar contrato
                </Button>
              )}

              {esProfesionista && contract.status === 'aceptado' && (
                <Button
                  mode="contained"
                  onPress={iniciarTrabajo}
                  loading={actionLoading}
                  disabled={actionLoading}
                  style={styles.primaryButton}
                >
                  Iniciar trabajo
                </Button>
              )}

              {esProfesionista &&
                (contract.status === 'aceptado' || contract.status === 'en_proceso') && (
                  <>
                    <Button
                      mode="outlined"
                      onPress={subirEvidencia}
                      loading={actionLoading}
                      disabled={actionLoading}
                      style={styles.secondaryButton}
                    >
                      Subir evidencia
                    </Button>

                    <Button
                      mode="contained"
                      onPress={marcarTerminado}
                      loading={actionLoading}
                      disabled={actionLoading}
                      style={styles.primaryButton}
                    >
                      Marcar como terminado
                    </Button>
                  </>
                )}

              {esCliente &&
                contract.status === 'terminado' &&
                contract.paymentStatus === 'pendiente' && (
                  <Button
                    mode="contained"
                    onPress={realizarPago}
                    loading={actionLoading}
                    disabled={actionLoading}
                    style={styles.primaryButton}
                  >
                    Realizar pago
                  </Button>
                )}

              {esCliente &&
                contract.reviewEnabled &&
                contract.paymentStatus === 'pagado' && (
                  <Button
                    mode="outlined"
                    onPress={irACalificar}
                    style={styles.secondaryButton}
                  >
                    Dejar reseña
                  </Button>
                )}
            </View>
          </Card.Content>
        </Card>
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
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    marginBottom: 6,
  },
  divider: {
    marginVertical: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  emptyText: {
    color: '#6b7280',
  },
  evidenceImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  primaryButton: {
    borderRadius: 14,
  },
  secondaryButton: {
    borderRadius: 14,
  },
});
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    Text,
    TextInput,
} from 'react-native-paper';
import { db } from '../firebaseConfig';
import { getOrCreateChat } from '../services/chat';
import { 
  updateContractStatus,
  submitCounterProposal,
  acceptProfessionalQuote,
} from '../services/contractsService';
import { AuthContext } from './auth-context';

type EstadoTrabajo =
  | 'solicitud_enviada'
  | 'trabajo_activo'
  | 'trabajo_realizado'
  | 'cancelado';

type SolicitudServicio = {
  id: string;
  title?: string;
  titulo?: string;
  description?: string;
  descripcion?: string;
  category?: string;
  categoria?: string;
  address?: string;
  direccion?: string;
  budget?: number | string;
  presupuesto?: number | string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  professionalId?: string;
  professionalName?: string;
  professionalPhone?: string;
  status?: EstadoTrabajo | string;
  contractId?: string;
  paymentStatus?: 'pendiente' | 'pagado' | string;
  createdAt?: any;
  date?: string;
  fecha?: string;
  images?: string[];
  imagenes?: string[];
};

export default function TrabajosProfesional() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterReason, setCounterReason] = useState('');

  const cargarSolicitudes = useCallback(async () => {
    try {
      if (!user?.id) {
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'solicitudesServicio'),
        where('professionalId', '==', user.id)
      );

      const snap = await getDocs(q);

      const data: SolicitudServicio[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SolicitudServicio, 'id'>),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setSolicitudes(data);
    } catch (error) {
      console.error('Error al cargar solicitudes del profesional:', error);
      Alert.alert('Error', 'No se pudieron cargar los trabajos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargarSolicitudes();
    }, [cargarSolicitudes])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarSolicitudes();
  };

  const cambiarEstado = async (
    solicitudId: string,
    nuevoEstado: EstadoTrabajo,
    contractId?: string
  ) => {
    try {
      setUpdatingId(solicitudId);

      await updateDoc(doc(db, 'solicitudesServicio', solicitudId), {
        status: nuevoEstado,
      });

      if (contractId) {
        if (nuevoEstado === 'trabajo_activo') {
          await updateContractStatus(contractId, 'en_proceso');
        }

        if (nuevoEstado === 'trabajo_realizado') {
          await updateContractStatus(contractId, 'terminado');
        }

        if (nuevoEstado === 'cancelado') {
          await updateContractStatus(contractId, 'cancelado');
        }
      }

      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitudId ? { ...s, status: nuevoEstado } : s
        )
      );
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmarCancelar = (solicitud: SolicitudServicio) => {
    Alert.alert(
      'Cancelar trabajo',
      '¿Seguro que deseas cancelar este trabajo?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () =>
            cambiarEstado(solicitud.id, 'cancelado', solicitud.contractId),
        },
      ]
    );
  };

  const abrirChat = async (solicitud: SolicitudServicio) => {
    try {
      if (!user?.id || !solicitud.clientId) {
        Alert.alert('Aviso', 'No se encontró el cliente para abrir el chat.');
        return;
      }

      const professionalName =
        user.name ||
        solicitud.professionalName ||
        'Profesionista';

      const chatId = await getOrCreateChat({
        clientId: solicitud.clientId,
        professionalId: user.id,
        clientName: solicitud.clientName || 'Cliente',
        professionalName,
        serviceId: solicitud.id,
      });

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error al abrir chat:', error);
      Alert.alert('Error', 'No se pudo abrir el chat.');
    }
  };

  const abrirModalContrapropuesta = (contractId: string, solicitudId: string, presupuestoActual: number | string) => {
    setSelectedContractId(contractId);
    setSelectedSolicitudId(solicitudId);
    setCounterPrice(String(presupuestoActual));
    setCounterReason('');
    setShowCounterModal(true);
  };

  const enviarContrapropuesta = async () => {
    if (!selectedContractId) return;

    const nuevoPrecio = Number(counterPrice);
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      Alert.alert('Error', 'El precio debe ser un número mayor a 0.');
      return;
    }

    try {
      setUpdatingId(selectedContractId);
      await submitCounterProposal(selectedContractId, nuevoPrecio, counterReason, selectedSolicitudId || undefined);
      
      // Actualizar estado local
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === selectedSolicitudId 
            ? { ...s, status: 'presupuesto_contrapropuesto', counterProposedPrice: nuevoPrecio } 
            : s
        )
      );

      setShowCounterModal(false);
      setCounterPrice('');
      setCounterReason('');
      setSelectedContractId(null);
      setSelectedSolicitudId(null);

      Alert.alert(
        '✓ Contrapropuesta Enviada',
        `Tu nueva propuesta de $${nuevoPrecio} ha sido enviada al cliente.`
      );
    } catch (error: any) {
      console.error('Error al enviar contrapropuesta:', error);
      Alert.alert('Error', error?.message || 'No se pudo enviar la contrapropuesta.');
    } finally {
      setUpdatingId(null);
    }
  };

  const aceptarPresupuesto = async (contractId: string, solicitudId: string) => {
    try {
      setUpdatingId(solicitudId);
      await acceptProfessionalQuote(contractId, solicitudId);
      
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitudId 
            ? { ...s, status: 'presupuesto_aceptado' } 
            : s
        )
      );

      Alert.alert('✓ Presupuesto Aceptado', 'Ya puedes iniciar el trabajo cuando esté listo.');
    } catch (error: any) {
      console.error('Error al aceptar presupuesto:', error);
      Alert.alert('Error', error?.message || 'No se pudo aceptar el presupuesto.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getEstadoLabel = (estado?: string) => {
    switch (estado) {
      case 'solicitud_enviada':
        return 'Solicitud recibida';
      case 'presupuesto_propuesto':
        return 'Presupuesto pendiente';
      case 'presupuesto_contrapropuesto':
        return 'Contrapropuesta enviada';
      case 'presupuesto_aceptado':
        return 'Presupuesto aceptado';
      case 'trabajo_activo':
        return 'Trabajo activo';
      case 'trabajo_realizado':
        return 'Trabajo realizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Sin estado';
    }
  };

  const getEstadoChipStyle = (estado?: string) => {
    switch (estado) {
      case 'solicitud_enviada':
        return { bg: '#f8edc4', text: '#8a6d1f' };
      case 'presupuesto_propuesto':
        return { bg: '#fce7f3', text: '#be185d' };
      case 'presupuesto_contrapropuesto':
        return { bg: '#f3e8ff', text: '#7e22ce' };
      case 'presupuesto_aceptado':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'trabajo_activo':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'trabajo_realizado':
        return { bg: '#dcfce7', text: '#166534' };
      case 'cancelado':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#e5e7eb', text: '#4b5563' };
    }
  };

  const getPagoChipStyle = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'pagado':
        return { bg: '#dcfce7', text: '#166534', label: 'Pago recibido' };
      case 'pendiente':
        return { bg: '#fef3c7', text: '#92400e', label: 'Pago pendiente' };
      default:
        return { bg: '#e5e7eb', text: '#4b5563', label: 'Pago sin definir' };
    }
  };

  const getTitulo = (item: SolicitudServicio) =>
    item.title || item.titulo || 'Servicio solicitado';

  const getCategoria = (item: SolicitudServicio) =>
    item.category || item.categoria || 'Sin categoría';

  const getDescripcion = (item: SolicitudServicio) =>
    item.description || item.descripcion || '';

  const getDireccion = (item: SolicitudServicio) =>
    item.address || item.direccion || '';

  const getPresupuesto = (item: SolicitudServicio) =>
    item.budget || item.presupuesto || '';

  const solicitudesActivas = useMemo(
    () =>
      solicitudes.filter(
        (s) =>
          s.status === 'solicitud_enviada' ||
          s.status === 'presupuesto_propuesto' ||
          s.status === 'presupuesto_contrapropuesto' ||
          s.status === 'presupuesto_aceptado' ||
          s.status === 'trabajo_activo' ||
          s.status === 'trabajo_realizado'
      ),
    [solicitudes]
  );

  const solicitudesCanceladas = useMemo(
    () => solicitudes.filter((s) => s.status === 'cancelado'),
    [solicitudes]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Cargando trabajos...</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Mis trabajos
        </Text>
        <Text style={styles.subtitle}>
          Aquí puedes ver el estado de los servicios asignados.
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Trabajos en seguimiento
        </Text>

        {solicitudesActivas.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                Aún no tienes trabajos asignados.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          solicitudesActivas.map((solicitud) => {
            const estado = solicitud.status || 'solicitud_enviada';
            const isUpdating = updatingId === solicitud.id;
            const chip = getEstadoChipStyle(estado);
            const pago = getPagoChipStyle(solicitud.paymentStatus);
            const yaPago = solicitud.paymentStatus === 'pagado';

            return (
              <Card key={solicitud.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text variant="titleMedium" style={styles.cardTitle}>
                        {getTitulo(solicitud)}
                      </Text>
                      <Text style={styles.category}>
                        {getCategoria(solicitud)}
                      </Text>
                    </View>

                    <View style={styles.chipsWrap}>
                      <Chip
                        style={[styles.statusChip, { backgroundColor: chip.bg }]}
                        textStyle={{ color: chip.text, fontWeight: '700' }}
                      >
                        {getEstadoLabel(estado)}
                      </Chip>

                      {estado === 'trabajo_realizado' && (
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: pago.bg, marginTop: 8 },
                          ]}
                          textStyle={{ color: pago.text, fontWeight: '700' }}
                        >
                          {pago.label}
                        </Chip>
                      )}
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  {!!getDescripcion(solicitud) && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <Text style={styles.rowText}>
                        {getDescripcion(solicitud)}
                      </Text>
                    </View>
                  )}

                  {!!getDireccion(solicitud) && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <Text style={styles.rowText}>
                        {getDireccion(solicitud)}
                      </Text>
                    </View>
                  )}

                  {solicitud.clientName && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <Text style={styles.rowText}>
                        Cliente: {solicitud.clientName}
                      </Text>
                    </View>
                  )}

                  {solicitud.clientPhone && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="phone-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <Text style={styles.rowText}>
                        {solicitud.clientPhone}
                      </Text>
                    </View>
                  )}

                  {!!getPresupuesto(solicitud) && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={20}
                        color="#6b7280"
                      />
                      <Text style={styles.rowText}>
                        Presupuesto: ${getPresupuesto(solicitud)}
                      </Text>
                    </View>
                  )}

                  {estado === 'trabajo_realizado' && yaPago && (
                    <View style={styles.noticeBoxPaid}>
                      <Text style={styles.noticeTitlePaid}>Pago recibido</Text>
                      <Text style={styles.noticeTextPaid}>
                        El cliente ya realizó el pago. Este servicio quedó completado correctamente.
                      </Text>
                    </View>
                  )}

                  {estado === 'trabajo_realizado' && !yaPago && (
                    <View style={styles.noticeBoxPending}>
                      <Text style={styles.noticeTitlePending}>⏳ Pago No Recibido</Text>
                      <Text style={styles.noticeTextPending}>
                        El trabajo fue marcado como realizado. El cliente aún no ha completado el pago.
                      </Text>
                    </View>
                  )}

                  <View style={styles.timelineBox}>
                    <Text style={styles.timelineTitle}>Estado del servicio</Text>

                    <View style={styles.timelineItem}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#6f42c1"
                      />
                      <Text style={styles.timelineText}>Solicitud recibida</Text>
                    </View>

                    <View style={styles.timelineItem}>
                      <MaterialCommunityIcons
                        name={
                          estado === 'trabajo_activo' ||
                          estado === 'trabajo_realizado'
                            ? 'check-circle'
                            : 'circle-outline'
                        }
                        size={20}
                        color={
                          estado === 'trabajo_activo' ||
                          estado === 'trabajo_realizado'
                            ? '#6f42c1'
                            : '#9ca3af'
                        }
                      />
                      <Text style={styles.timelineText}>Trabajo activo</Text>
                    </View>

                    <View style={styles.timelineItem}>
                      <MaterialCommunityIcons
                        name={
                          estado === 'trabajo_realizado'
                            ? 'check-circle'
                            : 'circle-outline'
                        }
                        size={20}
                        color={
                          estado === 'trabajo_realizado'
                            ? '#22c55e'
                            : '#9ca3af'
                        }
                      />
                      <Text style={styles.timelineText}>Trabajo realizado</Text>
                    </View>
                  </View>

                  <View style={styles.buttonsContainer}>
                    <Button
                      mode="outlined"
                      icon="chat-outline"
                      style={styles.chatButton}
                      contentStyle={styles.buttonContent}
                      onPress={() => abrirChat(solicitud)}
                    >
                      Chat
                    </Button>

                    {estado === 'solicitud_enviada' && (
                      <>
                        <Button
                          mode="contained"
                          icon="check-circle-outline"
                          style={styles.primaryButton}
                          contentStyle={styles.buttonContent}
                          onPress={() => aceptarPresupuesto(solicitud.contractId || '', solicitud.id)}
                          loading={isUpdating === solicitud.id}
                          disabled={updatingId !== null}
                        >
                          Aceptar
                        </Button>
                        <Button
                          mode="outlined"
                          icon="pencil-outline"
                          style={styles.secondaryButton}
                          contentStyle={styles.buttonContent}
                          onPress={() =>
                            abrirModalContrapropuesta(
                              solicitud.contractId || '',
                              solicitud.id,
                              getPresupuesto(solicitud)
                            )
                          }
                          disabled={updatingId !== null}
                        >
                          Contraproponer
                        </Button>
                      </>
                    )}

                    {estado === 'presupuesto_contrapropuesto' && (
                      <Button
                        mode="outlined"
                        disabled
                        icon="check-outline"
                        style={styles.processingButton}
                        contentStyle={styles.buttonContent}
                      >
                        Esperando respuesta del cliente
                      </Button>
                    )}

                    {estado === 'presupuesto_aceptado' && (
                      <Button
                        mode="contained"
                        icon="briefcase-check-outline"
                        style={styles.primaryButton}
                        contentStyle={styles.buttonContent}
                        onPress={() =>
                          cambiarEstado(
                            solicitud.id,
                            'trabajo_activo',
                            solicitud.contractId
                          )
                        }
                        loading={isUpdating}
                        disabled={isUpdating}
                      >
                        Iniciar
                      </Button>
                    )}

                    {estado === 'trabajo_activo' && (
                      <Button
                        mode="contained"
                        icon="check-decagram-outline"
                        style={styles.primaryButton}
                        contentStyle={styles.buttonContent}
                        onPress={() =>
                          cambiarEstado(
                            solicitud.id,
                            'trabajo_realizado',
                            solicitud.contractId
                          )
                        }
                        loading={isUpdating}
                        disabled={isUpdating}
                      >
                        Finalizar
                      </Button>
                    )}

                    {(estado === 'solicitud_enviada' ||
                      estado === 'trabajo_activo') && (
                      <Button
                        mode="outlined"
                        icon="close-circle-outline"
                        style={styles.cancelButton}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.cancelLabel}
                        onPress={() => confirmarCancelar(solicitud)}
                        disabled={isUpdating}
                      >
                        Cancelar
                      </Button>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </View>

      {solicitudesCanceladas.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Cancelados
          </Text>

          {solicitudesCanceladas.map((solicitud) => (
            <Card key={solicitud.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text variant="titleMedium" style={styles.cardTitle}>
                      {getTitulo(solicitud)}
                    </Text>
                    <Text style={styles.category}>
                      {getCategoria(solicitud)}
                    </Text>
                  </View>

                  <Chip
                    style={[styles.statusChip, { backgroundColor: '#fee2e2' }]}
                    textStyle={{ color: '#b91c1c', fontWeight: '700' }}
                  >
                    Cancelado
                  </Chip>
                </View>

                {!!getDescripcion(solicitud) && (
                  <>
                    <Divider style={styles.divider} />
                    <Text style={styles.rowText}>{getDescripcion(solicitud)}</Text>
                  </>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>

    {/* Modal para Contrapropuesta */}
    <Modal visible={showCounterModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.modalTitle}>
              💰 Proponer Nuevo Presupuesto
            </Text>
            <Divider style={styles.modalDivider} />

            <Text style={styles.modalLabel}>Nuevo precio</Text>
            <TextInput
              label="Precio"
              value={counterPrice}
              onChangeText={setCounterPrice}
              mode="outlined"
              keyboardType="numeric"
              placeholder="0"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Razón de la contrapropuesta (opcional)</Text>
            <TextInput
              label="Razón"
              value={counterReason}
              onChangeText={setCounterReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Ej: Requiere más materiales..."
              style={[styles.modalInput, { minHeight: 80 }]}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowCounterModal(false);
                  setCounterPrice('');
                  setCounterReason('');
                }}
                style={styles.modalButtonAux}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={enviarContrapropuesta}
                loading={updatingId === selectedContractId}
                disabled={updatingId !== null}
                style={styles.modalButtonPrimary}
              >
                Enviar Propuesta
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f4fb',
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f4fb',
    padding: 20,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontWeight: '800',
    color: '#2f1f63',
    fontSize: 22,
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#4b2e83',
    marginBottom: 14,
    fontSize: 18,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    paddingVertical: 10,
  },
  card: {
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chipsWrap: {
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontWeight: '800',
    color: '#2d1b4e',
    fontSize: 18,
  },
  category: {
    color: '#7b6d9c',
    marginTop: 4,
    fontSize: 14,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 14,
  },
  divider: {
    marginVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  rowText: {
    flex: 1,
    color: '#4b5563',
    lineHeight: 24,
    fontSize: 15,
  },
  noticeBoxPaid: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  noticeTitlePaid: {
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },
  noticeTextPaid: {
    color: '#166534',
    lineHeight: 20,
  },
  noticeBoxPending: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  noticeTitlePending: {
    fontWeight: '900',
    color: '#dc2626',
    marginBottom: 6,
    fontSize: 16,
  },
  noticeTextPending: {
    color: '#b91c1c',
    lineHeight: 22,
    fontWeight: '500',
  },
  timelineBox: {
    backgroundColor: '#f3eefb',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
  },
  timelineTitle: {
    fontWeight: '800',
    color: '#5a3d99',
    marginBottom: 12,
    fontSize: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  timelineText: {
    color: '#4b5563',
    fontSize: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  chatButton: {
    borderRadius: 16,
    borderColor: '#d1d5db',
    minWidth: 140,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    minWidth: 140,
    flex: 1,
  },
  cancelButton: {
    borderRadius: 16,
    borderColor: '#d66a6a',
    minWidth: 140,
    flex: 1,
  },
  cancelLabel: {
    color: '#d66a6a',
  },
  buttonContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryButton: {
    borderRadius: 16,
    borderColor: '#7e22ce',
    minWidth: 140,
    flex: 1,
  },
  processingButton: {
    borderRadius: 16,
    minWidth: 140,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontWeight: '800',
    color: '#2f1f63',
    marginBottom: 8,
  },
  modalDivider: {
    marginVertical: 12,
  },
  modalLabel: {
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  modalButtonAux: {
    flex: 1,
    borderRadius: 12,
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#7e22ce',
  },
});
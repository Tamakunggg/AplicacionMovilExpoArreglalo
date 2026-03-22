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
} from 'react-native-paper';
import { db } from '../firebaseConfig';
import { getOrCreateChat } from '../services/chat';
import {
  acceptCounterProposal,
  markContractAsPaid,
  rejectCounterProposal,
  updatePaymentStatusForService,
} from '../services/contractsService';
import { AuthContext } from './auth-context';

type EstadoTrabajo =
  | 'solicitud_enviada'
  | 'presupuesto_propuesto'
  | 'presupuesto_contrapropuesto'
  | 'presupuesto_aceptado'
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
  counterProposedPrice?: number;
  counterProposalReason?: string;
  createdAt?: any;
  date?: string;
  fecha?: string;
  images?: string[];
  imagenes?: string[];
};

export default function TrabajosCliente() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async () => {
    try {
      if (!user?.id) {
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'solicitudesServicio'),
        where('clientId', '==', user.id)
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
      console.error('Error al cargar solicitudes del cliente:', error);
      Alert.alert('Error', 'No se pudieron cargar tus solicitudes.');
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
    nuevoEstado: EstadoTrabajo
  ) => {
    try {
      setUpdatingId(solicitudId);

      await updateDoc(doc(db, 'solicitudesServicio', solicitudId), {
        status: nuevoEstado,
      });

      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitudId ? { ...s, status: nuevoEstado } : s
        )
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la solicitud.');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmarCancelar = (solicitudId: string) => {
    Alert.alert(
      'Cancelar solicitud',
      '¿Seguro que deseas cancelar esta solicitud?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => cambiarEstado(solicitudId, 'cancelado'),
        },
      ]
    );
  };

  const abrirChat = async (solicitud: SolicitudServicio) => {
    try {
      if (!user?.id || !solicitud.professionalId) {
        Alert.alert('Aviso', 'No se encontró el profesional para abrir el chat.');
        return;
      }

      const clientName =
        user.name ||
        solicitud.clientName ||
        'Cliente';

      const chatId = await getOrCreateChat({
        clientId: user.id,
        professionalId: solicitud.professionalId,
        clientName,
        professionalName: solicitud.professionalName || 'Profesionista',
        serviceId: solicitud.id,
      });

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error al abrir chat:', error);
      Alert.alert('Error', 'No se pudo abrir el chat.');
    }
  };

  const verContrato = (solicitud: SolicitudServicio) => {
    if (!solicitud.contractId) {
      Alert.alert('Aviso', 'Esta solicitud aún no tiene contrato relacionado.');
      return;
    }

    router.push({
      pathname: '/contratoDetalle',
      params: { contractId: solicitud.contractId },
    });
  };

  const procesarPago = (solicitud: SolicitudServicio) => {
    const presupuesto = getPresupuesto(solicitud);
    const titulo = getTitulo(solicitud);

    Alert.alert(
      '💳 Confirmar Pago',
      `¿Deseas pagar $${presupuesto} por "${titulo}"?\n\nEsta acción marcará el servicio como pagado.`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => setPagandoId(null)
        },
        {
          text: 'Confirmar Pago',
          style: 'default',
          onPress: async () => {
            try {
              setPagandoId(solicitud.id);
              
              // 1. Marcar contrato como pagado (si existe)
              if (solicitud.contractId) {
                await markContractAsPaid(solicitud.contractId);
              }
              
              // 2. Actualizar estado de la solicitud
              await updatePaymentStatusForService(solicitud.id, 'pagado');
              
              setSolicitudes((prev) =>
                prev.map((s) =>
                  s.id === solicitud.id 
                    ? { ...s, paymentStatus: 'pagado' } 
                    : s
                )
              );

              Alert.alert(
                '✅ ¡Pago Realizado!',
                'El pago ha sido registrado exitosamente. Ahora puedes dejar una reseña para el profesionista.',
                [
                  {
                    text: 'Dejar reseña',
                    onPress: () => {
                      router.push({
                        pathname: '/calificar',
                        params: {
                          contractId: solicitud.contractId || '',
                          professionalId: solicitud.professionalId || '',
                          clientId: user?.id || '',
                          clientName: user?.name || solicitud.clientName || 'Cliente',
                          serviceId: solicitud.id,
                        },
                      });
                    }
                  },
                  { text: 'Más tarde', style: 'cancel' }
                ]
              );
            } catch (error) {
              console.error('Error al procesar pago:', error);
              Alert.alert('Error', 'No se pudo procesar el pago. Intenta nuevamente.');
            } finally {
              setPagandoId(null);
            }
          },
        },
      ]
    );
  };

  const aceptarContrapropuesta = async (contractId: string, nuevoPrecio: number) => {
    try {
      setUpdatingId(contractId);
      await acceptCounterProposal(contractId);
      
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === contractId 
            ? { ...s, status: 'presupuesto_aceptado', budget: nuevoPrecio } 
            : s
        )
      );

      Alert.alert(
        '✓ Presupuesto Aceptado',
        `Has aceptado el nuevo presupuesto de $${nuevoPrecio}. El profesionista puede iniciar cuando esté listo.`
      );
    } catch (error: any) {
      console.error('Error al aceptar contrapropuesta:', error);
      Alert.alert('Error', error?.message || 'No se pudo aceptar la contrapropuesta.');
    } finally {
      setUpdatingId(null);
    }
  };

  const rechazarContrapropuesta = async (contractId: string) => {
    Alert.alert(
      'Rechazar Contrapropuesta',
      '¿Deseas rechazar esta propuesta? Podrás negociar nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(contractId);
              await rejectCounterProposal(contractId);
              
              setSolicitudes((prev) =>
                prev.map((s) =>
                  s.id === contractId 
                    ? { ...s, status: 'presupuesto_propuesto' } 
                    : s
                )
              );

              Alert.alert(
                '✓ Contrapropuesta Rechazada',
                'Vuelve al estado anterior. Podrán renegociar a través del chat.'
              );
            } catch (error: any) {
              console.error('Error al rechazar contrapropuesta:', error);
              Alert.alert('Error', error?.message || 'No se pudo rechazar la contrapropuesta.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const getEstadoLabel = (estado?: string) => {
    switch (estado) {
      case 'solicitud_enviada':
        return 'Solicitud enviada';
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

  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case 'solicitud_enviada':
        return '#FFF3CD';
      case 'trabajo_activo':
        return '#D1ECF1';
      case 'trabajo_realizado':
        return '#D4EDDA';
      case 'cancelado':
        return '#F8D7DA';
      default:
        return '#E9ECEF';
    }
  };

  const getEstadoTextColor = (estado?: string) => {
    switch (estado) {
      case 'solicitud_enviada':
        return '#856404';
      case 'trabajo_activo':
        return '#0C5460';
      case 'trabajo_realizado':
        return '#155724';
      case 'cancelado':
        return '#721C24';
      default:
        return '#495057';
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
        <Text style={{ marginTop: 12 }}>Cargando solicitudes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Mis solicitudes
        </Text>
        <Text style={styles.subtitle}>
          Aquí puedes ver el estado de los servicios que solicitaste.
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Solicitudes en seguimiento
        </Text>

        {solicitudesActivas.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                Aún no has realizado solicitudes.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          solicitudesActivas.map((solicitud) => {
            const estado = solicitud.status || 'solicitud_enviada';
            const isUpdating = updatingId === solicitud.id;

            return (
              <Card key={solicitud.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={styles.cardTitle}>
                        {getTitulo(solicitud)}
                      </Text>
                      <Text style={styles.category}>
                        {getCategoria(solicitud)}
                      </Text>
                    </View>

                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: getEstadoColor(estado) },
                      ]}
                      textStyle={{ color: getEstadoTextColor(estado) }}
                    >
                      {getEstadoLabel(estado)}
                    </Chip>
                  </View>

                  <Divider style={styles.divider} />

                  {!!getDescripcion(solicitud) && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="text-box-outline"
                        size={18}
                        color="#6c757d"
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
                        size={18}
                        color="#6c757d"
                      />
                      <Text style={styles.rowText}>
                        {getDireccion(solicitud)}
                      </Text>
                    </View>
                  )}

                  {solicitud.professionalName && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="account-hard-hat"
                        size={18}
                        color="#6c757d"
                      />
                      <Text style={styles.rowText}>
                        Profesional: {solicitud.professionalName}
                      </Text>
                    </View>
                  )}

                  {solicitud.professionalPhone && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="phone-outline"
                        size={18}
                        color="#6c757d"
                      />
                      <Text style={styles.rowText}>
                        {solicitud.professionalPhone}
                      </Text>
                    </View>
                  )}

                  {!!getPresupuesto(solicitud) && (
                    <View style={styles.row}>
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={18}
                        color="#6c757d"
                      />
                      <Text style={styles.rowText}>
                        Presupuesto: ${getPresupuesto(solicitud)}
                      </Text>
                    </View>
                  )}

                  {estado === 'presupuesto_propuesto' && (
                    <View style={styles.presupuestoBox}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={20}
                        color="#0369a1"
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.presupuestoTitle}>Presupuesto pendiente de confirmación</Text>
                        <Text style={styles.presupuestoSubtitle}>
                          El profesionista revisó tu solicitud. Espera su respuesta.
                        </Text>
                      </View>
                    </View>
                  )}

                  {estado === 'presupuesto_contrapropuesto' && (
                    <Card style={styles.contraProuestaBox}>
                      <Card.Content>
                        <Text style={styles.contraProuestaTitle}>💰 Nueva Propuesta de Presupuesto</Text>
                        <Divider style={{ marginVertical: 12 }} />
                        <View style={{ marginBottom: 12 }}>
                          <Text style={styles.contraProuestaPriceLabel}>Presupuesto original:</Text>
                          <Text style={styles.contraProuestaPriceOld}>${getPresupuesto(solicitud)}</Text>
                        </View>
                        <View style={{ marginBottom: 14 }}>
                          <Text style={styles.contraProuestaPriceLabel}>Nueva propuesta:</Text>
                          <Text style={styles.contraProuestaPriceNew}>
                            ${solicitud.counterProposedPrice || 'No especificado'}
                          </Text>
                        </View>
                        <View style={styles.contraProuestaButtons}>
                          <Button
                            mode="contained"
                            icon="check-circle-outline"
                            style={styles.acceptButton}
                            contentStyle={styles.buttonContentSmall}
                            onPress={() =>
                              aceptarContrapropuesta(
                                solicitud.contractId || '',
                                solicitud.counterProposedPrice || 0
                              )
                            }
                            loading={updatingId === solicitud.id}
                            disabled={updatingId !== null}
                          >
                            Aceptar
                          </Button>
                          <Button
                            mode="outlined"
                            icon="close-circle-outline"
                            style={styles.rejectButton}
                            contentStyle={styles.buttonContentSmall}
                            labelStyle={styles.rejectLabel}
                            onPress={() => rechazarContrapropuesta(solicitud.contractId || '')}
                            disabled={updatingId !== null}
                          >
                            Rechazar
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
                  )}

                  {estado === 'presupuesto_aceptado' && (
                    <View style={styles.presupuestoAceptadoBox}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#059669"
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.presupuestoAceptadoTitle}>✓ Presupuesto confirmado</Text>
                        <Text style={styles.presupuestoAceptadoSubtitle}>
                          Presupuesto: ${getPresupuesto(solicitud)}. El profesionista puede iniciar cuando esté listo.
                        </Text>
                      </View>
                    </View>
                  )}

                  {estado === 'trabajo_realizado' && (
                    <View style={styles.noticeBox}>
                      <Text style={styles.noticeTitle}>Trabajo terminado</Text>
                      <Text style={styles.noticeText}>
                        El técnico marcó este servicio como realizado.
                        Revisa y continúa con el pago.
                      </Text>
                      {solicitud.paymentStatus === 'pendiente' && (
                        <Button
                          mode="contained"
                          icon="credit-card"
                          style={styles.noticePayButton}
                          contentStyle={styles.noticePayButtonContent}
                          onPress={() => procesarPago(solicitud)}
                          loading={pagandoId === solicitud.id}
                          disabled={pagandoId !== null}
                        >
                          Pagar Ahora
                        </Button>
                      )}
                      {solicitud.paymentStatus === 'pagado' && (
                        <View style={{ gap: 8 }}>
                          <View style={styles.paidBadge}>
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={16}
                              color="#10b981"
                            />
                            <Text style={styles.paidBadgeText}>Pago realizado</Text>
                          </View>
                          
                          <Button
                            mode="outlined"
                            icon="star-outline"
                            onPress={() => {
                              router.push({
                                pathname: '/calificar',
                                params: {
                                  contractId: solicitud.contractId || '',
                                  professionalId: solicitud.professionalId || '',
                                  clientId: user?.id || '',
                                  clientName: user?.name || solicitud.clientName || 'Cliente',
                                  serviceId: solicitud.id,
                                },
                              });
                            }}
                            style={{ borderRadius: 10, borderColor: '#6f42c1' }}
                            labelStyle={{ color: '#6f42c1' }}
                          >
                            Dejar reseña
                          </Button>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.timelineBox}>
                    <Text style={styles.timelineTitle}>Estado del servicio</Text>

                    <View style={styles.timelineItem}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color="#6f42c1"
                      />
                      <Text style={styles.timelineText}>Solicitud enviada</Text>
                    </View>

                    <View style={styles.timelineItem}>
                      <MaterialCommunityIcons
                        name={
                          estado === 'trabajo_activo' ||
                          estado === 'trabajo_realizado'
                            ? 'check-circle'
                            : 'circle-outline'
                        }
                        size={18}
                        color={
                          estado === 'trabajo_activo' ||
                          estado === 'trabajo_realizado'
                            ? '#6f42c1'
                            : '#adb5bd'
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
                        size={18}
                        color={
                          estado === 'trabajo_realizado'
                            ? '#28a745'
                            : '#adb5bd'
                        }
                      />
                      <Text style={styles.timelineText}>Trabajo realizado</Text>
                    </View>
                  </View>

                  <View style={styles.buttonsContainer}>
                    <Button
                      mode="outlined"
                      icon="chat-outline"
                      style={styles.actionButton}
                      contentStyle={styles.buttonContent}
                      onPress={() => abrirChat(solicitud)}
                    >
                      Chat
                    </Button>

                    {estado === 'trabajo_realizado' && (
                      <Button
                        mode="contained"
                        icon="file-document-outline"
                        style={styles.primaryButton}
                        contentStyle={styles.buttonContent}
                        onPress={() => verContrato(solicitud)}
                      >
                        Ver contrato
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
                        onPress={() => confirmarCancelar(solicitud.id)}
                        loading={updatingId === solicitud.id}
                        disabled={updatingId === solicitud.id}
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
            Solicitudes canceladas
          </Text>

          {solicitudesCanceladas.map((solicitud) => (
            <Card key={solicitud.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.cardTitle}>
                      {getTitulo(solicitud)}
                    </Text>
                    <Text style={styles.category}>
                      {getCategoria(solicitud)}
                    </Text>
                  </View>

                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: getEstadoColor('cancelado') },
                    ]}
                    textStyle={{ color: getEstadoTextColor('cancelado') }}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f4fb',
  },
  content: {
    padding: 16,
    paddingBottom: 20,
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
    fontWeight: 'bold',
    color: '#402060',
  },
  subtitle: {
    color: '#6c757d',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#4b2e83',
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    paddingVertical: 10,
  },
  card: {
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#2d1b4e',
  },
  category: {
    color: '#7b6d9c',
    marginTop: 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  rowText: {
    flex: 1,
    color: '#495057',
    lineHeight: 20,
  },
  noticeBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  noticeTitle: {
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  noticeText: {
    color: '#166534',
    lineHeight: 20,
  },
  noticePayButton: {
    borderRadius: 8,
    backgroundColor: '#059669',
    marginTop: 12,
    alignSelf: 'center',
    maxWidth: 160,
  },
  noticePayButtonContent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  paidBadgeText: {
    color: '#10b981',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  timelineBox: {
    backgroundColor: '#f8f5ff',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  timelineTitle: {
    fontWeight: '700',
    color: '#5a3d99',
    marginBottom: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timelineText: {
    color: '#495057',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  actionButton: {
    borderRadius: 12,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 12,
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: '#d9534f',
    flex: 1,
  },
  cancelLabel: {
    color: '#d9534f',
  },
  buttonContent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  presupuestoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  presupuestoTitle: {
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 4,
  },
  presupuestoSubtitle: {
    color: '#0c4a6e',
    fontSize: 13,
    lineHeight: 18,
  },
  contraProuestaBox: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#fff5f5',
    borderWidth: 2,
    borderColor: '#fecaca',
    elevation: 2,
  },
  contraProuestaTitle: {
    fontWeight: '800',
    color: '#dc2626',
    fontSize: 15,
  },
  contraProuestaPriceLabel: {
    fontWeight: '600',
    color: '#7f1d1d',
    fontSize: 12,
  },
  contraProuestaPriceOld: {
    fontSize: 14,
    color: '#991b1b',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  contraProuestaPriceNew: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  contraProuestaButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  rejectButton: {
    flex: 1,
    borderRadius: 10,
    borderColor: '#dc2626',
  },
  rejectLabel: {
    color: '#dc2626',
  },
  buttonContentSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presupuestoAceptadoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  presupuestoAceptadoTitle: {
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 4,
  },
  presupuestoAceptadoSubtitle: {
    color: '#047857',
    fontSize: 13,
    lineHeight: 18,
  },
});
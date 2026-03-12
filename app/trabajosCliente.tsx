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

export default function TrabajosCliente() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

                  {estado === 'trabajo_realizado' && (
                    <View style={styles.noticeBox}>
                      <Text style={styles.noticeTitle}>Trabajo terminado</Text>
                      <Text style={styles.noticeText}>
                        El profesionista marcó este servicio como realizado.
                        Revisa el detalle para continuar con pago y reseña.
                      </Text>
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
                        loading={isUpdating}
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
});
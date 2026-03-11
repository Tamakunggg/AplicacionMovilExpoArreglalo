import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import InAppNotification from '../components/InAppNotification';
import { db } from '../firebaseConfig';
import { AuthContext } from './auth-context';

type ChatItem = {
  id: string;
  clientId?: string;
  professionalId?: string;
  clientName?: string;
  professionalName?: string;
  lastMessage?: string;
};

export default function MisChats() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationChatId, setNotificationChatId] = useState('');

  const previousUnreadRef = useRef<Record<string, number>>({});
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ChatItem[];

        setChats(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando chats:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || chats.length === 0) return;

    const unsubscribers = chats.map((chat) => {
      const unreadRef = doc(db, 'chats', chat.id, 'meta', 'unreadCounts');

      return onSnapshot(unreadRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        const count = Number(data?.[user.id] || 0);

        setUnreadMap((prev) => {
          const updated = {
            ...prev,
            [chat.id]: count,
          };

          const previousCount = previousUnreadRef.current[chat.id] || 0;

          if (count > previousCount) {
            const chatName =
              user.id === chat.clientId
                ? chat.professionalName || 'Profesionista'
                : chat.clientName || 'Cliente';

            setNotificationTitle(`Nuevo mensaje de ${chatName}`);
            setNotificationMessage(chat.lastMessage?.trim() || 'Tienes un mensaje nuevo');
            setNotificationChatId(chat.id);
            setNotificationVisible(true);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              setNotificationVisible(false);
            }, 3500);
          }

          previousUnreadRef.current[chat.id] = count;
          return updated;
        });
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chats, user?.id]);

  const getChatName = (chat: ChatItem) => {
    if (!user?.id) return 'Chat';

    if (user.id === chat.clientId) {
      return chat.professionalName || 'Profesionista';
    }

    return chat.clientName || 'Cliente';
  };

  const openChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" />
          <Text style={{ marginTop: 10 }}>Cargando chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <InAppNotification
          visible={notificationVisible}
          title={notificationTitle}
          message={notificationMessage}
          onPress={() => {
            setNotificationVisible(false);
            if (notificationChatId) {
              router.push(`/chat/${notificationChatId}`);
            }
          }}
        />

        <Text variant="headlineSmall" style={styles.title}>
          Mis chats
        </Text>

        {chats.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aún no tienes chats.</Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const unreadCount = unreadMap[item.id] || 0;

              return (
                <Pressable style={styles.card} onPress={() => openChat(item.id)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getChatName(item).charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.info}>
                    <View style={styles.topRow}>
                      <Text style={styles.name}>{getChatName(item)}</Text>

                      {unreadCount > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.message} numberOfLines={1}>
                      {item.lastMessage?.trim()
                        ? item.lastMessage
                        : 'Sin mensajes todavía'}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    flex: 1,
  },
  message: {
    color: '#6b7280',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
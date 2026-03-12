import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  markMessagesAsRead,
  sendMessage,
  setTypingStatus,
  subscribeChatInfo,
  subscribeMessages,
} from '../../services/chat';
import { isEmpty } from '../../utils/validators';
import { AuthContext } from '../auth-context';

type MessageItem = {
  id: string;
  senderId?: string;
  text?: string;
  createdAt?: any;
  readBy?: string[];
};

type ChatInfo = {
  id: string;
  clientId?: string;
  professionalId?: string;
  clientName?: string;
  professionalName?: string;
  typingBy?: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const chatId = useMemo(() => {
    const rawId = params.id;
    if (Array.isArray(rawId)) return String(rawId[0] || '');
    return String(rawId || '');
  }, [params.id]);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loadingChat, setLoadingChat] = useState(true);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId) {
      setLoadingChat(false);
      return;
    }

    setLoadingChat(true);

    const unsubscribeMessages = subscribeMessages(chatId, (data: MessageItem[]) => {
      setMessages(data);
      setLoadingChat(false);
    });

    const unsubscribeChatInfo = subscribeChatInfo(chatId, (data: ChatInfo | null) => {
      setChatInfo(data);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeChatInfo();
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !user?.id) return;

    markMessagesAsRead(chatId, user.id).catch((error) => {
      console.error('Error marcando mensajes como leídos:', error);
    });
  }, [chatId, user?.id, messages.length]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      if (chatId && user?.id) {
        setTypingStatus(chatId, user.id, false).catch(() => {});
      }
    };
  }, [chatId, user?.id]);

  const otherName = useMemo(() => {
    if (!chatInfo || !user?.id) return 'Chat';

    return user.id === chatInfo.clientId
      ? chatInfo.professionalName || 'Profesionista'
      : chatInfo.clientName || 'Cliente';
  }, [chatInfo, user?.id]);

  const isOtherTyping = useMemo(() => {
    if (!chatInfo?.typingBy || !user?.id) return false;
    return chatInfo.typingBy !== '' && chatInfo.typingBy !== user.id;
  }, [chatInfo?.typingBy, user?.id]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }, [messages]);

  const formatTime = (timestamp: any) => {
    if (!timestamp?.seconds) return '';

    const date = new Date(timestamp.seconds * 1000);

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleTyping = async (value: string) => {
    setText(value);

    if (!chatId || !user?.id) return;

    try {
      await setTypingStatus(chatId, user.id, value.trim().length > 0);

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      typingTimeout.current = setTimeout(() => {
        setTypingStatus(chatId, user.id, false).catch(() => {});
      }, 1200);
    } catch (error) {
      console.error('Error actualizando typing:', error);
    }
  };

  const handleSend = async () => {
    if (!chatId || !user?.id) return;
    if (isEmpty(text)) return;

    try {
      setSending(true);

      const cleanText = text.trim();

      await sendMessage(chatId, user.id, cleanText);
      setText('');

      await setTypingStatus(chatId, user.id, false);

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setSending(false);
    }
  };

  if (!chatId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text>No se encontró el chat.</Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.backErrorButton}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Button mode="text" onPress={() => router.back()}>
            Volver
          </Button>

          <View style={styles.headerCenter}>
            <Text variant="titleMedium" style={styles.headerTitle}>
              {otherName}
            </Text>

            {isOtherTyping && (
              <Text style={styles.typingText}>Escribiendo...</Text>
            )}
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {loadingChat ? (
          <View style={styles.centered}>
            <Text>Cargando mensajes...</Text>
          </View>
        ) : (
          <FlatList
            data={sortedMessages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isMine = item.senderId === user?.id;

              return (
                <View
                  style={[
                    styles.messageBubble,
                    isMine ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <Text style={isMine ? styles.myMessageText : styles.theirMessageText}>
                    {item.text || ''}
                  </Text>

                  <View style={styles.messageFooter}>
                    <Text style={isMine ? styles.myTimeText : styles.theirTimeText}>
                      {formatTime(item.createdAt)}
                    </Text>

                    {isMine && (
                      <Text style={styles.readMark}>
                        {(item.readBy || []).length > 1 ? '✓✓' : '✓'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Aún no hay mensajes.</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputWrap}>
          <TextInput
            label="Escribe un mensaje"
            value={text}
            onChangeText={handleTyping}
            mode="outlined"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          <Button
            mode="contained"
            onPress={handleSend}
            loading={sending}
            disabled={sending || isEmpty(text)}
            style={styles.sendButton}
            contentStyle={styles.sendButtonContent}
            labelStyle={styles.sendButtonLabel}
          >
            Enviar
          </Button>
        </View>
      </KeyboardAvoidingView>
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backErrorButton: {
    marginTop: 14,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  typingText: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 2,
  },
  headerSpacer: {
    width: 70,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  myTimeText: {
    color: '#dbeafe',
    fontSize: 11,
  },
  theirTimeText: {
    color: '#6b7280',
    fontSize: 11,
  },
  readMark: {
    color: '#dbeafe',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#6b7280',
  },
  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 90,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  sendButton: {
    borderRadius: 10,
    backgroundColor: '#2563eb',
    marginBottom: 10,
  },
  sendButtonContent: {
    height: 48,
  },
  sendButtonLabel: {
    color: '#fff',
    fontWeight: '700',
  },
});
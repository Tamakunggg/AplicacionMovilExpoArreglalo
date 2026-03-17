import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type GetOrCreateChatParams = {
  clientId: string;
  professionalId: string;
  clientName?: string;
  professionalName?: string;
  serviceId?: string;
};

export type ChatMessageItem = {
  id: string;
  senderId?: string;
  text?: string;
  createdAt?: any;
  readBy?: string[];
};

export type ChatInfoItem = {
  id: string;
  participants?: string[];
  clientId?: string;
  professionalId?: string;
  clientName?: string;
  professionalName?: string;
  lastMessage?: string;
  updatedAt?: any;
  createdAt?: any;
  typingBy?: string;
  serviceId?: string;
};

function buildChatId(clientId: string, professionalId: string) {
  const ids = [clientId, professionalId].sort();
  return `${ids[0]}_${ids[1]}`;
}

export async function getOrCreateChat({
  clientId,
  professionalId,
  clientName = '',
  professionalName = '',
  serviceId = '',
}: GetOrCreateChatParams) {
  if (!clientId || !professionalId) {
    throw new Error('Faltan IDs para crear el chat.');
  }

  const chatId = buildChatId(clientId, professionalId);
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    const currentData = chatSnap.data() || {};
    const updates: Record<string, any> = {};

    if (clientName && !currentData.clientName) {
      updates.clientName = clientName;
    }

    if (professionalName && !currentData.professionalName) {
      updates.professionalName = professionalName;
    }

    if (serviceId && !currentData.serviceId) {
      updates.serviceId = serviceId;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(chatRef, updates);
    }

    return chatId;
  }

  await setDoc(chatRef, {
    participants: [clientId, professionalId],
    clientId,
    professionalId,
    clientName,
    professionalName,
    serviceId,
    lastMessage: '',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    typingBy: '',
  });

  await setDoc(doc(db, 'chats', chatId, 'meta', 'unreadCounts'), {
    [clientId]: 0,
    [professionalId]: 0,
  });

  return chatId;
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const cleanChatId = String(chatId || '').trim();
  const cleanSenderId = String(senderId || '').trim();
  const cleanText = String(text || '').trim();

  if (!cleanChatId || !cleanSenderId || !cleanText) return;

  const chatRef = doc(db, 'chats', cleanChatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    throw new Error('No se encontró el chat.');
  }

  const chatData = chatSnap.data();
  const participants: string[] = Array.isArray(chatData.participants)
    ? chatData.participants
    : [];

  const receiverId = participants.find((id) => id !== cleanSenderId) || '';

  await addDoc(collection(db, 'chats', cleanChatId, 'messages'), {
    senderId: cleanSenderId,
    text: cleanText,
    createdAt: serverTimestamp(),
    readBy: [cleanSenderId],
  });

  const unreadMetaRef = doc(db, 'chats', cleanChatId, 'meta', 'unreadCounts');
  const unreadMetaSnap = await getDoc(unreadMetaRef);
  const unreadData = unreadMetaSnap.exists() ? unreadMetaSnap.data() : {};

  const currentUnreadReceiver = Number(unreadData?.[receiverId] || 0);
  const currentUnreadSender = Number(unreadData?.[cleanSenderId] || 0);

  await setDoc(
    unreadMetaRef,
    {
      [cleanSenderId]: currentUnreadSender,
      [receiverId]: receiverId ? currentUnreadReceiver + 1 : 0,
    },
    { merge: true }
  );

  await updateDoc(chatRef, {
    lastMessage: cleanText,
    updatedAt: serverTimestamp(),
    typingBy: '',
  });
}

export function subscribeMessages(
  chatId: string,
  callback: (messages: ChatMessageItem[]) => void
) {
  const cleanChatId = String(chatId || '').trim();
  const messagesRef = collection(db, 'chats', cleanChatId, 'messages');

  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const messages = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        }) as ChatMessageItem[];

      callback(messages);
    },
    (error) => {
      console.error('Error en subscribeMessages:', error);
      callback([]);
    }
  );
}

export async function markMessagesAsRead(chatId: string, userId: string) {
  const cleanChatId = String(chatId || '').trim();
  const cleanUserId = String(userId || '').trim();

  if (!cleanChatId || !cleanUserId) return;

  const unreadMetaRef = doc(db, 'chats', cleanChatId, 'meta', 'unreadCounts');

  await setDoc(
    unreadMetaRef,
    {
      [cleanUserId]: 0,
    },
    { merge: true }
  );

  const messagesRef = collection(db, 'chats', cleanChatId, 'messages');
  const snapshot = await getDocs(messagesRef);

  const updates = snapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data();
      const readBy = Array.isArray(data.readBy) ? data.readBy : [];
      return !readBy.includes(cleanUserId);
    })
    .map((docSnap) => {
      const data = docSnap.data();
      const readBy = Array.isArray(data.readBy) ? data.readBy : [];

      return updateDoc(docSnap.ref, {
        readBy: [...readBy, cleanUserId],
      });
    });

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

export function subscribeUnreadCounts(
  chatId: string,
  callback: (data: Record<string, number>) => void
) {
  const cleanChatId = String(chatId || '').trim();
  const unreadMetaRef = doc(db, 'chats', cleanChatId, 'meta', 'unreadCounts');

  return onSnapshot(
    unreadMetaRef,
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as Record<string, number>) : {});
    },
    (error) => {
      console.error('Error en subscribeUnreadCounts:', error);
      callback({});
    }
  );
}

export async function setTypingStatus(chatId: string, userId: string, isTyping: boolean) {
  const cleanChatId = String(chatId || '').trim();
  const cleanUserId = String(userId || '').trim();

  if (!cleanChatId || !cleanUserId) return;

  await updateDoc(doc(db, 'chats', cleanChatId), {
    typingBy: isTyping ? cleanUserId : '',
  });
}

export function subscribeChatInfo(
  chatId: string,
  callback: (chatData: ChatInfoItem | null) => void
) {
  const cleanChatId = String(chatId || '').trim();

  return onSnapshot(
    doc(db, 'chats', cleanChatId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.id,
          ...snapshot.data(),
        } as ChatInfoItem);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error en subscribeChatInfo:', error);
      callback(null);
    }
  );
}
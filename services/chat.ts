import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

type GetOrCreateChatParams = {
  clientId: string;
  professionalId: string;
  clientName: string;
  professionalName: string;
};

export async function getOrCreateChat({
  clientId,
  professionalId,
  clientName,
  professionalName,
}: GetOrCreateChatParams) {
  const q = query(
    collection(db, 'chats'),
    where('clientId', '==', clientId),
    where('professionalId', '==', professionalId)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const docRef = await addDoc(collection(db, 'chats'), {
    participants: [clientId, professionalId],
    clientId,
    professionalId,
    clientName,
    professionalName,
    lastMessage: '',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    typingBy: '',
  });

  await setDoc(doc(db, 'chats', docRef.id, 'meta', 'unreadCounts'), {
    [clientId]: 0,
    [professionalId]: 0,
  });

  return docRef.id;
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const cleanText = text.trim();
  if (!cleanText) return;

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) return;

  const chatData = chatSnap.data();
  const participants: string[] = chatData.participants || [];
  const receiverId = participants.find((id) => id !== senderId) || '';

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text: cleanText,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });

  const unreadMetaRef = doc(db, 'chats', chatId, 'meta', 'unreadCounts');
  const unreadMetaSnap = await getDoc(unreadMetaRef);
  const unreadData = unreadMetaSnap.exists() ? unreadMetaSnap.data() : {};

  const currentUnread = Number(unreadData?.[receiverId] || 0);

  await setDoc(
    unreadMetaRef,
    {
      [senderId]: Number(unreadData?.[senderId] || 0),
      [receiverId]: currentUnread + 1,
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
  callback: (messages: any[]) => void
) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(messages);
  });
}

export async function markMessagesAsRead(chatId: string, userId: string) {
  const unreadMetaRef = doc(db, 'chats', chatId, 'meta', 'unreadCounts');

  await setDoc(
    unreadMetaRef,
    {
      [userId]: 0,
    },
    { merge: true }
  );
}

export function subscribeUnreadCounts(
  chatId: string,
  callback: (data: Record<string, number>) => void
) {
  const unreadMetaRef = doc(db, 'chats', chatId, 'meta', 'unreadCounts');

  return onSnapshot(unreadMetaRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as Record<string, number>) : {});
  });
}

export async function setTypingStatus(chatId: string, userId: string, isTyping: boolean) {
  await updateDoc(doc(db, 'chats', chatId), {
    typingBy: isTyping ? userId : '',
  });
}

export function subscribeChatInfo(
  chatId: string,
  callback: (chatData: any) => void
) {
  return onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  });
}
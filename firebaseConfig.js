import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// 1. Importamos las herramientas necesarias para la persistencia
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Inicializamos la App de Firebase
const app = initializeApp(firebaseConfig);

// 2. Configuramos Auth con persistencia en AsyncStorage
// Usamos una variable 'auth' que se inicializa solo si no existe ya
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (error) {
  // Si ya estaba inicializado, simplemente lo obtenemos
  auth = getAuth(app);
}

// Exportamos las instancias
export const db = getFirestore(app);
export { auth };
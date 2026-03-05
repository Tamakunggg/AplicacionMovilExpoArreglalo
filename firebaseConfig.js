import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDfVWcgDAJ31SudTwjWZOur-DtX4wxMznM",
  authDomain: "aplicacionmovilexpoarreglalo.firebaseapp.com",
  projectId: "aplicacionmovilexpoarreglalo",
  storageBucket: "aplicacionmovilexpoarreglalo.firebasestorage.app",
  messagingSenderId: "370252509649",
  appId: "1:370252509649:web:093bb491728a5c98c430f0"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
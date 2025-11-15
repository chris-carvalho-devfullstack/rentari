// src/services/FirebaseService.ts
// Certifique-se de que o nome do arquivo no disco é "FirebaseService.ts"

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; 
import { getStorage } from 'firebase/storage';

// CORREÇÃO CRÍTICA: Hardcode o nome do bucket ativo para eliminar a falha na leitura do ambiente Vercel.
const ACTIVE_STORAGE_BUCKET = 'rentari-1dc75.firebasestorage.app'; 

// As credenciais são carregadas do arquivo .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // 1. Usa o nome hardcoded para garantir que o initializeApp tenha o valor correto
  storageBucket: ACTIVE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

// 2. Inicializa o Storage APENAS com o app (a URL já está na config do app).
export const storage = getStorage(app);
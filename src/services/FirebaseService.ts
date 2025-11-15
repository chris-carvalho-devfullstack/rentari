// src/services/FirebaseService.ts
// Certifique-se de que o nome do arquivo no disco é "FirebaseService.ts"

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; 
// CORREÇÃO: Importado getStorage
import { getStorage } from 'firebase/storage';

// Definir a URL completa do bucket que existe e tem CORS configurado.
// Isto garante que o objeto 'storage' seja vinculado ao bucket correto.
const BUCKET_URL = `gs://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'rentari-1dc75.firebasestorage.app'}`;

// As credenciais são carregadas do arquivo .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Manter esta propriedade para initializeApp, mas o getStorage abaixo é mais forte
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'rentari-1dc75.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
// CORREÇÃO CRÍTICA: Inicializa o Storage explicitamente com a URL do bucket.
export const storage = getStorage(app, BUCKET_URL);
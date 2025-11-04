// src/providers/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/services/FirebaseService'; // <-- Ocorrendo o erro AQUI
import { useAuthStore } from '@/hooks/useAuthStore';
import { Usuario } from '@/types/usuario'; 

// O restante do código do AuthProvider (que você já colou)...
const AuthContext = createContext<{ initialized: boolean }>({ initialized: false });

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const { setUser, clearUser, fetchUserData } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const userData: Usuario = await fetchUserData(user.uid, user.email || '', user.displayName || 'Usuário Rentou');
        setUser(userData);
      } else {
        clearUser();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, clearUser, fetchUserData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <p className="text-xl font-medium text-gray-700 dark:text-gray-300">Carregando sessão...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={{ initialized: true }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
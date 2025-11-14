// src/hooks/useAuthStore.ts

import { create } from 'zustand';
import { Usuario } from '@/types/usuario';
import { signOut } from 'firebase/auth'; // Importar signOut
import { auth } from '@/services/FirebaseService'; // Importar auth

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  setUser: (user: Usuario) => void;
  clearUser: () => void;
  logout: () => Promise<void>; // Adicionado: Função de Logout
  fetchUserData: (id: string, email: string, name: string) => Promise<Usuario>;
}

// Função auxiliar para limpar o cookie de autenticação no lado do cliente
const clearAuthCookie = () => {
    // Define a data de expiração para o passado, forçando a exclusão do cookie
    document.cookie = `rentou-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log("--- [DEBUG] Cookie 'rentou-auth-token' limpo.");
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  
  // IMPLEMENTAÇÃO DO LOGOUT
  logout: async () => {
    try {
      if (typeof window !== 'undefined') {
        clearAuthCookie();
      }
      await signOut(auth); // Deslogar do Firebase
      get().clearUser(); // Limpar o estado do Zustand
      console.log('--- [DEBUG] Logout (Firebase e Zustand) concluído com sucesso.');
    } catch (error) {
      console.error('Erro durante o logout, forçando limpeza local:', error);
      // Garantir a limpeza do estado local e do cookie mesmo em caso de erro no Firebase
      get().clearUser();
      if (typeof window !== 'undefined') {
        clearAuthCookie();
      }
    }
  },

  // Simulação de função de API/Firestore para buscar dados complementares do usuário
  fetchUserData: async (id: string, email: string, name: string): Promise<Usuario> => {
    // Simulação: buscaria a role (PROPRIETARIO) no Firestore/API
    await new Promise(resolve => setTimeout(resolve, 300)); 
    
    const userData: Usuario = {
      id,
      email,
      nome: name || 'Proprietário Rentou',
      tipo: 'PROPRIETARIO', // Valor padrão para a plataforma Rentou
    };
    
    return userData;
  },
}));
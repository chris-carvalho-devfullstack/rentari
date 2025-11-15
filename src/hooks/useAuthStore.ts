// src/hooks/useAuthStore.ts

import { create } from 'zustand';
import { Usuario } from '@/types/usuario';
import { signOut } from 'firebase/auth'; 
import { auth } from '@/services/FirebaseService'; 

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  setUser: (user: Usuario) => void;
  clearUser: () => void;
  logout: () => Promise<void>; 
  fetchUserData: (id: string, email: string, name: string) => Promise<Usuario>;
  updateUser: (newUserData: Partial<Usuario>) => Promise<Usuario>; 
}

// Função auxiliar para limpar o cookie de autenticação no lado do cliente
const clearAuthCookie = () => {
    document.cookie = `rentou-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log("--- [DEBUG] Cookie 'rentou-auth-token' limpo.");
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  
  logout: async () => {
    try {
      if (typeof window !== 'undefined') {
        clearAuthCookie();
      }
      await signOut(auth); 
      get().clearUser(); 
      console.log('--- [DEBUG] Logout (Firebase e Zustand) concluído com sucesso.');
    } catch (error) {
      console.error('Erro durante o logout, forçando limpeza local:', error);
      get().clearUser();
      if (typeof window !== 'undefined') {
        clearAuthCookie();
      }
    }
  },

  // CORREÇÃO: Inicializa os dados bancários com valores padrão no login
  fetchUserData: async (id: string, email: string, name: string): Promise<Usuario> => {
    await new Promise(resolve => setTimeout(resolve, 300)); 
    
    const userData: Usuario = {
      id,
      email,
      nome: name || 'Proprietário Rentou',
      tipo: 'PROPRIETARIO',
      // NOVO: Inicialização dos dados bancários
      dadosBancarios: {
        banco: 'Banco Rentou (Simulado)',
        agencia: '0001',
        conta: '123456-7',
        pixTipo: 'EMAIL',
        pixChave: email, // Usa o email do usuário como chave PIX inicial (comum)
      }
    };
    
    return userData;
  },
  
  // ATUALIZADO: updateUser agora aceita e persiste a nova estrutura de dados
  updateUser: async (newUserData: Partial<Usuario>): Promise<Usuario> => {
    const currentState = get();
    
    if (!currentState.user) {
        throw new Error("Usuário não autenticado. Impossível atualizar.");
    }
    
    // Simula a chamada à API/Firestore (atraso)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Merge dos dados (incluindo o sub-objeto dadosBancarios, se presente)
    const updatedUser: Usuario = {
        ...currentState.user,
        ...newUserData,
        dadosBancarios: {
            ...currentState.user.dadosBancarios,
            ...(newUserData.dadosBancarios || {})
        },
        id: currentState.user.id, 
        tipo: currentState.user.tipo,
    };
    
    set({ user: updatedUser });
    
    console.log('--- [DEBUG] Usuário atualizado com sucesso no Zustand:', updatedUser);
    return updatedUser;
  },
}));
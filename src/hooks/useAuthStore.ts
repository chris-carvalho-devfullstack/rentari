// src/hooks/useAuthStore.ts

import { create } from 'zustand';
import { Usuario } from '@/types/usuario';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  setUser: (user: Usuario) => void;
  clearUser: () => void;
  fetchUserData: (id: string, email: string, name: string) => Promise<Usuario>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  
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
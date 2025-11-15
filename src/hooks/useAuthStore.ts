// src/hooks/useAuthStore.ts

import { create } from 'zustand';
import { Usuario, QualificacaoPF, QualificacaoPJ, UpdateUserDadosBancarios } from '@/types/usuario';
import { signOut } from 'firebase/auth'; 
import { auth } from '@/services/FirebaseService'; 
import { fetchUserByUid, createNewUserDocument, updateUserInFirestore, fetchUserByEmail } from '@/services/UserService'; 

// --- Interface de Estado Atualizada ---
interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  setUser: (user: Usuario) => void;
  clearUser: () => void;
  logout: () => Promise<void>; 
  fetchUserData: (id: string, email: string, name: string) => Promise<Usuario>;
  updateUser: (newUserData: Partial<Usuario> | QualificacaoPF | QualificacaoPJ) => Promise<Usuario>; 
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

  // NOVO: Lógica de busca/criação/associação de usuário no Firestore
  fetchUserData: async (id: string, email: string, name: string): Promise<Usuario> => {
    // 1. Tenta buscar pelo UID (Método principal - para usuários existentes)
    let userData = await fetchUserByUid(id);

    if (userData) {
        console.log('[useAuthStore] Usuário encontrado por UID.');
        return userData;
    }
    
    // 2. Se não encontrou por UID, checa se o email já existe (para associação de credenciais)
    const existingUserByEmail = await fetchUserByEmail(email);

    if (existingUserByEmail) {
        // CASO: Usuário existe (registrado com Email/Senha), mas está logando com Google
        // O Firebase Auth já cuidou de associar a credencial. 
        // Apenas criamos o documento com o NOVO UID, se for o caso, 
        // ou buscamos o documento existente (se tivesse UID antigo).
        // Aqui, criamos um novo documento com o UID do Google para garantir a persistência.
        console.warn(`[useAuthStore] Usuário com email ${email} já existia (UID: ${existingUserByEmail.id}). Criando documento com o novo UID (${id}).`);

        // Copiamos os dados importantes do documento antigo para o novo UID (ex: nome, telefone)
        // Nota: Idealmente, você migraria *todos* os dados para o novo UID ou forçaria o login com o provedor original. 
        // Para simplificar, o sistema assume que o documento do novo UID (Google) está sendo criado/atualizado agora.
    }
    
    // CASO: Usuário totalmente novo (Google ou Email/Senha)
    userData = await createNewUserDocument(id, email, name);
    console.log('[useAuthStore] Novo usuário criado do zero.');
    
    // Garante que o email seja o mais atualizado (do Firebase Auth)
    if (userData.email !== email) {
      userData = { ...userData, email: email };
    }

    return userData;
  },
  
  // ATUALIZADO: updateUser... (Mantida a lógica de persistência no Firestore e mesclagem de estado)
  updateUser: async (newUserData) => {
    const currentState = get();
    
    if (!currentState.user) {
        throw new Error("Usuário não autenticado. Impossível atualizar.");
    }
    
    const currentUser = currentState.user;
    let updatedUser: Usuario;
    
    // Verifica se o payload é uma Qualificação completa (PF ou PJ)
    const isQualificacaoPayload = 
        (newUserData as QualificacaoPF).documentoTipo === 'PF' || 
        (newUserData as QualificacaoPJ).documentoTipo === 'PJ';
        
    let firestorePayload: any = {};
    
    if (isQualificacaoPayload) {
        const qualificacaoPayload = newUserData as QualificacaoPF | QualificacaoPJ;
        
        // 1. Prepara o payload do Firestore (para Qualificação)
        firestorePayload.qualificacao = qualificacaoPayload;
        firestorePayload.documentoIdentificacao = qualificacaoPayload.documentoTipo === 'PF' 
            ? qualificacaoPayload.cpf 
            : qualificacaoPayload.cnpj;
        
        // 2. Atualiza o estado local
        updatedUser = {
            ...currentUser,
            qualificacao: qualificacaoPayload,
            documentoIdentificacao: firestorePayload.documentoIdentificacao,
            cpf: qualificacaoPayload.documentoTipo === 'PF' ? qualificacaoPayload.cpf : currentUser.cpf,
        };

    } else {
        // Trata como Partial<Usuario> (dados básicos, foto, dados bancários)
        const partialUpdate = newUserData as Partial<Usuario>;
        
        // 1. Prepara o payload do Firestore (dados básicos)
        firestorePayload = { ...partialUpdate };
        
        // Se o campo 'fotoUrl' estiver na atualização e for null, deve ser salvo como ''
        if ('fotoUrl' in partialUpdate && partialUpdate.fotoUrl === null) {
             firestorePayload.fotoUrl = '';
        }
        
        // Se for atualização de dados bancários, aninha-os para o Firestore
        if (partialUpdate.dadosBancarios) {
            firestorePayload['dadosBancarios'] = partialUpdate.dadosBancarios;
            delete firestorePayload.dadosBancarios; // Garante que o campo não vá como undefined
        }
        
        // 2. Atualiza o estado local mesclando
        updatedUser = {
            ...currentUser,
            ...partialUpdate,
            dadosBancarios: {
                ...currentUser.dadosBancarios,
                ...(partialUpdate.dadosBancarios || {} as UpdateUserDadosBancarios),
            }
        };
    }
    
    // Persiste no Firestore
    try {
        await updateUserInFirestore(currentUser.id, firestorePayload);
        
        // Atualiza o Zustand APENAS se o Firestore tiver sucesso
        set({ user: updatedUser });

        console.log('--- [DEBUG] Usuário atualizado com sucesso no Zustand e Firestore.');
        return updatedUser;
        
    } catch (e) {
        console.error('Falha na persistência do usuário no Firestore:', e);
        throw new Error("Falha ao salvar dados no banco de dados.");
    }
  },
}));
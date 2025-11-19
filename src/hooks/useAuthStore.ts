// src/hooks/useAuthStore.ts

import { create } from 'zustand';
import { Usuario, QualificacaoPF, QualificacaoPJ, UpdateUserDadosBancarios } from '@/types/usuario';
import { signOut, deleteUser } from 'firebase/auth'; // <--- ADICIONADO deleteUser
import { auth } from '@/services/FirebaseService'; 
import { 
    fetchUserByUid, 
    createNewUserDocument, 
    updateUserInFirestore, 
    fetchUserByEmail,
    deleteUserDocument // <--- ADICIONADO
} from '@/services/UserService'; 

// --- Interface de Estado Atualizada ---
interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  setUser: (user: Usuario) => void;
  clearUser: () => void;
  logout: () => Promise<void>; 
  deleteAccount: () => Promise<void>; // <--- NOVA AÇÃO
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

  // --- NOVA FUNÇÃO: DELETAR CONTA ---
  deleteAccount: async () => {
    const currentUser = auth.currentUser;
    const currentStoreUser = get().user;

    if (!currentUser || !currentStoreUser) {
        throw new Error("Nenhum usuário autenticado para exclusão.");
    }

    try {
        console.log('--- [DEBUG] Iniciando processo de exclusão de conta...');

        // 1. Excluir dados do Firestore (Perfil)
        await deleteUserDocument(currentStoreUser.id);
        
        // 2. Excluir usuário do Firebase Authentication
        // Nota: Isso requer que o login seja recente. Se falhar, o frontend deve pedir re-login.
        await deleteUser(currentUser);

        // 3. Limpar sessão local
        if (typeof window !== 'undefined') {
            clearAuthCookie();
        }
        get().clearUser();

        console.log('--- [DEBUG] Conta excluída permanentemente.');

    } catch (error: any) {
        console.error('Erro ao excluir conta:', error);
        if (error.code === 'auth/requires-recent-login') {
            throw new Error("Por segurança, faça logout e login novamente antes de excluir sua conta.");
        }
        throw new Error("Falha ao excluir a conta. Tente novamente mais tarde.");
    }
  },

  // Lógica de busca/criação/associação de usuário no Firestore
  fetchUserData: async (id: string, email: string, name: string): Promise<Usuario> => {
    // 1. Tenta buscar pelo UID (Método principal - para usuários existentes)
    let userData = await fetchUserByUid(id);

    if (userData) {
        console.log('[useAuthStore] Usuário encontrado por UID.');

        // === CORREÇÃO AQUI ===
        // Se o usuário já existe, mas o nome fornecido agora (no cadastro) é válido 
        // e diferente do nome genérico que está no banco, atualizamos.
        const nomesGenericos = ['Usuário Rentou', 'Proprietário Rentou', 'Novo Usuário'];
        
        if (name && !nomesGenericos.includes(name) && userData.nome !== name) {
             console.log(`[useAuthStore] Atualizando nome do perfil: De '${userData.nome}' para '${name}'`);
             await updateUserInFirestore(id, { nome: name });
             userData = { ...userData, nome: name };
        }
        // =====================

        return userData;
    }
    
    // 2. Se não encontrou por UID, checa se o email já existe
    const existingUserByEmail = await fetchUserByEmail(email);

    if (existingUserByEmail) {
        console.warn(`[useAuthStore] Usuário com email ${email} já existia. Criando documento com o novo UID.`);
    }
    
    // CASO: Usuário totalmente novo
    userData = await createNewUserDocument(id, email, name);
    console.log('[useAuthStore] Novo usuário criado do zero.');
    
    // Garante que o email seja o mais atualizado
    if (userData.email !== email) {
      userData = { ...userData, email: email };
    }

    return userData;
  },
  
  // Atualiza dados do usuário
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
        
        if ('fotoUrl' in partialUpdate && partialUpdate.fotoUrl === null) {
             firestorePayload.fotoUrl = '';
        }
        
        if (partialUpdate.dadosBancarios) {
            firestorePayload['dadosBancarios'] = partialUpdate.dadosBancarios;
            delete firestorePayload.dadosBancarios; 
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
    
    try {
        await updateUserInFirestore(currentUser.id, firestorePayload);
        set({ user: updatedUser });
        return updatedUser;
    } catch (e) {
        console.error('Falha na persistência do usuário no Firestore:', e);
        throw new Error("Falha ao salvar dados no banco de dados.");
    }
  },
}));
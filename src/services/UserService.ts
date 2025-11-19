// src/services/UserService.ts

import { db } from './FirebaseService';
import { Usuario, QualificacaoPF, QualificacaoPJ } from '@/types/usuario';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    deleteDoc, // <--- ADICIONADO
    PartialWithFieldValue,
    DocumentData,
    serverTimestamp, 
    query, 
    collection, 
    where, 
    getDocs, 
} from 'firebase/firestore';

/**
 * UTILITY: Cria um slug simples a partir do nome para ser usado como handle.
 */
const slugify = (text: string): string => {
    return text.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/[\s_-]+/g, '-')  // Substitui espaços e hifens por um único hífen
        .replace(/^-+|-+$/g, '');  // Remove hifens no início ou fim
};


/**
 * Converte DocumentData do Firestore para o tipo Usuario, preenchendo padrões se necessário.
 */
const mapDocToUsuario = (docData: DocumentData, id: string): Usuario => {
    // Mescla dados do Firestore com valores padrão para evitar 'undefined' no app
    return {
        id,
        email: docData.email || '',
        nome: docData.nome || 'Usuário Rentou',
        tipo: docData.tipo || 'PROPRIETARIO', 
        telefone: docData.telefone || '',
        documentoIdentificacao: docData.documentoIdentificacao || '',
        fotoUrl: docData.fotoUrl || '',
        cpf: docData.cpf, // Pode ser undefined no Firestore se não foi salvo
        handlePublico: docData.handlePublico || slugify(docData.nome || 'usuario'), // Novo campo
        // O Firestore lida com objetos aninhados, mas garantimos o fallback
        qualificacao: docData.qualificacao, 
        dadosBancarios: docData.dadosBancarios || {
             banco: 'Pendente', agencia: '', conta: '', tipo: 'CORRENTE', pixTipo: 'EMAIL', pixChave: ''
        },
    } as Usuario;
}


/**
 * Busca os dados de um usuário pelo UID. Se não encontrar, retorna null.
 */
export async function fetchUserByUid(uid: string): Promise<Usuario | null> {
    console.log(`[UserService] Buscando dados do usuário UID: ${uid} no Firestore...`);
    const userDocRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        console.log('[UserService] Dados encontrados.');
        return mapDocToUsuario(docSnap.data(), uid);
    } else {
        console.log('[UserService] Usuário não encontrado no Firestore.');
        return null;
    }
}

/**
 * Busca um usuário pelo campo 'email'. Útil para associar contas Google/Email+Senha.
 */
export async function fetchUserByEmail(email: string): Promise<Usuario | null> {
    console.log(`[UserService] Buscando usuário pelo email: ${email} (para associação)...`);
    const usersCollection = collection(db, 'usuarios');
    // Consulta por email (requer índice no Firestore)
    const q = query(usersCollection, where('email', '==', email));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Pega o primeiro documento encontrado (deve ser único por email)
        const docSnap = querySnapshot.docs[0];
        console.log(`[UserService] Usuário encontrado por email. UID: ${docSnap.id}`);
        return mapDocToUsuario(docSnap.data(), docSnap.id);
    }
    console.log('[UserService] Nenhum usuário encontrado com esse email.');
    return null;
}

/**
 * Busca um usuário pelo handle público (para página pública de proprietário).
 */
export async function fetchUserByHandle(handle: string): Promise<Usuario | null> {
    console.log(`[UserService] Buscando usuário pelo handle público: ${handle}...`);
    const usersCollection = collection(db, 'usuarios');
    // Consulta por handlePublico (requer índice no Firestore)
    const q = query(usersCollection, where('handlePublico', '==', handle));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        console.log(`[UserService] Proprietário encontrado por handle. UID: ${docSnap.id}`);
        return mapDocToUsuario(docSnap.data(), docSnap.id);
    }
    console.log('[UserService] Nenhum usuário encontrado com esse handle público.');
    return null;
}


/**
 * Cria um novo documento de usuário no Firestore no primeiro login ou cadastro.
 */
export async function createNewUserDocument(uid: string, email: string, name: string): Promise<Usuario> {
    console.log(`[UserService] Criando novo documento para UID: ${uid}...`);
    
    const defaultName = name || 'Proprietário Rentou';
    
    // 1. Objeto base de dados (contém 'undefined' nos campos opcionais)
    const baseInitialData = {
        email,
        nome: defaultName,
        tipo: 'PROPRIETARIO',
        fotoUrl: '',
        telefone: '',
        documentoIdentificacao: '', 
        cpf: undefined, 
        handlePublico: slugify(defaultName) + '-' + uid.slice(0, 4), // Geração do handle com sufixo
        qualificacao: undefined, 
        dadosBancarios: {
            banco: 'Pendente',
            agencia: '',
            conta: '',
            tipo: 'CORRENTE' as const, // Força a tipagem de constante
            pixTipo: 'EMAIL' as const, 
            pixChave: email, 
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // 2. Limpa o objeto removendo chaves com valor 'undefined'
    const initialDataClean: DocumentData = Object.fromEntries(
        Object.entries(baseInitialData).filter(([, value]) => value !== undefined)
    );
    
    const userDocRef = doc(db, 'usuarios', uid);
    await setDoc(userDocRef, initialDataClean);

    console.log('[UserService] Novo usuário criado com sucesso.');
    // Retorna o objeto base completo (incluindo undefined) para o Zustand
    return { ...baseInitialData, id: uid } as Usuario;
}

/**
 * Atualiza um ou mais campos do perfil do usuário no Firestore.
 */
export async function updateUserInFirestore(
    uid: string, 
    data: Partial<Usuario> | PartialWithFieldValue<QualificacaoPF | QualificacaoPJ>
): Promise<void> {
    console.log(`[UserService] Atualizando dados para UID: ${uid}...`);
    
    const userDocRef = doc(db, 'usuarios', uid);
    
    const updatePayload: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userDocRef, updatePayload);
    console.log('[UserService] Dados atualizados no Firestore.');
}

/**
 * EXCLUIR USUÁRIO: Remove permanentemente o documento do usuário do Firestore.
 */
export async function deleteUserDocument(uid: string): Promise<void> {
    console.log(`[UserService] Excluindo documento do usuário UID: ${uid}...`);
    const userDocRef = doc(db, 'usuarios', uid);
    await deleteDoc(userDocRef);
    console.log('[UserService] Documento do usuário excluído com sucesso.');
}
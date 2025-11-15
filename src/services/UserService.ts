// src/services/UserService.ts

import { db } from './FirebaseService';
import { Usuario, QualificacaoPF, QualificacaoPJ } from '@/types/usuario';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    PartialWithFieldValue,
    DocumentData,
    serverTimestamp, 
    FieldValue,
    query, 
    collection, 
    where, 
    getDocs, 
} from 'firebase/firestore';

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
 * NOVO: Busca um usuário pelo campo 'email'. Útil para associar contas Google/Email+Senha.
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
 * Cria um novo documento de usuário no Firestore no primeiro login ou cadastro.
 */
export async function createNewUserDocument(uid: string, email: string, name: string): Promise<Usuario> {
    console.log(`[UserService] Criando novo documento para UID: ${uid}...`);
    
    // 1. Objeto base de dados (contém 'undefined' nos campos opcionais)
    const baseInitialData = {
        email,
        nome: name || 'Proprietário Rentou',
        tipo: 'PROPRIETARIO',
        fotoUrl: '',
        telefone: '',
        documentoIdentificacao: '', 
        cpf: undefined, 
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
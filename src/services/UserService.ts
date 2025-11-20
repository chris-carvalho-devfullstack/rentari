// src/services/UserService.ts

import { db } from './FirebaseService';
import { Usuario, QualificacaoPF, QualificacaoPJ } from '@/types/usuario';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    deleteDoc, 
    PartialWithFieldValue,
    DocumentData,
    serverTimestamp, 
    query, 
    collection, 
    where, 
    getDocs, 
} from 'firebase/firestore';

const slugify = (text: string): string => {
    return text.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const mapDocToUsuario = (docData: DocumentData, id: string): Usuario => {
    return {
        id,
        email: docData.email || '',
        nome: docData.nome || 'Usuário Rentou',
        tipo: docData.tipo || 'PROPRIETARIO', 
        // NOVO: Mapeamento do perfil e pontos importantes
        perfil: docData.perfil || 'PROPRIETARIO', 
        pontosImportantes: docData.pontosImportantes || [],
        
        telefone: docData.telefone || '',
        documentoIdentificacao: docData.documentoIdentificacao || '',
        fotoUrl: docData.fotoUrl || '',
        cpf: docData.cpf,
        handlePublico: docData.handlePublico || slugify(docData.nome || 'usuario'),
        qualificacao: docData.qualificacao, 
        dadosBancarios: docData.dadosBancarios || {
             banco: 'Pendente', agencia: '', conta: '', tipo: 'CORRENTE', pixTipo: 'EMAIL', pixChave: ''
        },
    } as Usuario;
}

export async function fetchUserByUid(uid: string): Promise<Usuario | null> {
    console.log(`[UserService] Buscando dados do usuário UID: ${uid} no Firestore...`);
    const userDocRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        return mapDocToUsuario(docSnap.data(), uid);
    } else {
        return null;
    }
}

export async function fetchUserByEmail(email: string): Promise<Usuario | null> {
    const usersCollection = collection(db, 'usuarios');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return mapDocToUsuario(docSnap.data(), docSnap.id);
    }
    return null;
}

export async function fetchUserByHandle(handle: string): Promise<Usuario | null> {
    const usersCollection = collection(db, 'usuarios');
    const q = query(usersCollection, where('handlePublico', '==', handle));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return mapDocToUsuario(docSnap.data(), docSnap.id);
    }
    return null;
}

// ATUALIZADO: Agora aceita o perfil opcionalmente na criação, se vier do signup
export async function createNewUserDocument(uid: string, email: string, name: string, perfilInicial?: string): Promise<Usuario> {
    console.log(`[UserService] Criando novo documento para UID: ${uid}...`);
    
    const defaultName = name || 'Novo Usuário';
    
    const baseInitialData = {
        email,
        nome: defaultName,
        tipo: 'PROPRIETARIO',
        // NOVO: Define o perfil inicial
        perfil: perfilInicial || 'PROPRIETARIO',
        pontosImportantes: [],
        
        fotoUrl: '',
        telefone: '',
        documentoIdentificacao: '', 
        cpf: undefined, 
        handlePublico: slugify(defaultName) + '-' + uid.slice(0, 4),
        qualificacao: undefined, 
        dadosBancarios: {
            banco: 'Pendente',
            agencia: '',
            conta: '',
            tipo: 'CORRENTE' as const,
            pixTipo: 'EMAIL' as const, 
            pixChave: email, 
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const initialDataClean: DocumentData = Object.fromEntries(
        Object.entries(baseInitialData).filter(([, value]) => value !== undefined)
    );
    
    const userDocRef = doc(db, 'usuarios', uid);
    await setDoc(userDocRef, initialDataClean);

    return { ...baseInitialData, id: uid } as Usuario;
}

export async function updateUserInFirestore(
    uid: string, 
    data: Partial<Usuario> | PartialWithFieldValue<QualificacaoPF | QualificacaoPJ>
): Promise<void> {
    const userDocRef = doc(db, 'usuarios', uid);
    
    const updatePayload: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userDocRef, updatePayload);
}

export async function deleteUserDocument(uid: string): Promise<void> {
    const userDocRef = doc(db, 'usuarios', uid);
    await deleteDoc(userDocRef);
}
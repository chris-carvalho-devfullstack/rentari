import { getFirestore, collection, addDoc, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Condominio } from '@/types/condominio';

const getDb = () => getFirestore(getApp());

// Variáveis globais simuladas do ambiente (ajuste conforme seu setup real de config)
const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'default-app-id';

const COLLECTION_NAME = 'condominios';

const getCollectionRef = () => {
    const db = getDb();
    // Usando o padrão de path do projeto: artifacts/{appId}/public/data/{collection}
    return collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
};

export const adicionarCondominio = async (dados: Omit<Condominio, 'id'>): Promise<Condominio> => {
    try {
        const colRef = getCollectionRef();
        const docRef = await addDoc(colRef, {
            ...dados,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        return { id: docRef.id, ...dados };
    } catch (error) {
        console.error("Erro ao adicionar condomínio:", error);
        throw error;
    }
};

export const atualizarCondominio = async (id: string, dados: Partial<Condominio>): Promise<void> => {
    try {
        const db = getDb();
        // Caminho completo do documento para update
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...dados,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Erro ao atualizar condomínio:", error);
        throw error;
    }
};

export const listarCondominios = async (): Promise<Condominio[]> => {
    try {
        const colRef = getCollectionRef();
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Condominio));
    } catch (error) {
        console.error("Erro ao listar condomínios:", error);
        return [];
    }
};

export const buscarCondominioPorId = async (id: string): Promise<Condominio | null> => {
    try {
        const db = getDb();
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Condominio;
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar condomínio:", error);
        return null;
    }
};
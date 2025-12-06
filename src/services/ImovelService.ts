// src/services/ImovelService.ts

import { Imovel, NovoImovelData, ImovelCategoria } from '@/types/imovel';
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy';
// Mantemos o SDK apenas para as funções de ESCRITA (que rodam no cliente/dashboard)
import { db } from './FirebaseService';
import { 
    collection, 
    addDoc, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    onSnapshot 
} from 'firebase/firestore';

/**
 * @fileoverview Serviço CRUD Híbrido:
 * - LEITURA (Pública/Edge): Usa API REST (fetch) para garantir compatibilidade com Cloudflare/Edge.
 * - ESCRITA (Admin/Cliente): Usa SDK Firebase para facilidade e real-time.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// === HELPERS PARA CONVERTER REST API -> JAVASCRIPT OBJECT ===
// A API REST retorna tipos detalhados (stringValue, integerValue). Precisamos limpar isso.

const parseFirestoreValue = (value: any): any => {
    if (!value) return null;
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue);
    if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.arrayValue !== undefined) return (value.arrayValue.values || []).map(parseFirestoreValue);
    if (value.mapValue !== undefined) return parseFirestoreDoc(value.mapValue.fields || {});
    if (value.timestampValue !== undefined) return value.timestampValue;
    if (value.nullValue !== undefined) return null;
    return value;
};

const parseFirestoreDoc = (fields: any): any => {
    const obj: any = {};
    for (const key in fields) {
        obj[key] = parseFirestoreValue(fields[key]);
    }
    return obj;
};

// === FUNÇÕES DE LEITURA (EDGE COMPATIBLE - REST API) ===

/**
 * Busca um único imóvel pelo Smart ID usando FETCH (Sem SDK).
 * Funciona 100% no Edge/Cloudflare sem problemas de conexão.
 */
export async function fetchImovelPorSmartId(smartId: string): Promise<Imovel | undefined> {
    console.log(`[ImovelService] BUSCA REST: Procurando SmartID ${smartId}...`);

    // URL da API REST do Firestore para rodar uma Query
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

    const requestBody = {
        structuredQuery: {
            from: [{ collectionId: 'imoveis' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'smartId' },
                    op: 'EQUAL',
                    value: { stringValue: smartId }
                }
            },
            limit: 1
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            cache: 'no-store' // Garante dados frescos e evita cache de 404
        });

        if (!response.ok) {
            console.error(`[ImovelService] Erro REST: ${response.status} ${response.statusText}`);
            return undefined;
        }

        const data = await response.json();
        
        // A API retorna um array. Se estiver vazio ou sem 'document', não achou.
        if (!data || !data[0] || !data[0].document) {
            console.log(`[ImovelService] REST: Nenhum documento encontrado.`);
            return undefined;
        }

        const docData = data[0].document;
        const parsedData = parseFirestoreDoc(docData.fields);
        
        // O ID do documento vem no campo "name": projects/.../documents/imoveis/ID_REAL
        const docId = docData.name.split('/').pop();

        return {
            id: docId,
            ...parsedData,
        } as Imovel;

    } catch (e) {
        console.error('[ImovelService] EXCEÇÃO REST:', e);
        return undefined;
    }
}

/**
 * Busca anúncios públicos (Sitemap/Lista) usando REST.
 */
export async function fetchAnunciosPublicos(): Promise<Imovel[]> {
    console.log(`[ImovelService] BUSCA REST: Todos anúncios públicos...`);
    
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

    const requestBody = {
        structuredQuery: {
            from: [{ collectionId: 'imoveis' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'ANUNCIADO' }
                }
            },
            limit: 50 // Limite de segurança para performance inicial
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            next: { revalidate: 60 } // Cache por 60 segundos
        });

        const data = await response.json();
        
        if (!data || !Array.isArray(data)) return [];

        // Filtra resultados válidos (que têm 'document')
        return data
            .filter((item: any) => item.document)
            .map((item: any) => {
                const docId = item.document.name.split('/').pop();
                const fields = parseFirestoreDoc(item.document.fields);
                return { id: docId, ...fields } as Imovel;
            });

    } catch (e) {
        console.error('[ImovelService] Erro ao listar anúncios (REST):', e);
        return [];
    }
}

// === FUNÇÕES AUXILIARES E DE ESCRITA (MANTIDAS COM SDK) ===
// Estas funções geralmente rodam no cliente (Dashboard) onde o SDK funciona bem.

const cleanPayload = <T extends Record<string, any>>(obj: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
};

const getCategoryPrefix = (categoria: ImovelCategoria): string => {
  const mapping = IMÓVEIS_HIERARQUIA.find(c => c.categoria === categoria);
  return mapping ? mapping.prefixoID : 'OT'; 
};

// Gera Smart ID (Mantido)
const generateBaseSmartId = (data: NovoImovelData): string => {
  const date = new Date('2025-11-14T00:00:00'); 
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const prefix = getCategoryPrefix(data.categoriaPrincipal);
  const quartos = data.quartos.toString().padStart(2, '0');
  const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase(); 
  return `${prefix}${quartos}${month}${year}${uniqueSuffix}`;
};

// Funções de Escrita e Leitura do Proprietário (SDK)
export async function fetchImoveisDoProprietarioOnce(proprietarioId: string): Promise<Imovel[]> {
  const q = query(collection(db, 'imoveis'), where('proprietarioId', '==', proprietarioId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Imovel));
}

// Esta função também pode ser convertida para REST se for usada em página pública no futuro,
// mas por enquanto mantemos SDK pois costuma ser usada em dashboard ou client-side.
export async function fetchAnunciosPorProprietarioHandle(proprietarioId: string): Promise<Imovel[]> {
    const q = query(
        collection(db, 'imoveis'), 
        where('proprietarioId', '==', proprietarioId),
        where('status', '==', 'ANUNCIADO')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Imovel));
}

export function subscribeToImoveis(proprietarioId: string, callback: (imoveis: Imovel[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, 'imoveis'), where('proprietarioId', '==', proprietarioId));
  return onSnapshot(q, 
    (qs) => callback(qs.docs.map(d => ({ id: d.id, ...d.data() } as Imovel))),
    onError
  );
}

export async function fetchImovelPorId(id: string): Promise<Imovel | undefined> {
  const docRef = doc(db, 'imoveis', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Imovel;
  return undefined;
}

export async function adicionarNovoImovel(data: NovoImovelData, proprietarioId: string): Promise<Imovel> {
  const baseSmartId = generateBaseSmartId(data);
  const payload = { ...data, proprietarioId: proprietarioId, smartId: baseSmartId };
  const cleanData = cleanPayload(payload);
  const docRef = await addDoc(collection(db, 'imoveis'), cleanData);
  const finalSmartId = `${baseSmartId}-${docRef.id.slice(0, 4).toUpperCase()}`; 
  await updateDoc(docRef, { smartId: finalSmartId });
  return { id: docRef.id, ...payload, smartId: finalSmartId } as Imovel;
}

export async function atualizarImovel(id: string, data: NovoImovelData): Promise<Imovel> {
  const docRef = doc(db, 'imoveis', id);
  const updatePayload = cleanPayload(data as { [key: string]: any });
  await updateDoc(docRef, updatePayload);
  return { ...data, id, smartId: 'UPDATED', proprietarioId: '' } as Imovel; 
}

export async function updateImovelFotos(imovelId: string, newFotos: string[]): Promise<void> {
    const imovelRef = doc(db, "imoveis", imovelId);
    await updateDoc(imovelRef, { fotos: newFotos });
}

export async function removerImovel(id: string): Promise<void> {
  const docRef = doc(db, 'imoveis', id);
  await deleteDoc(docRef);
}

export async function listarImoveis(): Promise<Imovel[]> {
    const querySnapshot = await getDocs(collection(db, 'imoveis'));
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Imovel));
}
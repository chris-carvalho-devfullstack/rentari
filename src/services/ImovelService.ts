// src/services/ImovelService.ts

import { Imovel, NovoImovelData, ImovelCategoria } from '@/types/imovel';
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy';
import { db } from './FirebaseService';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    QueryDocumentSnapshot,
    onSnapshot, 
} from 'firebase/firestore';

/**
 * @fileoverview Serviço CRUD do Módulo de Imóveis, agora conectado ao Firebase Firestore.
 * CORRIGIDO: Usa o ID do proprietário dinâmico em vez do mock hardcoded.
 */

// Variáveis para simular o contador sequencial (mantidas por ser parte do mock de smartId)
let nextIdSequence = 4; 
// PROPRIETARIO_ID_MOCK removido.

/**
 * UTILITY: Remove todas as propriedades com valor 'undefined' de um objeto.
 * O Firestore não permite salvar campos com valor undefined.
 */
const cleanPayload = <T extends Record<string, any>>(obj: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
};

const getCategoryPrefix = (categoria: ImovelCategoria): string => {
  const mapping = IMÓVEIS_HIERARQUIA.find(c => c.categoria === categoria);
  return mapping ? mapping.prefixoID : 'OT'; 
};

/**
 * Converte um DocumentSnapshot do Firestore para o tipo Imovel.
 */
const mapDocToImovel = (docSnap: QueryDocumentSnapshot | { id: string, data: () => any }): Imovel => {
    const data = docSnap.data() as Omit<Imovel, 'id'>;
    return {
        id: docSnap.id, 
        ...data,
    } as Imovel;
};

/**
 * Gera um ID inteligente.
 */
const generateNewSmartId = (data: NovoImovelData): string => {
  const date = new Date('2025-11-14T00:00:00'); 
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const prefix = getCategoryPrefix(data.categoriaPrincipal);
  const quartos = data.quartos.toString().padStart(2, '0');
  const currentSequence = nextIdSequence;
  nextIdSequence++; 
  const ordem = currentSequence.toString().padStart(2, '0'); 
  return `${prefix}${quartos}${month}${year}${ordem}`;
};


/**
 * Busca de imóveis do proprietário no Firestore (Read - All - ONE-TIME fetch).
 * CORRIGIDO: Recebe o ID do proprietário como argumento.
 */
export async function fetchImoveisDoProprietarioOnce(proprietarioId: string): Promise<Imovel[]> {
  console.log(`[ImovelService] Fetching all Imoveis for user ${proprietarioId} from Firestore (One-Time)...`);
  
  const q = query(
      collection(db, 'imoveis'), 
      where('proprietarioId', '==', proprietarioId) // Usa o ID dinâmico
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(mapDocToImovel);
}

/**
 * CHAVE REAL-TIME: Se inscreve para atualizações em tempo real (Read - All).
 * CORRIGIDO: Recebe o ID do proprietário como argumento.
 */
export function subscribeToImoveis(proprietarioId: string, callback: (imoveis: Imovel[]) => void, onError: (error: Error) => void) {
  console.log(`[ImovelService] Subscribing to Imoveis for user ${proprietarioId} in Real-Time...`);
  
  const q = query(
    collection(db, 'imoveis'), 
    where('proprietarioId', '==', proprietarioId) // Usa o ID dinâmico
  );

  const unsubscribe = onSnapshot(
    q, 
    (querySnapshot) => {
      const imoveis = querySnapshot.docs.map(mapDocToImovel);
      callback(imoveis);
    },
    (error: any) => {
      console.error("Firestore error onSnapshot: ", error);
      onError(error);
    }
  );
  
  return unsubscribe;
}

/**
 * Busca de um único imóvel por ID (Read - Single).
 */
export async function fetchImovelPorId(id: string): Promise<Imovel | undefined> {
  console.log(`[ImovelService] Fetching Imovel ID: ${id} from Firestore...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const docRef = doc(db, 'imoveis', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return mapDocToImovel(docSnap);
  } else {
    return undefined;
  }
}


/**
 * Adiciona um novo imóvel (Create).
 * CORRIGIDO: Recebe o ID do proprietário como argumento.
 */
export async function adicionarNovoImovel(data: NovoImovelData, proprietarioId: string): Promise<Imovel> {
  console.log(`[ImovelService] Adicionando novo imóvel para proprietário ${proprietarioId} ao Firestore...`);
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const smartId = generateNewSmartId(data);
  const payload = {
    ...data,
    proprietarioId: proprietarioId, // Usa o ID dinâmico
    smartId: smartId, 
  };
  const cleanData = cleanPayload(payload);
  const docRef = await addDoc(collection(db, 'imoveis'), cleanData);

  return {
    id: docRef.id, 
    ...payload,
  } as Imovel;
}

/**
 * Atualiza um imóvel existente (Update).
 */
export async function atualizarImovel(id: string, data: NovoImovelData): Promise<Imovel> {
  console.log(`[ImovelService] Atualizando imóvel ID: ${id} no Firestore...`);
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const docRef = doc(db, 'imoveis', id);
  const existingImovel = await fetchImovelPorId(id);

  if (!existingImovel) {
     throw new Error(`Imóvel com ID ${id} não encontrado para atualização.`);
  }
  
  const updatePayload = cleanPayload(data as { [key: string]: any });
  await updateDoc(docRef, updatePayload);

  return {
    ...existingImovel,
    ...data,
    id: existingImovel.id, 
    smartId: existingImovel.smartId, 
    proprietarioId: existingImovel.proprietarioId, 
  } as Imovel;
}

/**
 * Remove um imóvel (Delete).
 */
export async function removerImovel(id: string): Promise<void> {
  console.log(`[ImovelService] Removendo imóvel ID: ${id} do Firestore...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const docRef = doc(db, 'imoveis', id);
  await deleteDoc(docRef);
}
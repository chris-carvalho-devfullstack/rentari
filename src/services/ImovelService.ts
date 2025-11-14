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
} from 'firebase/firestore';

/**
 * @fileoverview Serviço CRUD do Módulo de Imóveis, agora conectado ao Firebase Firestore.
 */

// Variáveis para simular o contador sequencial (seria idealmente armazenado no backend ou em um documento de metadados)
let nextIdSequence = 4; 
const PROPRIETARIO_ID_MOCK = 'prop-123'; // Simula o ID do usuário autenticado

const getCategoryPrefix = (categoria: ImovelCategoria): string => {
  const mapping = IMÓVEIS_HIERARQUIA.find(c => c.categoria === categoria);
  return mapping ? mapping.prefixoID : 'OT'; 
};

/**
 * Converte um DocumentSnapshot do Firestore para o tipo Imovel.
 * @param docSnap O snapshot do documento.
 * @returns O objeto Imovel.
 */
const mapDocToImovel = (docSnap: QueryDocumentSnapshot | { id: string, data: () => any }): Imovel => {
    const data = docSnap.data() as Omit<Imovel, 'id'>;
    return {
        id: docSnap.id, 
        ...data,
    } as Imovel;
};

/**
 * Gera um ID inteligente e descritivo: [Categoria(2)][Quartos(2)][Mês(2)][Ano(2)][Ordem(2)]
 * Usado apenas no momento da criação.
 * @param data Os dados do novo imóvel.
 * @returns O ID inteligente formatado.
 */
const generateNewSmartId = (data: NovoImovelData): string => {
  // Simula a data de cadastro para 14/11/2025 (Mock data para IDs sequenciais)
  const date = new Date('2025-11-14T00:00:00'); 
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  
  const prefix = getCategoryPrefix(data.categoriaPrincipal);
  const quartos = data.quartos.toString().padStart(2, '0');
  
  // Simula um contador sequencial global/transacional
  const currentSequence = nextIdSequence;
  nextIdSequence++; 
  const ordem = currentSequence.toString().padStart(2, '0'); 

  return `${prefix}${quartos}${month}${year}${ordem}`;
};


/**
 * Busca de imóveis do proprietário no Firestore (Read - All).
 * @returns Promise<Imovel[]> Lista de imóveis.
 */
export async function fetchImoveisDoProprietario(): Promise<Imovel[]> {
  console.log('[ImovelService] Fetching all Imoveis for user from Firestore...');
  
  await new Promise(resolve => setTimeout(resolve, 300)); 

  // Consulta ao Firestore, filtrando pelo proprietário mockado
  const q = query(
      collection(db, 'imoveis'), 
      where('proprietarioId', '==', PROPRIETARIO_ID_MOCK)
  );

  const querySnapshot = await getDocs(q);
  
  // Mapeia os documentos
  const imoveis = querySnapshot.docs.map(mapDocToImovel);

  return imoveis;
}

/**
 * Busca de um único imóvel por ID (Read - Single).
 * @param id O ID do documento do Firestore.
 * @returns Promise<Imovel | undefined> O imóvel encontrado ou undefined.
 */
export async function fetchImovelPorId(id: string): Promise<Imovel | undefined> {
  console.log(`[ImovelService] Fetching Imovel ID: ${id} from Firestore...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const docRef = doc(db, 'imoveis', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return mapDocToImovel(docSnap);
  } else {
    // Retornamos undefined para que a página de detalhes possa tratar o erro
    return undefined;
  }
}


/**
 * Adiciona um novo imóvel (Create).
 * @param data Os dados do novo imóvel (NovoImovelData).
 * @returns Promise<Imovel> O objeto Imovel criado (incluindo o ID e SmartID gerados).
 */
export async function adicionarNovoImovel(data: NovoImovelData): Promise<Imovel> {
  console.log('[ImovelService] Adicionando novo imóvel ao Firestore...');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 1. Gera o ID de Negócio (Smart ID)
  const smartId = generateNewSmartId(data);

  // 2. Cria o payload completo para o Firestore
  const payload = {
    ...data,
    proprietarioId: PROPRIETARIO_ID_MOCK,
    smartId: smartId, // Armazena o ID de Negócio
  };

  // 3. Adiciona ao Firestore
  const docRef = await addDoc(collection(db, 'imoveis'), payload);

  // 4. Retorna o objeto Imovel completo com o ID do Documento
  return {
    id: docRef.id, // ID do Documento Firestore
    ...payload,
  } as Imovel;
}

/**
 * Atualiza um imóvel existente (Update).
 * @param id O ID do documento do Firestore a ser atualizado.
 * @param data Os dados a serem atualizados (NovoImovelData).
 * @returns Promise<Imovel> O objeto Imovel atualizado.
 */
export async function atualizarImovel(id: string, data: NovoImovelData): Promise<Imovel> {
  console.log(`[ImovelService] Atualizando imóvel ID: ${id} no Firestore...`);
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const docRef = doc(db, 'imoveis', id);

  // 1. Busca os dados atuais para preservar campos como smartId e proprietarioId
  const existingImovel = await fetchImovelPorId(id);

  if (!existingImovel) {
     throw new Error(`Imóvel com ID ${id} não encontrado para atualização.`);
  }
  
  // 2. Cria o payload de atualização, omitindo o smartId e proprietarioId que são imutáveis
  const updatePayload = data as { [key: string]: any };

  // 3. Atualiza o Firestore
  await updateDoc(docRef, updatePayload);

  // 4. Retorna o objeto completo e atualizado
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
 * @param id O ID do documento do Firestore a ser removido.
 * @returns Promise<void>
 */
export async function removerImovel(id: string): Promise<void> {
  console.log(`[ImovelService] Removendo imóvel ID: ${id} do Firestore...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const docRef = doc(db, 'imoveis', id);
  await deleteDoc(docRef);
}
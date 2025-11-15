// src/services/StorageService.ts

import { storage } from './FirebaseService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Define o nome do bucket que está ativo e com CORS configurado.
 * Puxa de forma segura a variável de ambiente ou usa o nome fixo.
 */
const ACTIVE_BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'rentari-1dc75.firebasestorage.app';
const BUCKET_BASE_PATH = `gs://${ACTIVE_BUCKET_NAME}`;

/**
 * @fileoverview Serviço para gerenciar operações de arquivo no Firebase Storage.
 */

/**
 * Faz o upload de um arquivo para o Storage e retorna a URL pública.
 * @param file O arquivo a ser enviado.
 * @param userId O ID do usuário para organizar o caminho do arquivo.
 * @returns Promise<string> A URL de download pública do arquivo.
 */
export async function uploadFotoPerfil(file: File, userId: string): Promise<string> {
    if (!userId) {
        throw new Error("ID do usuário é necessário para upload.");
    }
    
    // Define o caminho ABSOLUTO no Storage, forçando o uso do bucket correto:
    // 'gs://rentari-1dc75.firebasestorage.app/usuarios/UID/profile.jpg'
    const storagePath = `${BUCKET_BASE_PATH}/usuarios/${userId}/profile.jpg`;
    
    // CORREÇÃO CRÍTICA: Cria a referência usando o caminho completo (gs://...)
    // Isso força o SDK a construir o URL de upload corretamente, evitando o .appspot.com.
    const storageRef = ref(storage, storagePath);

    console.log(`[StorageService] Iniciando upload para: ${storageRef.fullPath}`);
    
    // Faz o upload do arquivo
    const snapshot = await uploadBytes(storageRef, file);

    // Obtém a URL pública do arquivo
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(`[StorageService] Upload concluído. URL: ${downloadURL}`);

    return downloadURL;
}
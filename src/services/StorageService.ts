// src/services/StorageService.ts

import { storage } from './FirebaseService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    
    // Define o caminho no Storage: 'usuarios/UID/profile.jpg'
    const storageRef = ref(storage, `usuarios/${userId}/profile.jpg`);

    console.log(`[StorageService] Iniciando upload para: ${storageRef.fullPath}`);
    
    // Faz o upload do arquivo
    const snapshot = await uploadBytes(storageRef, file);

    // Obtém a URL pública do arquivo
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(`[StorageService] Upload concluído. URL: ${downloadURL}`);

    return downloadURL;
}
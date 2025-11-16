// src/services/StorageService.ts

import { storage } from './FirebaseService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Define o nome do bucket que está ativo e com CORS configurado.
 */
const ACTIVE_BUCKET_NAME = 'rentari-1dc75.firebasestorage.app'; 
const BUCKET_BASE_PATH = `gs://${ACTIVE_BUCKET_NAME}`;

/**
 * @fileoverview Serviço para gerenciar operações de arquivo no Firebase Storage.
 */

/**
 * Faz o upload de um arquivo para o Storage e retorna a URL pública.
 * (Mantida a função de perfil)
 */
export async function uploadFotoPerfil(file: File, userId: string): Promise<string> {
    if (!userId) {
        throw new Error("ID do usuário é necessário para upload.");
    }
    
    const storagePath = `${BUCKET_BASE_PATH}/usuarios/${userId}/profile.jpg`;
    const storageRef = ref(storage, storagePath);

    console.log(`[StorageService] Iniciando upload para: ${storageRef.fullPath}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(`[StorageService] Upload concluído. URL: ${downloadURL}`);

    return downloadURL;
}

/**
 * NOVO: Faz o upload de múltiplas fotos de um imóvel para o Storage.
 * @param files Array de arquivos (Fotos) a serem enviadas.
 * @param imovelId O ID do documento do imóvel (Firestore ID) para organizar o caminho.
 * @returns Promise<string[]> Array de URLs de download públicas.
 */
export async function uploadImovelPhotos(files: File[], imovelId: string): Promise<string[]> {
    if (!imovelId) {
        throw new Error("ID do Imóvel é necessário para upload das fotos.");
    }

    const uploadPromises = files.map(async (file, index) => {
        // Define o caminho absoluto no Storage: Ex: 'gs://bucket/imoveis/IM-ID/foto_0_timestamp.jpg'
        const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const timestamp = Date.now();
        const storagePath = `${BUCKET_BASE_PATH}/imoveis/${imovelId}/foto_${index}_${timestamp}_${safeFileName}`;
        
        const storageRef = ref(storage, storagePath);
        
        console.log(`[StorageService] Iniciando upload da foto ${index + 1} para: ${storageRef.fullPath}`);
        
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    });

    const urls = await Promise.all(uploadPromises);
    console.log(`[StorageService] Upload de ${urls.length} fotos do imóvel concluído.`);
    return urls;
}
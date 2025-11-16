// src/hooks/useAnunciosPublicos.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Imovel } from '@/types/imovel';
import { fetchAnunciosPublicos, fetchAnunciosPorProprietarioHandle } from '@/services/ImovelService'; 
import { fetchUserByHandle } from '@/services/UserService';

interface UseAnunciosPublicosResult {
  anuncios: Imovel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  proprietarioNome?: string;
  proprietarioHandle?: string;
}

/**
 * Custom Hook para buscar a lista de imóveis ANUNCIADOS publicamente.
 * @param handle Opcional. Se fornecido, busca anúncios apenas para esse proprietário.
 */
export const useAnunciosPublicos = (handle?: string): UseAnunciosPublicosResult => {
  const [anuncios, setAnuncios] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proprietarioInfo, setProprietarioInfo] = useState<{ nome?: string, handle?: string }>({});
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnuncios([]);
    
    try {
        let imoveis: Imovel[] = [];
        let ownerId: string | null = null;
        let ownerName: string | undefined = undefined;
        
        if (handle) {
            // 1. Busca Proprietário pelo Handle (Para a página dedicada)
            const proprietario = await fetchUserByHandle(handle);
            if (!proprietario) {
                throw new Error(`Nenhum proprietário encontrado com o código ${handle}.`);
            }
            ownerId = proprietario.id;
            ownerName = proprietario.nome;
            setProprietarioInfo({ nome: ownerName, handle: proprietario.handlePublico });
            
            // 2. Busca anúncios desse proprietário
            imoveis = await fetchAnunciosPorProprietarioHandle(ownerId);
            
        } else {
            // 1. Busca todos os anúncios (Para a página principal)
            imoveis = await fetchAnunciosPublicos();
        }
        
        setAnuncios(imoveis);
    } catch (e: any) {
        console.error('Erro ao buscar anúncios públicos:', e);
        const errorMessage = e.message || 'Não foi possível carregar a lista de anúncios. Tente novamente mais tarde.';
        setError(errorMessage);
        setAnuncios([]);
    } finally {
        setLoading(false);
    }
  }, [handle]); 

  useEffect(() => {
    loadData();
  }, [loadData]); 

  const refetch = () => {
    loadData();
  };

  return { anuncios, loading, error, refetch, proprietarioNome: proprietarioInfo.nome, proprietarioHandle: proprietarioInfo.handle };
};
// src/hooks/useImoveis.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Imovel } from '@/types/imovel';
import { subscribeToImoveis } from '@/services/ImovelService'; 

interface UseImoveisResult {
  imoveis: Imovel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @fileoverview Custom Hook para buscar e gerenciar o estado da lista de imóveis.
 * AGORA IMPLEMENTA REAL-TIME com onSnapshot.
 */
export const useImoveis = (): UseImoveisResult => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Função para configurar a subscrição (usada no useEffect)
  const startSubscription = useCallback(() => {
    setError(null);
    
    // Inicia a escuta em tempo real no Firestore
    const unsubscribe = subscribeToImoveis(
        (data) => {
            setImoveis(data);
            setLoading(false);
            setError(null); 
        },
        (e) => {
            console.error('Erro na subscription de imóveis:', e);
            const errorMessage = e.message || 'Não foi possível carregar a lista de imóveis em tempo real. Verifique sua conexão ou tente novamente.';
            setError(errorMessage);
            setImoveis([]);
            setLoading(false);
        }
    );
    
    // A função de limpeza do useEffect (retorno)
    return unsubscribe;
  }, []); 

  useEffect(() => {
    // Inicia a escuta
    const unsubscribe = startSubscription();
    
    // Cleanup: Para a escuta do Firestore quando o componente for desmontado
    return () => {
        console.log('[useImoveis] Unsubscribing from Firestore.');
        unsubscribe();
    };
  }, [startSubscription]); 

  // A função refetch agora é um no-op
  const refetch = () => {
    console.log('[useImoveis] Refetch chamado. Atualização em tempo real é contínua.');
  };

  return { imoveis, loading, error, refetch };
};
// src/hooks/useImoveis.ts
'use client';

import { useState, useEffect } from 'react';
import { Imovel } from '@/types/imovel';
import { subscribeToImoveis } from '@/services/ImovelService'; 
import { useAuthStore } from './useAuthStore'; // Importa o hook de autenticação

interface UseImoveisResult {
  imoveis: Imovel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @fileoverview Custom Hook para buscar e gerenciar o estado da lista de imóveis.
 * CORRIGIDO: Removido useCallback para evitar stale closures e loop infinito.
 */
export const useImoveis = (): UseImoveisResult => {
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?.id; // Obtém o ID do usuário de forma segura
  
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Verifica se o usuário está autenticado e se o ID está disponível.
    if (!isAuthenticated || !userId) {
      setLoading(false);
      setImoveis([]);
      // Não definimos um erro, apenas não buscamos dados
      // setError('Usuário não autenticado. Imóveis não podem ser carregados.');
      return; // Interrompe o efeito aqui
    }

    setLoading(true);
    setError(null);

    // 2. A lógica de inscrição (anteriormente em 'startSubscription')
    // é movida DIRETAMENTE para dentro do useEffect.
    // Isso garante que setImoveis, setLoading e setError NUNCA estejam "stale" (velhos).
    const unsubscribe = subscribeToImoveis(
        userId,
        (data) => {
            setImoveis(data);
            setLoading(false);
            setError(null); 
        },
        (e) => {
            console.error('Erro na subscription de imóveis:', e);
            const errorMessage = e.message || 'Não foi possível carregar a lista de imóveis em tempo real.';
            setError(errorMessage);
            setImoveis([]);
            setLoading(false);
        }
    );
    
    // 3. A função de limpeza retornada pelo useEffect
    return () => {
      console.log('[useImoveis] Unsubscribing from Firestore.');
      unsubscribe();
    };

  // 4. O array de dependências agora contém APENAS os valores
  // estáveis que devem acionar a re-inscrição: o status de 
  // autenticação e o ID do usuário.
  }, [isAuthenticated, userId]); 

  // A função refetch (se você não usa, pode remover)
  const refetch = () => {
    console.log('[useImoveis] Refetch chamado. A atualização já é em tempo real.');
  };

  return { imoveis, loading, error, refetch };
};
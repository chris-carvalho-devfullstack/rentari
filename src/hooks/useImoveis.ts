// src/hooks/useImoveis.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Imovel } from '@/types/imovel';
import { subscribeToImoveis } from '@/services/ImovelService'; 
import { useAuthStore } from './useAuthStore'; // <-- NOVO: Importa o hook de autenticação

interface UseImoveisResult {
  imoveis: Imovel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @fileoverview Custom Hook para buscar e gerenciar o estado da lista de imóveis.
 * CORRIGIDO: Agora filtra pelo ID do usuário autenticado.
 */
export const useImoveis = (): UseImoveisResult => {
  const { user, isAuthenticated } = useAuthStore(); // <-- NOVO: Obtém o usuário
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Função para configurar a subscrição (usada no useEffect)
  const startSubscription = useCallback((proprietarioId: string) => {
    setError(null);
    
    if (!proprietarioId) {
        setLoading(false);
        setError('Proprietário não autenticado.');
        return () => {}; // Retorna função vazia de limpeza
    }
    
    // Inicia a escuta em tempo real no Firestore, passando o ID do proprietário
    const unsubscribe = subscribeToImoveis(
        proprietarioId, // <-- NOVO: Passa o ID
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
    if (!isAuthenticated || !user?.id) {
        setLoading(false);
        setImoveis([]);
        setError('Usuário não autenticado. Imóveis não podem ser carregados.');
        return;
    }
    
    // Inicia a escuta, passando o ID do usuário
    const unsubscribe = startSubscription(user.id);
    
    // Cleanup: Para a escuta do Firestore quando o componente for desmontado
    return () => {
        console.log('[useImoveis] Unsubscribing from Firestore.');
        unsubscribe();
    };
  }, [isAuthenticated, user?.id, startSubscription]); // Dependências do usuário e autenticação

  // A função refetch agora é um no-op
  const refetch = () => {
    console.log('[useImoveis] Refetch chamado. Atualização em tempo real é contínua.');
  };

  return { imoveis, loading, error, refetch };
};
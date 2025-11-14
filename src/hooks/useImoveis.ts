// src/hooks/useImoveis.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Imovel } from '@/types/imovel';
import { fetchImoveisDoProprietario } from '@/services/ImovelService';

interface UseImoveisResult {
  imoveis: Imovel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @fileoverview Custom Hook para buscar e gerenciar o estado da lista de imóveis.
 * Este hook encapsula a lógica de chamada de API, carregamento e erros para o componente ListaImoveis.
 */
export const useImoveis = (): UseImoveisResult => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImoveisDoProprietario();
      setImoveis(data);
    } catch (e: any) {
      console.error('Erro ao buscar imóveis:', e);
      // Usamos e.message se for um objeto Error, senão uma mensagem genérica
      const errorMessage = e.message || 'Não foi possível carregar a lista de imóveis. Verifique sua conexão ou tente novamente.';
      setError(errorMessage);
      setImoveis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]); // O useCallback garante que loadData não mude desnecessariamente

  // Função para recarregar os dados (útil após adicionar/editar um imóvel)
  const refetch = () => loadData();

  return { imoveis, loading, error, refetch };
};

// Crie e cole o código em: src/hooks/useImoveis.ts
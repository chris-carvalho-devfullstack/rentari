// src/hooks/useFinanceiro.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinanceiroData } from '@/types/financeiro'; 
import { fetchFinanceiroData } from '@/services/FinanceiroService'; 

interface UseFinanceiroResult {
  data: FinanceiroData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @fileoverview Custom Hook para buscar e gerenciar o estado dos dados do Módulo Financeiro.
 */
export const useFinanceiro = (): UseFinanceiroResult => {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const financeiroData = await fetchFinanceiroData();
      setData(financeiroData);
    } catch (e: any) {
      console.error('Erro ao buscar dados financeiros:', e);
      const errorMessage = e.message || 'Não foi possível carregar os dados financeiros. Tente novamente.';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]); 

  // Função para recarregar os dados
  const refetch = () => loadData();

  return { data, loading, error, refetch };
};

// Crie e cole o código em: src/hooks/useFinanceiro.ts
// src/hooks/useFinanceiro.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinanceiroData } from '@/types/financeiro'; 
import { fetchFinanceiroData } from '@/services/FinanceiroService'; 
import { useAuthStore } from './useAuthStore'; // <-- NOVO: Importa o hook de autenticação

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
  const { user, isAuthenticated } = useAuthStore(); // <-- NOVO: Obtém o usuário
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Recebe o ID do proprietário como dependência
  const loadData = useCallback(async (proprietarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Passa o ID do proprietário para o serviço
      const financeiroData = await fetchFinanceiroData(proprietarioId); 
      setData(financeiroData);
    } catch (e: any) {
      console.error('Erro ao buscar dados financeiros:', e);
      const errorMessage = e.message || 'Não foi possível carregar os dados financeiros. Tente novamente.';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []); // Dependência vazia, pois o ID será passado via useEffect

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
        setLoading(false);
        setData(null);
        setError('Usuário não autenticado. Dados financeiros não podem ser carregados.');
        return;
    }
    
    loadData(user.id);
  }, [loadData, isAuthenticated, user?.id]); // Depende do loadData, autenticação e ID

  // Função para recarregar os dados
  const refetch = () => {
    if (user?.id) {
        loadData(user.id);
    } else {
        // Se não houver ID, apenas loga e não faz nada.
        console.log('[useFinanceiro] Impossível recarregar: usuário não autenticado.');
    }
  }

  return { data, loading, error, refetch };
};
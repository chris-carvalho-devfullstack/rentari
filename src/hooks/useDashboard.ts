// src/hooks/useDashboard.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardMetrics } from '@/types/dashboard'; 
import { fetchDashboardMetrics } from '@/services/DashboardService'; 

interface UseDashboardResult {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @fileoverview Custom Hook para buscar e gerenciar o estado das métricas do Dashboard.
 * Encapsula a lógica de chamada de API, carregamento e erros.
 */
export const useDashboard = (): UseDashboardResult => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (e: any) {
      console.error('Erro ao buscar métricas do Dashboard:', e);
      const errorMessage = e.message || 'Não foi possível carregar as métricas do Dashboard. Tente novamente.';
      setError(errorMessage);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]); 

  // Função para recarregar os dados
  const refetch = () => loadData();

  return { metrics, loading, error, refetch };
};

// Crie e cole o código em: src/hooks/useDashboard.ts
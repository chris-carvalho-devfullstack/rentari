// src/hooks/useDashboard.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardMetrics } from '@/types/dashboard'; 
import { calculateDashboardMetrics } from '@/services/DashboardService'; 
import { useImoveis } from './useImoveis'; 

interface UseDashboardResult {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @fileoverview Custom Hook para buscar e gerenciar o estado das métricas do Dashboard.
 * AGORA REACTIVE: Usa o estado de useImoveis para recálculo em tempo real.
 */
export const useDashboard = (): UseDashboardResult => {
  // 1. Usa o hook reativo para obter a lista de imóveis
  const { imoveis, loading: loadingImoveis, error: errorImoveis, refetch: refetchImoveis } = useImoveis();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  // O estado de carregamento e erro é herdado do useImoveis
  const loading = loadingImoveis; 
  const error = errorImoveis;

  // 2. Usa useMemo para recalcular as métricas somente quando a lista de imóveis mudar
  const calculatedMetrics = useMemo(() => {
    // Se a lista está carregando ou houve um erro, retornamos null, o que força a página a mostrar o loading.
    if (loadingImoveis || errorImoveis) return null;
    
    console.log('[useDashboard] Recalculating metrics based on new imoveis data...');
    return calculateDashboardMetrics(imoveis);
  }, [imoveis, loadingImoveis, errorImoveis]);

  // 3. Efeito para atualizar o estado do dashboard
  useEffect(() => {
    if (calculatedMetrics) {
        setMetrics(calculatedMetrics);
    }
  }, [calculatedMetrics]);

  // 4. A função refetch chama o refetch do useImoveis (mantendo o contrato da interface)
  const refetch = () => {
    refetchImoveis(); 
  };

  return { metrics, loading, error, refetch };
};
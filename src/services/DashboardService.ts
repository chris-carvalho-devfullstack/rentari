// src/services/DashboardService.ts
import { DashboardMetrics } from '@/types/dashboard'; 

/**
 * @fileoverview Serviço mockado para simular a busca de métricas e KPIs para o Dashboard.
 */

const mockMetrics: DashboardMetrics = {
  imoveisAtivos: 12,
  receitaMes: 15400.00,
  pendencias: 2,
  taxaOcupacao: 85, // 85% de ocupação
  projecaoAnual: 190000.00,
  fluxoCaixaMensal: [
    { mes: 'Jan', receita: 14500, despesa: 1200 },
    { mes: 'Fev', receita: 15100, despesa: 1500 },
    { mes: 'Mar', receita: 15400, despesa: 1100 },
    { mes: 'Abr', receita: 16000, despesa: 1350 },
    { mes: 'Mai', receita: 15900, despesa: 1600 },
    { mes: 'Jun', receita: 17200, despesa: 1200 },
  ],
};

/**
 * Simula a busca de todas as métricas do Dashboard.
 * @returns Promise<DashboardMetrics> Objeto com as métricas e dados de gráfico.
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  console.log('[DashboardService] Simulação: Buscando métricas do Dashboard...');
  
  // Simula um atraso de rede (1 segundo)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Para simular um erro, descomente a linha abaixo:
  // throw new Error('Falha ao obter dados financeiros e operacionais.');

  return mockMetrics;
}

// Crie e cole o código em: src/services/DashboardService.ts
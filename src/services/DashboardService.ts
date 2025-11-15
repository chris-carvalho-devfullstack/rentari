// src/services/DashboardService.ts
import { DashboardMetrics } from '@/types/dashboard'; 
import { Imovel } from '@/types/imovel'; 

/**
 * @fileoverview Serviço para isolar APENAS a lógica de cálculo de métricas (função pura).
 * A busca dos dados (em tempo real) é responsabilidade do hook useDashboard.
 */

// Dados mockados - Mantidos apenas para o histórico/gráfico
const mockFinancialData = {
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
 * CHAVE: Calcula as métricas do dashboard a partir da lista de imóveis. (Função Pura)
 * @param imoveis A lista de imóveis.
 * @returns DashboardMetrics Objeto com as métricas e dados de gráfico.
 */
export function calculateDashboardMetrics(imoveis: Imovel[]): DashboardMetrics {
  const imoveisAlugados = imoveis.filter(i => i.status === 'ALUGADO');
  const imoveisAtivos = imoveis.length;
  const imoveisEmManutencao = imoveis.filter(i => i.status === 'MANUTENCAO');
  const alugueisAnunciados = imoveis.filter(i => i.status === 'ANUNCIADO');

  // 1. Receita Mês: Soma do valor do aluguel para imóveis ALUGADOS (simplificação)
  const receitaMes = imoveisAlugados.reduce((sum, imovel) => sum + imovel.valorAluguel, 0);

  // 2. Taxa de Ocupação: (Alugados / Ativos) * 100
  const taxaOcupacao = imoveisAtivos > 0 
    ? Math.round((imoveisAlugados.length / imoveisAtivos) * 100) 
    : 0;

  // 3. Projeção Anual: Receita Mensal * 12
  const projecaoAnual = receitaMes * 12;

  // 4. Pendências: Contagem de imóveis em MANUTENCAO/ANUNCIADO + 1 (alerta financeiro simulado)
  const pendencias = imoveisEmManutencao.length + alugueisAnunciados.length + 1; 

  // Retorna o objeto final
  return {
    imoveisAtivos,
    receitaMes,
    pendencias,
    taxaOcupacao,
    projecaoAnual,
    fluxoCaixaMensal: mockFinancialData.fluxoCaixaMensal,
  };
}
// src/services/DashboardService.ts
import { DashboardMetrics } from '@/types/dashboard'; 
import { Imovel } from '@/types/imovel'; // Import Imovel
import { fetchImoveisDoProprietario } from './ImovelService'; // Import ImovelService

/**
 * @fileoverview Serviço mockado para simular a busca de métricas e KPIs para o Dashboard.
 * ATUALIZADO: Agora calcula métricas a partir da lista real de Imóveis (via mock do ImovelService).
 */

// Dados mockados originais - Mantenho apenas a parte que não depende do Imovel (como fluxo de caixa)
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
 * Calcula as métricas do dashboard a partir da lista de imóveis.
 */
function calculateMetrics(imoveis: Imovel[]): Omit<DashboardMetrics, 'fluxoCaixaMensal'> {
  const imoveisAlugados = imoveis.filter(i => i.status === 'ALUGADO');
  const imoveisAtivos = imoveis.length;
  const imoveisEmManutencao = imoveis.filter(i => i.status === 'MANUTENCAO');

  // 1. Receita Mês: Soma do valor do aluguel para imóveis ALUGADOS (simplificação)
  const receitaMes = imoveisAlugados.reduce((sum, imovel) => sum + imovel.valorAluguel, 0);

  // 2. Taxa de Ocupação: (Alugados / Ativos) * 100
  const taxaOcupacao = imoveisAtivos > 0 
    ? Math.round((imoveisAlugados.length / imoveisAtivos) * 100) 
    : 0;

  // 3. Projeção Anual: Receita Mensal * 12
  const projecaoAnual = receitaMes * 12;

  // 4. Pendências: Contagem de imóveis em MANUTENCAO + 1 (simulação de alerta financeiro fixo)
  const pendencias = imoveisEmManutencao.length + 1; // 1 é a pendência financeira simulada

  return {
    imoveisAtivos,
    receitaMes,
    pendencias,
    taxaOcupacao,
    projecaoAnual,
  };
}


/**
 * Simula a busca de todas as métricas do Dashboard.
 * @returns Promise<DashboardMetrics> Objeto com as métricas e dados de gráfico.
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  console.log('[DashboardService] Simulação: Buscando métricas do Dashboard (usando dados reais de Imóveis)...');
  
  // 1. Busca os dados reais de imóveis
  const imoveis = await fetchImoveisDoProprietario();

  // 2. Calcula as métricas a partir dos dados reais
  const calculatedMetrics = calculateMetrics(imoveis);

  // Simula um atraso de rede (1 segundo)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    ...calculatedMetrics,
    fluxoCaixaMensal: mockFinancialData.fluxoCaixaMensal, // Mantém o mock para o gráfico
  };
}
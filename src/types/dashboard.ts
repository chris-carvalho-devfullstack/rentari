// src/types/dashboard.ts

/**
 * @fileoverview Define a estrutura de dados (Métricas/KPIs) para o Dashboard.
 * Expandido para refletir o que há de mais moderno em plataformas de gestão imobiliária.
 */
export interface DashboardMetrics {
  /** Número total de imóveis cadastrados ativos */
  imoveisAtivos: number;
  /** Valor total de receita recebida no mês atual (em BRL) */
  receitaMes: number;
  /** Número de pendências ou alertas (ex: aluguel atrasado, contrato a vencer) */
  pendencias: number;
  /** Porcentagem de imóveis alugados (Taxa de Ocupação) */
  taxaOcupacao: number; 
  /** Projeção de receita total para os próximos 12 meses */
  projecaoAnual: number;
  /** Dados para o gráfico de fluxo de caixa (Últimos 6 meses) */
  fluxoCaixaMensal: { 
    mes: string; 
    receita: number; 
    despesa: number; 
  }[];
}
// Crie e cole o código em: src/types/dashboard.ts
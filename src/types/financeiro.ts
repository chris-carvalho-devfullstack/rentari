// src/types/financeiro.ts

/**
 * @fileoverview Define a estrutura de dados para o Módulo Financeiro.
 * Inclui detalhamento de extratos, contas a pagar/receber e KPIs.
 */

// Estrutura para uma transação (parte do Extrato)
export interface Transacao {
  id: string;
  data: string; // Formato YYYY-MM-DD
  descricao: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO';
  imovelId: string; // Para rastreabilidade
}

// Estrutura principal dos dados financeiros
export interface FinanceiroData {
  /** KPIs (Key Performance Indicators) */
  receitaLiquidaMes: number;
  contasAReceberTotal: number;
  contasAPagarTotal: number;
  
  /** Detalhe de Fluxo de Caixa (Últimos 12 meses) para gráfico de tendência */
  historicoMensal: {
    mesAno: string; // Ex: Jun/2025
    saldo: number;
    receita: number;
    despesa: number;
  }[];

  /** Extrato de Transações (lista detalhada) */
  extratoRecente: Transacao[];
}

// Crie e cole o código em: src/types/financeiro.ts
// src/services/FinanceiroService.ts
import { FinanceiroData, Transacao } from '@/types/financeiro'; 
// CORREÇÃO: A função de busca foi renomeada para fetchImoveisDoProprietarioOnce
import { fetchImoveisDoProprietarioOnce } from './ImovelService'; 

/**
 * @fileoverview Serviço mockado para simular chamadas à API do Módulo Financeiro.
 * Agora utiliza a lista de imóveis real para calcular algumas métricas.
 */

const mockExtrato: Transacao[] = [
  { id: 't-001', data: '2025-11-10', descricao: 'Aluguel Recebido - Apt 001', valor: 4800.00, tipo: 'RECEITA', status: 'PAGO', imovelId: 'imovel-001' },
  { id: 't-002', data: '2025-11-12', descricao: 'Comissão Imobiliária', valor: -480.00, tipo: 'DESPESA', status: 'PAGO', imovelId: 'imovel-001' },
  { id: 't-003', data: '2025-11-15', descricao: 'IPTU Dezembro - Casa Térrea', valor: -150.00, tipo: 'DESPESA', status: 'PENDENTE', imovelId: 'imovel-002' },
  { id: 't-004', data: '2025-11-01', descricao: 'Aluguel Outubro Atrasado - Apt 004', valor: 2900.00, tipo: 'RECEITA', status: 'ATRASADO', imovelId: 'imovel-004' },
  { id: 't-005', data: '2025-10-30', descricao: 'Transferência para Conta Pessoal', valor: -10000.00, tipo: 'TRANSFERENCIA', status: '' as any, imovelId: '' },
];

/**
 * Simula a busca de todos os dados do Módulo Financeiro.
 * @param proprietarioId O ID do usuário autenticado.
 * @returns Promise<FinanceiroData> Objeto com os dados financeiros detalhados.
 */
export async function fetchFinanceiroData(proprietarioId: string): Promise<FinanceiroData> {
  console.log('[FinanceiroService] Simulação: Buscando dados financeiros detalhados (usando dados de Imóveis do Firestore para contexto)...');
  
  // Busca os imóveis reais do Firestore (usado para contexto/base de cálculo futuro)
  // CORREÇÃO: Passa o ID do proprietário para o fetch
  const imoveis = await fetchImoveisDoProprietarioOnce(proprietarioId); 
  console.log(`[FinanceiroService] Contexto: ${imoveis.length} imóveis sob gestão.`);

  // Simula um atraso de rede (1.2 segundos para dados mais complexos)
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const mockFinanceiroData: FinanceiroData = {
    // KPIs
    receitaLiquidaMes: 15400 - 1500, 
    contasAReceberTotal: 3500.00, 
    contasAPagarTotal: 480.00 + 150.00, 
    
    // Histórico para Gráfico (12 meses)
    historicoMensal: [
      { mesAno: 'Nov/24', saldo: 14000, receita: 15000, despesa: 1000 },
      { mesAno: 'Dez/24', saldo: 13500, receita: 15500, despesa: 2000 },
      { mesAno: 'Jan/25', saldo: 15000, receita: 17000, despesa: 2000 },
      { mesAno: 'Fev/25', saldo: 16500, receita: 18000, despesa: 1500 },
      { mesAno: 'Mar/25', saldo: 15800, receita: 17500, despesa: 1700 },
      { mesAno: 'Abr/25', saldo: 17000, receita: 19000, despesa: 2000 },
      { mesAno: 'Mai/25', saldo: 16900, receita: 18500, despesa: 1600 },
      { mesAno: 'Jun/25', saldo: 17200, receita: 19400, despesa: 2200 },
      { mesAno: 'Jul/25', saldo: 18000, receita: 20000, despesa: 2000 },
      { mesAno: 'Ago/25', saldo: 17500, receita: 19500, despesa: 2000 },
      { mesAno: 'Set/25', saldo: 18200, receita: 20500, despesa: 2300 },
      { mesAno: 'Out/25', saldo: 18500, receita: 20000, despesa: 1500 },
    ],
    
    extratoRecente: mockExtrato,
  };
  
  return mockFinanceiroData;
}
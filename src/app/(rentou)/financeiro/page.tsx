// src/app/(rentou)/financeiro/page.tsx
'use client'; // CORREÇÃO: Necessário para usar hooks e interatividade

import { Metadata } from 'next';
import { useFinanceiro } from '@/hooks/useFinanceiro'; 
import { FinanceiroData, Transacao } from '@/types/financeiro'; 
import { useState } from 'react';

// A Metadata precisa ser exportada em um arquivo 'layout.tsx' se for usar 'use client' no 'page.tsx'
// export const metadata: Metadata = { title: 'Financeiro - Rentou' };


// Componente utilitário para formatação de moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// Componente moderno para exibir uma Métrica (KPI Card)
interface MetricCardProps {
  title: string;
  value: string;
  colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, colorClass }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow border-l-4 border-gray-200 dark:border-zinc-700 hover:shadow-lg transition-shadow">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h2>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
            {value}
        </p>
    </div>
);

// Componente para o Extrato de Transações (Listagem detalhada)
const ExtratoTable: React.FC<{ transactions: Transacao[] }> = ({ transactions }) => {
    // Filtro interativo, seguindo o padrão moderno de dashboards
    const [filtro, setFiltro] = useState<'TODOS' | Transacao['tipo']>('TODOS');
    
    const filteredTransactions = transactions.filter(t => filtro === 'TODOS' || t.tipo === filtro);

    const getStatusClasses = (status: Transacao['status']) => {
        switch (status) {
            case 'PAGO': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
            case 'PENDENTE': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
            case 'ATRASADO': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl col-span-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Extrato de Transações Recentes</h2>
            
            <div className="flex space-x-3 mb-4">
                <button 
                    onClick={() => setFiltro('TODOS')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${filtro === 'TODOS' ? 'bg-rentou-primary text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                >Todos</button>
                <button 
                    onClick={() => setFiltro('RECEITA')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${filtro === 'RECEITA' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                >Receitas</button>
                <button 
                    onClick={() => setFiltro('DESPESA')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${filtro === 'DESPESA' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                >Despesas</button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                    <thead className="bg-gray-50 dark:bg-zinc-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.data}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{t.descricao}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${t.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(Math.abs(t.valor))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma transação encontrada para o filtro selecionado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Componente Placeholder para Gráfico de Fluxo de Caixa (Inovador)
const FluxoCaixaChartPlaceholder: React.FC<{ data: FinanceiroData['historicoMensal'] }> = ({ data }) => {
    const saldoFinal = data[data.length - 1]?.saldo || 0;

    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl col-span-full xl:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Análise de Fluxo de Caixa (12 Meses)</h2>
            <div className="flex flex-col items-center justify-center h-96 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
                <p className="mb-4 text-center text-gray-500 dark:text-gray-400">Placeholder para Gráfico de Área (Receita, Despesa e Saldo)</p>
                <div className="text-center">
                    <p className="text-lg text-gray-700 dark:text-gray-300">Saldo Histórico Final:</p>
                    <p className={`text-4xl font-bold ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'} dark:text-green-400`}>
                        {formatCurrency(saldoFinal)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Pronto para visualização em linha/barra (Recharts/Nivo).</p>
                </div>
            </div>
        </div>
    );
};


/**
 * @fileoverview Página principal do Módulo Financeiro.
 * Usa 'use client' para integrar dados dinâmicos e interatividade.
 */
export default function FinanceiroPage() {
    const { data, loading, error, refetch } = useFinanceiro();
    
    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Resumo Financeiro</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Central de gestão completa de contas a pagar, receber e análise de performance.
                </p>
                <div className="flex justify-center items-center h-48 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow mt-8">
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Carregando extratos e métricas financeiras...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Resumo Financeiro</h1>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-600 mt-8" role="alert">
                    <strong className="font-bold">Erro de Dados:</strong>
                    <span className="block sm:inline"> {error || 'Dados financeiros indisponíveis.'} </span>
                    <button onClick={refetch} className="ml-4 font-semibold hover:underline">Tentar Novamente</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Resumo Financeiro</h1>
            <p className="text-gray-600 dark:text-gray-400">
                Central de gestão completa de contas a pagar, receber e análise de performance.
            </p>

            {/* 1. KPIs Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Receita Líquida (Mês)"
                    value={formatCurrency(data.receitaLiquidaMes)}
                    colorClass="text-green-600 dark:text-green-400"
                />
                <MetricCard
                    title="Contas a Receber (Total)"
                    value={formatCurrency(data.contasAReceberTotal)}
                    colorClass="text-rentou-primary dark:text-blue-400"
                />
                <MetricCard
                    title="Contas a Pagar (Total)"
                    value={formatCurrency(data.contasAPagarTotal)}
                    colorClass="text-red-600 dark:text-red-400"
                />
            </div>
            
            {/* 2. Seção de Análise e Gráfico Avançado */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                 {/* Gráfico principal de Fluxo de Caixa */}
                <FluxoCaixaChartPlaceholder data={data.historicoMensal} />
                
                {/* Painel de Ações Rápidas (Inovação) */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Ações Financeiras</h2>
                    <ul className="space-y-3">
                        <li>
                            <button className="w-full text-left p-3 rounded-lg text-sm font-medium bg-rentou-primary text-white hover:bg-blue-700 transition">
                                Gerar Boleto de Aluguel
                            </button>
                        </li>
                        <li>
                            <button className="w-full text-left p-3 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300">
                                Emitir Relatório (PDF/CSV)
                            </button>
                        </li>
                        <li>
                            <button className="w-full text-left p-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">
                                Registrar Despesa (Manutenção)
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* 3. Extrato e Transações Detalhadas com Filtro Interativo */}
            <ExtratoTable transactions={data.extratoRecente} />

        </div>
    );
}
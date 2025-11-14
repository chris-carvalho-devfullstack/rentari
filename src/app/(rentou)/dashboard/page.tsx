// src/app/(rentou)/dashboard/page.tsx
'use client'; 

import { Metadata } from 'next';
import { useDashboard } from '@/hooks/useDashboard'; 
import { DashboardMetrics } from '@/types/dashboard'; 

// A Metadata precisa ser exportada em um arquivo 'layout.tsx' se for usar 'use client' no 'page.tsx'
// Para fins de demonstração, manteremos aqui (o Next.js usará a mais externa, se houver)

// Componente utilitário para formatação de moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// Componente moderno para exibir uma Métrica (KPI Card)
interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  colorClass: string;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, colorClass, description }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border-t-4 border-rentou-primary dark:border-blue-700">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h2>
        {/* CORREÇÃO: Reduzido de text-4xl para text-3xl para evitar overflow em layouts de 5 colunas */}
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}> 
            {value}
            {/* CORREÇÃO: Reduzido de text-2xl para text-xl para harmonia */}
            {unit && <span className="text-xl font-semibold ml-1">{unit}</span>} 
        </p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">{description}</p>
        )}
    </div>
);

// Componente para exibir o placeholder do gráfico (Simula o uso de dados complexos)
const ChartPlaceholder: React.FC<{ title: string; data: DashboardMetrics['fluxoCaixaMensal'] }> = ({ title, data }) => {
  // Cálculo básico a partir dos dados mockados
  const totalReceita = data.reduce((acc, item) => acc + item.receita, 0);
  const totalDespesa = data.reduce((acc, item) => acc + item.despesa, 0);
  const balanco = totalReceita - totalDespesa;

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl col-span-full xl:col-span-2">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
      <div className="flex items-center justify-center h-80 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="mb-2 font-medium">Placeholder para Gráfico de Performance Financeira</p>
          <p className="text-sm">Os dados para renderização já foram carregados e estão prontos:</p>
          <p className="text-lg font-medium mt-1 text-green-600 dark:text-green-400">Receita Total: {formatCurrency(totalReceita)}</p>
          <p className="text-lg font-medium text-red-600 dark:text-red-400">Despesa Total: {formatCurrency(totalDespesa)}</p>
          <p className="text-xl font-bold mt-2 text-rentou-primary">Balanço do Período: {formatCurrency(balanco)}</p>
        </div>
      </div>
    </div>
  );
};


/**
 * @fileoverview Página principal do Dashboard, agora utilizando dados dinâmicos.
 */
export default function DashboardPage() {
  const { metrics, loading, error, refetch } = useDashboard();
  
  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard Principal</h1>
        <div className="flex justify-center items-center h-48 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow mt-8">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-rentou-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard Principal</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-600 mt-8" role="alert">
              <strong className="font-bold">Erro de Dados:</strong>
              <span className="block sm:inline"> {error} </span>
              <button onClick={refetch} className="ml-4 font-semibold hover:underline">Tentar Novamente</button>
          </div>
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard Principal</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Visão geral das suas atividades e métricas principais em tempo real.
      </p>
      
      {/* Container de Métricas (KPI Cards) - Layout de 5 colunas para máximo impacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-8">
        <MetricCard
            title="Imóveis Ativos"
            value={metrics!.imoveisAtivos}
            colorClass="text-blue-600 dark:text-blue-400"
            description="Total de unidades sob gestão na plataforma Rentou."
        />
        <MetricCard
            title="Receita Mês (Atual)"
            value={formatCurrency(metrics!.receitaMes)}
            colorClass="text-green-600 dark:text-green-400"
            description="Soma dos aluguéis a receber no mês atual."
        />
        <MetricCard
            title="Pendências"
            value={metrics!.pendencias}
            colorClass="text-red-600 dark:text-red-400"
            description="Aluguéis em atraso ou contratos a vencer (Ação Imediata)."
        />
        <MetricCard
            title="Taxa de Ocupação"
            value={metrics!.taxaOcupacao}
            unit="%"
            colorClass="text-yellow-600 dark:text-yellow-400"
            description="Percentual de imóveis alugados vs. total de ativos."
        />
        <MetricCard
            title="Projeção Anual"
            value={formatCurrency(metrics!.projecaoAnual)}
            colorClass="text-indigo-600 dark:text-indigo-400"
            description="Receita estimada para os próximos 12 meses."
        />
      </div>

      {/* Seção de Análise (Gráfico Placeholder) - Painel principal de visualização */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        <ChartPlaceholder 
            title="Performance Financeira (Últimos 6 Meses)"
            data={metrics!.fluxoCaixaMensal}
        />
        {/* Outro Widget de Dashboard: Alertas Operacionais */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Alertas e Notificações</h2>
            <ul className="space-y-3 text-sm">
                <li className="text-red-500 dark:text-red-400">⚠️ Imóvel #004: Aluguel de janeiro em atraso (3 dias).</li>
                <li className="text-yellow-500 dark:text-yellow-400">⏳ Contrato de Apt. Luxo (Vista Mar) expira em 45 dias.</li>
                <li className="text-gray-500 dark:text-gray-400">✅ Nenhum novo lead nos últimos 7 dias.</li>
            </ul>
            <button className="mt-4 text-sm font-medium text-rentou-primary hover:text-blue-800">Ver Central de Pendências</button>
        </div>
      </div>
    </div>
  );
}
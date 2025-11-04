// src/app/(rentou)/financeiro/page.tsx

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financeiro - Rentou',
};

/**
 * @fileoverview Página de resumo Financeiro do Proprietário.
 */
export default function FinanceiroPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Resumo Financeiro</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Visualize extratos, pagamentos recebidos e pendências financeiras.
      </p>
      <div className="mt-8 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Extrato Mensal (Últimos 6 Meses)</h2>
        <p className="text-gray-500 dark:text-gray-400">Gráfico e extrato de transações serão implementados aqui.</p>
      </div>
    </div>
  );
}
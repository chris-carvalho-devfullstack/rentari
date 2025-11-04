// src/app/(rentou)/dashboard/page.tsx

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Rentou',
  description: 'Visão geral das locações, finanças e anúncios ativos.',
};

/**
 * @fileoverview Página principal do Dashboard.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard Principal</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Bem-vindo de volta! Aqui você verá um resumo das suas atividades e métricas principais.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Imóveis Ativos</h2>
            <p className="text-3xl text-blue-600 mt-2">12</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Receita Mês</h2>
            <p className="text-3xl text-green-600 mt-2">R$ 15.400,00</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pendências</h2>
            <p className="text-3xl text-red-600 mt-2">2</p>
        </div>
      </div>
    </div>
  );
}
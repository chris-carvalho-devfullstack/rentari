// src/app/(rentou)/imoveis/page.tsx

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meus Imóveis - Rentou',
};

/**
 * @fileoverview Página de lista de Imóveis do Proprietário.
 */
export default function ImoveisPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Lista de Imóveis</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Gerencie seus imóveis, edite anúncios e acompanhe o status de locação.
      </p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        + Adicionar Novo Imóvel
      </button>
      {/* Tabela de imóveis placeholder */}
      <div className="mt-8 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">Tabela de imóveis será implementada aqui.</p>
      </div>
    </div>
  );
}
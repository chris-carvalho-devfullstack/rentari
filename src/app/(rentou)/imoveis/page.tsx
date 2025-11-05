// src/app/(rentou)/imoveis/page.tsx

import { Metadata } from 'next';
import ListaImoveis from '@/components/imoveis/ListaImoveis'; 

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
      {/* CORREÇÃO FORÇADA: Usa !bg-rentou-primary e !text-white para garantir o contraste. */}
      <button className="mt-4 px-4 py-2 !bg-rentou-primary !text-white rounded-md hover:bg-blue-700 transition-colors">
        + Adicionar Novo Imóvel
      </button>
      
      <div className="mt-8">
        <ListaImoveis />
      </div>
    </div>
  );
}
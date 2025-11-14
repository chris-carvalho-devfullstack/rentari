// src/app/(rentou)/imoveis/novo/page.tsx

import { Metadata } from 'next';
import FormularioImovel from '@/components/imoveis/FormularioImovel'; 
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Novo Imóvel - Rentou',
};

/**
 * @fileoverview Página para adicionar um novo imóvel.
 */
export default function NovoImovelPage() {
  return (
    <div className="space-y-6">
      <Link href="/imoveis" className="text-rentou-primary hover:underline font-medium text-sm">
        ← Voltar para Lista de Imóveis
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Adicionar Novo Imóvel</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Preencha os dados básicos do imóvel para iniciar o gerenciamento na plataforma.
      </p>

      <FormularioImovel />
    </div>
  );
}
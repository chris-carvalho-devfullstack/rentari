// src/components/imoveis/ListaImoveis.tsx
'use client';

import React from 'react';
import { Imovel } from '@/types/imovel'; 
import { useImoveis } from '@/hooks/useImoveis'; 
import Link from 'next/link'; 

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const StatusBadge: React.FC<{ status: Imovel['status'] }> = ({ status }) => {
  let classes = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ';
  let text = '';

  switch (status) {
    case 'ALUGADO':
      classes += 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      text = 'Alugado';
      break;
    case 'VAGO':
      classes += 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      text = 'Vago';
      break;
    case 'ANUNCIADO':
      classes += 'bg-blue-100 text-rentou-primary dark:bg-blue-900 dark:text-blue-300';
      text = 'Anunciado';
      break;
    case 'MANUTENCAO':
      classes += 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      text = 'Manutenção';
      break;
    default:
      classes += 'bg-gray-500 text-white';
      text = status;
      break;
  }

  return <span className={classes}>{text}</span>;
};


/**
 * @fileoverview Componente de tabela para listar imóveis do proprietário.
 * Implementa o ID Inteligente e linka para a página de Detalhes/Gerenciamento.
 */
export default function ListaImoveis() {
  const { imoveis, loading, error, refetch } = useImoveis();
  
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-rentou-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Carregando imóveis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-600" role="alert">
          <strong className="font-bold">Erro:</strong>
          <span className="block sm:inline"> {error} </span>
          <button onClick={refetch} className="ml-4 font-semibold hover:underline">Tentar Novamente</button>
      </div>
    );
  }

  if (imoveis.length === 0) {
    return (
      <div className="text-center p-12 bg-white dark:bg-zinc-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Nenhum imóvel encontrado.</h2>
          <p className="text-gray-600 dark:text-gray-400">Adicione seu primeiro imóvel para começar a gerenciar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
        <thead className="bg-gray-50 dark:bg-zinc-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
            >
              Título / ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
            >
              Endereço / Cidade
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
            >
              Valor Aluguel
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
            >
              Status
            </th>
            <th scope="col" className="relative px-6 py-3 text-right">
              <span className="sr-only">Ação</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gerenciar</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
          {imoveis.map((imovel) => (
            <tr key={imovel.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                <div className="font-bold">{imovel.titulo}</div>
                {/* ID INTELIGENTE NA TABELA */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{imovel.id}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {imovel.endereco}, {imovel.cidade}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(imovel.valorAluguel)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={imovel.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {/* CORREÇÃO: Link agora aponta para a nova página de detalhes */}
                <Link 
                    href={`/imoveis/${imovel.id}`}
                    className="text-rentou-primary hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                    Gerenciar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
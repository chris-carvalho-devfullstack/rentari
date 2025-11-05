// src/components/imoveis/ListaImoveis.tsx
'use client';

import React from 'react';
import { Imovel } from '@/types/imovel'; 

/**
 * Dados mockados para simular a lista de imóveis.
 */
const mockImoveis: Imovel[] = [
  {
    id: 'imovel-001',
    proprietarioId: 'prop-123',
    titulo: 'Apartamento de Luxo (Vista Mar)',
    endereco: 'Rua do Sol, 456',
    cidade: 'Florianópolis, SC',
    status: 'ALUGADO',
    valorAluguel: 4800.00,
  },
  {
    id: 'imovel-002',
    proprietarioId: 'prop-123',
    titulo: 'Casa Térrea com Piscina',
    endereco: 'Avenida das Flores, 100',
    cidade: 'São Paulo, SP',
    status: 'VAGO',
    valorAluguel: 3500.00,
  },
  {
    id: 'imovel-003',
    proprietarioId: 'prop-123',
    titulo: 'Estúdio Compacto (Próx. Metrô)',
    endereco: 'Rua da Consolação, 89',
    cidade: 'São Paulo, SP',
    status: 'ANUNCIADO',
    valorAluguel: 1850.00,
  },
  {
    id: 'imovel-004',
    proprietarioId: 'prop-123',
    titulo: 'Loft Moderno (Mobiliado)',
    endereco: 'Rua XV de Novembro, 203',
    cidade: 'Curitiba, PR',
    status: 'ALUGADO',
    valorAluguel: 2900.00,
  },
  {
    id: 'imovel-005',
    proprietarioId: 'prop-123',
    titulo: 'Sobrado em Condomínio Fechado',
    endereco: 'Rua das Gardênias, 50',
    cidade: 'Campinas, SP',
    status: 'ANUNCIADO',
    valorAluguel: 4100.00,
  },
];

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
      // Usando a cor 'rentou-primary' definida no tailwind.config.ts
      classes += 'bg-blue-100 text-rentou-primary dark:bg-blue-900 dark:text-blue-300';
      text = 'Anunciado';
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
 */
export default function ListaImoveis() {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
        <thead className="bg-gray-50 dark:bg-zinc-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
            >
              Título
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
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
          {mockImoveis.map((imovel) => (
            <tr key={imovel.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {imovel.titulo}
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
                <button 
                    onClick={() => console.log(`Ação: ${imovel.titulo}`)}
                    className="text-rentou-primary hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                    Ver Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
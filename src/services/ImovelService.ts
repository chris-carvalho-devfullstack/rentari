// src/services/ImovelService.ts
import { Imovel } from '@/types/imovel';

/**
 * @fileoverview Serviço mockado para simular chamadas à API (Backend NestJS)
 * para o módulo de Imóveis. 
 */

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


/**
 * Simula a busca de imóveis do proprietário na API.
 * Será substituída por uma chamada 'fetch' real em fases futuras.
 * @returns Promise<Imovel[]> Lista de imóveis.
 */
export async function fetchImoveisDoProprietario(): Promise<Imovel[]> {
  console.log('[ImovelService] Simulação: Buscando dados de Imóveis na API...');
  
  // Simula um atraso de rede (1 segundo)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Para simular um erro, descomente a linha abaixo:
  // throw new Error('Falha de conexão com a API Rentari.');

  // Retorna os dados mockados
  return mockImoveis;
}

// Crie e cole o código em: src/services/ImovelService.ts
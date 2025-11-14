// src/services/ImovelService.ts

import { Imovel, NovoImovelData } from '@/types/imovel';
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy'; // Importa a hierarquia

/**
 * @fileoverview Serviço mockado para simular chamadas à API (Backend NestJS)
 * para o módulo de Imóveis, incluindo operações CRUD.
 */

// Variáveis para manter o estado do contador sequencial para o mock
let nextIdSequence = 4; // Começa após os IDs mockados iniciais

const getCategoryPrefix = (categoria: Imovel['categoriaPrincipal']): string => {
  const mapping = IMÓVEIS_HIERARQUIA.find(c => c.categoria === categoria);
  return mapping ? mapping.prefixoID : 'OT'; 
};

/**
 * Gera um ID inteligente e descritivo: [Categoria(2)][Quartos(2)][Mês(2)][Ano(2)][Ordem(2)]
 * @param data Os dados do novo imóvel.
 * @returns O ID inteligente formatado.
 */
const generateNewSmartId = (data: NovoImovelData): string => {
  // Simula a data de cadastro para 14/11/2025 (Mock data)
  const date = new Date('2025-11-14T00:00:00'); 
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  
  const prefix = getCategoryPrefix(data.categoriaPrincipal);
  const quartos = data.quartos.toString().padStart(2, '0');
  
  // Correção de Sintaxe (Incremento isolado)
  const currentSequence = nextIdSequence;
  nextIdSequence++;
  const ordem = currentSequence.toString().padStart(2, '0'); 

  // Formato: RS03112504 (Residencial, 3 Quartos, Nov/25, Ordem 04)
  return `${prefix}${quartos}${month}${year}${ordem}`;
};


// Usamos 'let' para que a lista possa ser mutável (adicionar/remover/editar)
let mockImoveis: Imovel[] = [
  {
    id: 'RS03112501',
    proprietarioId: 'prop-123',
    titulo: 'Apartamento de Luxo (Vista Mar)',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Locação Residencial', 'Venda'], 
    endereco: 'Rua do Sol, 456',
    cidade: 'Florianópolis, SC',
    quartos: 3,
    banheiros: 2,
    vagasGaragem: 2,
    areaTotal: 120,
    areaUtil: 105,
    descricaoLonga: 'Apartamento de alto padrão com vista para o mar. Mobiliado e pronto para morar.',
    caracteristicas: ['Piscina', 'Academia', 'Portaria 24h'],
    aceitaAnimais: false,
    andar: 15,
    status: 'ALUGADO',
    valorAluguel: 4800.00,
    valorCondominio: 850.00,
    valorIPTU: 150.00,
    dataDisponibilidade: '2026-01-01',
    fotos: ['url-foto-1', 'url-foto-2'],
    linkVideoTour: 'http://youtube.com/tour1',
    visitaVirtual360: true,
  },
  {
    id: 'RU04112502',
    proprietarioId: 'prop-123',
    titulo: 'Sítio de Lazer com Cachoeira',
    categoriaPrincipal: 'Rural', 
    tipoDetalhado: 'Sítio Lazer', 
    finalidades: ['Venda', 'Locação Temporada'], 
    endereco: 'Estrada do Pinhal, Km 10',
    cidade: 'Serra Negra, SP',
    quartos: 4,
    banheiros: 3,
    vagasGaragem: 3,
    areaTotal: 25000, 
    areaUtil: 200,
    descricaoLonga: 'Excelente sítio de lazer, com área de lazer completa, piscina e riacho com cachoeira privativa.',
    caracteristicas: ['Piscina', 'Churrasqueira', 'Quintal', 'Cachoeira', 'Área de Cultivo'],
    aceitaAnimais: true,
    status: 'VAGO',
    valorAluguel: 3500.00, 
    valorCondominio: 0.00,
    valorIPTU: 200.00,
    dataDisponibilidade: '2025-11-20',
    fotos: ['url-foto-3', 'url-foto-4'],
    linkVideoTour: undefined,
    visitaVirtual360: false,
  },
  {
    id: 'CM01112503',
    proprietarioId: 'prop-123',
    titulo: 'Loja de Rua - Ponto Central',
    categoriaPrincipal: 'Comercial', 
    tipoDetalhado: 'Loja de Rua', 
    finalidades: ['Locação Comercial'], 
    endereco: 'Rua da Consolação, 89',
    cidade: 'São Paulo, SP',
    quartos: 1, 
    banheiros: 1,
    vagasGaragem: 0,
    areaTotal: 35,
    areaUtil: 35,
    descricaoLonga: 'Loja bem localizada, excelente para varejo ou escritório. Próximo ao metrô.',
    caracteristicas: ['Ar Condicionado', 'Internet Fibra'],
    aceitaAnimais: false,
    andar: 0,
    status: 'ANUNCIADO',
    valorAluguel: 1850.00,
    valorCondominio: 300.00,
    valorIPTU: 50.00,
    dataDisponibilidade: '2025-12-01',
    fotos: ['url-foto-5'],
    linkVideoTour: undefined,
    visitaVirtual360: false,
  },
];


/**
 * Simula a busca de imóveis do proprietário na API (Read - All).
 * @returns Promise<Imovel[]> Lista de imóveis.
 */
export async function fetchImoveisDoProprietario(): Promise<Imovel[]> {
  console.log('[ImovelService] Simulação: Buscando dados de Imóveis...');
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockImoveis;
}

/**
 * Simula a busca de um único imóvel por ID (Read - Single).
 * @param id O ID do imóvel.
 * @returns Promise<Imovel | undefined> O imóvel encontrado ou undefined.
 */
export async function fetchImovelPorId(id: string): Promise<Imovel | undefined> {
  console.log(`[ImovelService] Simulação: Buscando imóvel ID: ${id}...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const imovel = mockImoveis.find(i => i.id === id);
  
  if (!imovel) {
    throw new Error(`Imóvel com ID ${id} não encontrado no mock.`);
  }

  return imovel;
}


/**
 * Simula a adição de um novo imóvel (Create).
 * @param data Os dados do novo imóvel (NovoImovelData).
 * @returns Promise<Imovel> O objeto Imovel criado (incluindo o ID gerado).
 */
export async function adicionarNovoImovel(data: NovoImovelData): Promise<Imovel> {
  console.log('[ImovelService] Simulação: Adicionando novo imóvel...');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Cria o ID inteligente e sequencial
  const newId = generateNewSmartId(data);
  const newImovel: Imovel = {
    id: newId,
    proprietarioId: 'prop-123', 
    // Linhas de 'caracteristicas' e 'fotos' removidas para evitar colisão de propriedade (Type Error)
    ...data,
  };

  // Adiciona à lista mockada (mutação)
  mockImoveis = [...mockImoveis, newImovel];
  
  return newImovel;
}

/**
 * Simula a atualização de um imóvel existente (Update).
 * @param id O ID do imóvel a ser atualizado.
 * @param data Os dados a serem atualizados (NovoImovelData).
 * @returns Promise<Imovel> O objeto Imovel atualizado.
 */
export async function atualizarImovel(id: string, data: NovoImovelData): Promise<Imovel> {
  console.log(`[ImovelService] Simulação: Atualizando imóvel ID: ${id}...`);
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockImoveis.findIndex(i => i.id === id);

  if (index === -1) {
    throw new Error(`Imóvel com ID ${id} não encontrado para atualização.`);
  }

  // Cria o objeto atualizado. O ID é imutável após a criação.
  const updatedImovel: Imovel = {
    ...mockImoveis[index], 
    ...data,
    // O spread '...data' já inclui as listas de caracteristicas e fotos. 
    // Mantenho a lógica de fallback, mas o spread de 'data' deve ser a fonte primária.
    caracteristicas: data.caracteristicas || mockImoveis[index].caracteristicas,
    fotos: data.fotos || mockImoveis[index].fotos,
  };
  
  // Atualiza a lista mockada (mutação)
  mockImoveis = [
    ...mockImoveis.slice(0, index),
    updatedImovel,
    ...mockImoveis.slice(index + 1),
  ];

  return updatedImovel;
}

/**
 * Simula a remoção de um imóvel (Delete).
 * @param id O ID do imóvel a ser removido.
 * @returns Promise<void>
 */
export async function removerImovel(id: string): Promise<void> {
  console.log(`[ImovelService] Simulação: Removendo imóvel ID: ${id}...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const initialLength = mockImoveis.length;
  mockImoveis = mockImoveis.filter(i => i.id !== id);

  if (mockImoveis.length === initialLength) {
    throw new Error(`Imóvel com ID ${id} não encontrado para remoção.`);
  }
  
  console.log(`[ImovelService] Imóvel ID: ${id} removido com sucesso.`);
}
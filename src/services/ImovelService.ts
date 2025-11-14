// src/services/ImovelService.ts
import { Imovel } from '@/types/imovel';

/**
 * @fileoverview Serviço mockado para simular chamadas à API (Backend NestJS)
 * para o módulo de Imóveis, incluindo operações CRUD.
 */

/**
 * Define a estrutura de dados para criação/edição, conforme esperado pelo FormulárioImovel.
 * Propriedades que são geradas pelo backend (id, proprietarioId) são omitidas.
 */
export type NovoImovelData = Omit<Imovel, 'id' | 'proprietarioId'>;

// Variáveis para manter o estado do contador sequencial para o mock
let nextIdSequence = 4; // Começa após os IDs mockados iniciais

const getTypePrefix = (type: Imovel['tipoImovel']): string => {
  switch (type) {
    case 'APARTAMENTO': return 'AP';
    case 'CASA': return 'CS';
    case 'SITIO': return 'ST';
    case 'FAZENDA': return 'FZ';
    case 'CHACARA': return 'CH';
    case 'TERRENO': return 'TR';
    case 'COMERCIAL': return 'CM';
    case 'OUTRO': return 'OT';
    default: return 'OT';
  }
};

/**
 * Gera um ID inteligente e descritivo: [Tipo(2)][Quartos(2)][Mês(2)][Ano(2)][Ordem(2)]
 * @param data Os dados do novo imóvel.
 * @returns O ID inteligente formatado.
 */
const generateNewSmartId = (data: NovoImovelData): string => {
  // Simula a data de cadastro para 14/11/2025 (Mock data)
  const date = new Date('2025-11-14T00:00:00'); 
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  
  const prefix = getTypePrefix(data.tipoImovel);
  const quartos = data.quartos.toString().padStart(2, '0');
  // CORRIGIDO: Ponto e vírgula e incremento mantidos na sintaxe válida
  const ordem = nextIdSequence++.toString().padStart(2, '0'); 

  // Formato: AP03112501
  return `${prefix}${quartos}${month}${year}${ordem}`;
};


// Usamos 'let' para que a lista possa ser mutável (adicionar/remover/editar)
let mockImoveis: Imovel[] = [
  {
    // Novo formato de ID inteligente
    id: 'AP03112501',
    proprietarioId: 'prop-123',
    titulo: 'Apartamento de Luxo (Vista Mar)',
    tipoImovel: 'APARTAMENTO',
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
    // Novo formato de ID inteligente
    id: 'CS04112502',
    proprietarioId: 'prop-123',
    titulo: 'Casa Térrea com Piscina',
    tipoImovel: 'CASA',
    endereco: 'Avenida das Flores, 100',
    cidade: 'São Paulo, SP',
    quartos: 4,
    banheiros: 3,
    vagasGaragem: 3,
    areaTotal: 250,
    areaUtil: 200,
    descricaoLonga: 'Excelente casa térrea em condomínio fechado, com área de lazer completa e piscina privativa.',
    caracteristicas: ['Piscina', 'Churrasqueira', 'Quintal'],
    aceitaAnimais: true,
    status: 'VAGO',
    valorAluguel: 3500.00,
    valorCondominio: 450.00,
    valorIPTU: 200.00,
    dataDisponibilidade: '2025-11-20',
    fotos: ['url-foto-3', 'url-foto-4'],
    linkVideoTour: undefined,
    visitaVirtual360: false,
  },
  {
    // Novo formato de ID inteligente
    id: 'AP01112503',
    proprietarioId: 'prop-123',
    titulo: 'Estúdio Compacto (Próx. Metrô)',
    tipoImovel: 'APARTAMENTO',
    endereco: 'Rua da Consolação, 89',
    cidade: 'São Paulo, SP',
    quartos: 1,
    banheiros: 1,
    vagasGaragem: 0,
    areaTotal: 35,
    areaUtil: 35,
    descricaoLonga: 'Estúdio mobiliado e funcional, ideal para estudantes e jovens profissionais. A 2 minutos do metrô.',
    caracteristicas: ['Lavanderia Comum', 'Internet Fibra'],
    aceitaAnimais: false,
    andar: 8,
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
    caracteristicas: data.caracteristicas || [],
    fotos: data.fotos || [],
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
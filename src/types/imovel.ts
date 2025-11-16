// src/types/imovel.ts

// Tipos de categoria e finalidade para o novo modelo hierárquico
export type ImovelCategoria = 'Residencial' | 'Comercial' | 'Terrenos' | 'Rural' | 'Imóveis Especiais' | 'Outro';
export type ImovelFinalidade = 'Venda' | 'Locação Residencial' | 'Locação Comercial' | 'Locação Temporada' | 'Arrendamento Rural' | 'Locação Diária' | 'Locação Coworking' | 'Permuta';

// NOVO: Estrutura completa de endereço do Imóvel
export interface EnderecoImovel {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string; // UF
    pais: string;
}

// NOVO: Estrutura de dados de Condomínio
export interface CondominioData {
    possuiCondominio: boolean; // Flag se está em condomínio (mesmo que não residencial)
    nomeCondominio?: string; // Nome do condomínio/edifício
    portaria24h?: boolean;
    areaLazer?: boolean;
}

/**
 * Define a estrutura de dados robusta para um Imóvel na plataforma Rentou.
 * ATUALIZADO: Usando EnderecoImovel e CondominioData aninhados.
 */
export interface Imovel {
  /** ID técnico (Firestore Document ID) */
  id: string;
  /** ID de Negócio (Ex: RS0311142504) - Chave de rastreamento do ativo. */
  smartId: string; 
  /** UID do proprietário associado ao imóvel */
  proprietarioId: string;
  
  // === 1. Informações Básicas e Classificação ===
  titulo: string;
  /** Categoria de alto nível (Ex: Residencial, Rural) */
  categoriaPrincipal: ImovelCategoria;
  /** Tipo detalhado (Ex: Apartamento Padrão, Casa em Condomínio Fechado) */
  tipoDetalhado: string; 
  /** Múltiplas finalidades (Ex: ['Venda', 'Locação Residencial']) */
  finalidades: ImovelFinalidade[]; 

  endereco: EnderecoImovel; // <-- MUDANÇA: Objeto EnderecoImovel
  condominio: CondominioData; // <-- MUDANÇA: Objeto CondominioData
  
  // === 2. Detalhes Estruturais ===
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  areaTotal: number; 
  areaUtil: number; 
  andar?: number; 
  
  // === 3. Descrição e Comodidades ===
  descricaoLonga: string;
  caracteristicas: string[]; 
  aceitaAnimais: boolean;
  
  // === 4. Valores e Status de Locação ===
  status: 'VAGO' | 'ALUGADO' | 'ANUNCIADO' | 'MANUTENCAO';
  valorAluguel: number; 
  valorCondominio: number; 
  valorIPTU: number; 
  dataDisponibilidade: string; 
  
  // === 5. Mídia e Publicação ===
  fotos: string[];
  linkVideoTour?: string;
  visitaVirtual360: boolean;
}

// NOVO: Define a estrutura de dados para o formulário (exclui campos auto-gerados)
export type NovoImovelData = Omit<Imovel, 'id' | 'smartId' | 'proprietarioId'>;
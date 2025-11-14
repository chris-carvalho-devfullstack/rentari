// src/types/imovel.ts

// Tipos de categoria e finalidade para o novo modelo hierárquico
export type ImovelCategoria = 'Residencial' | 'Comercial' | 'Terrenos' | 'Rural' | 'Imóveis Especiais' | 'Outro';
export type ImovelFinalidade = 'Venda' | 'Locação Residencial' | 'Locação Comercial' | 'Locação Temporada' | 'Arrendamento Rural' | 'Locação Diária' | 'Locação Coworking' | 'Permuta';

/**
 * Define a estrutura de dados robusta para um Imóvel na plataforma Rentou.
 */
export interface Imovel {
  /** Identificador único do imóvel (Smart ID) */
  id: string;
  /** UID do proprietário associado ao imóvel */
  proprietarioId: string;
  
  // === 1. Informações Básicas e Classificação (NOVO) ===
  titulo: string;
  /** Categoria de alto nível (Ex: Residencial, Rural) - NOVO */
  categoriaPrincipal: ImovelCategoria;
  /** Tipo detalhado (Ex: Apartamento Padrão, Casa em Condomínio Fechado) - NOVO */
  tipoDetalhado: string; 
  /** Múltiplas finalidades (Ex: ['Venda', 'Locação Residencial']) - NOVO */
  finalidades: ImovelFinalidade[]; 

  endereco: string;
  cidade: string;
  
  // === 2. Detalhes Estruturais (Mantidos) ===
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  areaTotal: number; 
  areaUtil: number; 
  andar?: number; 
  
  // === 3. Descrição e Comodidades (Mantidos) ===
  descricaoLonga: string;
  caracteristicas: string[]; 
  aceitaAnimais: boolean;
  
  // === 4. Valores e Status de Locação (Mantidos) ===
  status: 'VAGO' | 'ALUGADO' | 'ANUNCIADO' | 'MANUTENCAO';
  valorAluguel: number; // Agora pode ser 0, se for apenas Venda
  valorCondominio: number; 
  valorIPTU: number; 
  dataDisponibilidade: string; 
  
  // === 5. Mídia e Publicação (Mantidos) ===
  fotos: string[];
  linkVideoTour?: string;
  visitaVirtual360: boolean;
}

// NOVO: Define a estrutura de dados para o formulário (exclui campos auto-gerados)
export type NovoImovelData = Omit<Imovel, 'id' | 'proprietarioId'>; // <--- CORREÇÃO
// src/types/imovel.ts

/**
 * Define a estrutura de dados robusta para um Imóvel na plataforma Rentou.
 * Inclui campos essenciais para um cadastro de alto padrão, seguindo tendências de mercado.
 */
export interface Imovel {
  /** Identificador único do imóvel */
  id: string;
  /** UID do proprietário associado ao imóvel */
  proprietarioId: string;
  
  // === 1. Informações Básicas e Localização ===
  /** Título/Nome de exibição do imóvel (ex: "Apartamento 201 - Centro") */
  titulo: string;
  /** Tipo de imóvel (Casa, Apartamento, Terreno, Comercial, Sítio, Fazenda, Chácara, etc.) */
  tipoImovel: 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'COMERCIAL' | 'SITIO' | 'FAZENDA' | 'CHACARA' | 'OUTRO';
  /** Endereço completo ou resumido */
  endereco: string;
  /** Cidade e UF onde o imóvel está localizado (ex: "São Paulo, SP") */
  cidade: string;
  
  // === 2. Detalhes Estruturais ===
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  /** Área total do imóvel em metros quadrados */
  areaTotal: number; 
  /** Área útil/privativa em metros quadrados */
  areaUtil: number; 
  
  // === 3. Descrição e Comodidades (Atrativos) ===
  /** Descrição detalhada para o anúncio */
  descricaoLonga: string;
  /** Lista de características/comodidades (ex: "Piscina", "Churrasqueira", "Portaria 24h") */
  caracteristicas: string[]; 
  /** Indica se o proprietário aceita animais de estimação */
  aceitaAnimais: boolean;
  /** Andar do apartamento (se aplicável, 0 para térreo) */
  andar?: number; 
  
  // === 4. Valores e Status de Locação ===
  /** Status atual do imóvel na plataforma */
  status: 'VAGO' | 'ALUGADO' | 'ANUNCIADO' | 'MANUTENCAO';
  /** Valor atual do aluguel mensal */
  valorAluguel: number;
  /** Valor mensal do condomínio (0 se não houver) */
  valorCondominio: number; 
  /** Valor mensal/anual do IPTU (se for mensal, usar valor mensal) */
  valorIPTU: number; 
  /** Data de disponibilidade para locação (YYYY-MM-DD) */
  dataDisponibilidade: string; 
  
  // === 5. Mídia e Publicação ===
  /** URLs para fotos do imóvel */
  fotos: string[];
  /** Link para vídeo tour (YouTube, Vimeo, etc.) */
  linkVideoTour?: string;
  /** Flag para indicar que o imóvel tem uma visita virtual 360 */
  visitaVirtual360: boolean;
}
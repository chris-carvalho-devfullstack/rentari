// src/types/imovel.ts

// Tipos de categoria e finalidade para o novo modelo hierárquico
export type ImovelCategoria = 'Residencial' | 'Comercial' | 'Terrenos' | 'Rural' | 'Imóveis Especiais' | 'Outro';
export type ImovelFinalidade = 'Venda' | 'Locação Residencial' | 'Locação Comercial' | 'Locação Temporada' | 'Arrendamento Rural' | 'Locação Diária' | 'Locação Coworking' | 'Permuta';
export type ResponsavelPagamento = 'PROPRIETARIO' | 'LOCATARIO' | 'NA_LOCACAO'; // NA_LOCACAO: Cobrado separadamente

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

// NOVO: Detalhes da Piscina (Privativa do Imóvel)
export interface PiscinaPrivativaData {
    possuiPiscina: boolean;
    tipo?: 'VINIL' | 'AZULEJO' | 'FIBRA' | 'NATURAL';
    aquecida?: boolean;
}

// === NOVAS ESTRUTURAS INTERNAS (AGORA OTIMIZADAS PARA ARRAYS) ===
export interface CozinhaData {
    tipo: 'AMERICANA' | 'FECHADA' | 'GOURMET' | 'ILHA' | 'INTEGRADA' | 'INDUSTRIAL' | 'DE_SERVICO' | 'COPA_COZINHA' | 'OUTRA';
    nomeCustomizado?: string; // Ex: "Cozinha 1", "Cozinha Gourmet"
    possuiArmarios?: boolean;
}

export interface SalaData {
    tipo: 'ESTAR' | 'JANTAR' | 'TV' | 'ESCRITORIO' | 'HOME_OFFICE' | 'CINEMA' | 'JOGOS' | 'CONJUGADA' | 'OUTRA';
    nomeCustomizado?: string; // Ex: "Sala de Estar", "Home Office"
    qtdAssentos?: number; // Para salas de cinema/estar
}

export interface VarandaData {
    tipo: 'SIMPLES' | 'GOURMET' | 'FECHADA' | 'TERRACO'; // Adicionado TERRACO
    nomeCustomizado?: string; // Ex: "Varanda Principal", "Terraço"
    possuiChurrasqueira?: boolean;
    temFechamentoVidro?: boolean;
}

export interface DispensaData {
    possuiDispensa: boolean;
    prateleirasEmbutidas?: boolean;
}

/**
 * Define a estrutura de dados robusta para um Imóvel na plataforma Rentou.
 * ATUALIZADO: Cômodos principais agora são ARRAYS.
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
  
  // === 2. Detalhes Estruturais (ATUALIZADOS) ===
  quartos: number;
  suites: number; // NOVO: Contagem separada de suítes
  banheiros: number; 
  lavabos: number; // NOVO: Contagem de lavabos
  banheirosServico: number; // NOVO: Contagem de banheiros de serviço
  vagasGaragem: number;
  areaTotal: number; 
  areaUtil: number; 
  andar?: number; 
  
  piscinaPrivativa: PiscinaPrivativaData; // NOVO: Piscina Privativa
  
  // NOVO: Detalhes de Cômodos - ARRAYS
  cozinhas: CozinhaData[]; // <-- MUDANÇA CRÍTICA
  salas: SalaData[];       // <-- MUDANÇA CRÍTICA
  varandas: VarandaData[]; // <-- MUDANÇA CRÍTICA
  dispensa: DispensaData; // Mantido como objeto único (estrutura simples)
  
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
  
  // NOVO: Responsabilidades e Custos Inclusos (REQUISITO FINANCEIRO)
  custoCondominioIncluso: boolean; // Se o valor já está somado em valorAluguel (Locação Total)
  responsavelCondominio: ResponsavelPagamento; // Quem paga (Proprietário, Locatário, Não se aplica)
  
  custoIPTUIncluso: boolean; // Se o valor já está somado em valorAluguel (Locação Total)
  responsavelIPTU: ResponsavelPagamento; // Quem paga (Proprietário, Locatário, Não se aplica)

  // === 5. Mídia e Publicação ===
  fotos: string[];
  linkVideoTour?: string;
  visitaVirtual360: boolean;
}

// NOVO: Define a estrutura de dados para o formulário (exclui campos auto-gerados)
export type NovoImovelData = Omit<Imovel, 'id' | 'smartId' | 'proprietarioId'>;
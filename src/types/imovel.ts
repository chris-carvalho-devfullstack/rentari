// src/types/imovel.ts

/**
 * @fileoverview Definições de Tipos para a Entidade Imóvel e seus sub-objetos.
 * Atualizado para suportar: Rural, Alto Padrão, Seguros e Publicidade Avançada.
 */

// --- ENUMS E TIPOS BÁSICOS ---

export type ImovelCategoria = 'Residencial' | 'Comercial' | 'Terrenos' | 'Rural' | 'Imóveis Especiais' | 'Outro';
export type ImovelFinalidade = 'Venda' | 'Locação Residencial' | 'Locação Comercial' | 'Locação Temporada' | 'Arrendamento Rural' | 'Permuta';
export type ResponsavelPagamento = 'PROPRIETARIO' | 'LOCATARIO' | 'NA_LOCACAO'; // NA_LOCACAO: Cobrado separadamente ou isento

// --- SUB-ESTRUTURAS DE DADOS ---

export interface EnderecoImovel {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string; // UF (Ex: SP, MG)
    pais: string;
}

export interface CondominioData {
    possuiCondominio: boolean;
    condominioCadastradoId?: string; // ID de referência se o condomínio já existir no banco
    nomeCondominio?: string; // Nome manual caso não exista ID
    portaria24h?: boolean;
    areaLazer?: boolean;
}

export interface PiscinaPrivativaData {
    possuiPiscina: boolean;
    tipo?: 'VINIL' | 'AZULEJO' | 'FIBRA' | 'NATURAL' | 'OUTRO';
    aquecida?: boolean;
}

// --- ESTRUTURAS DE CÔMODOS DETALHADOS (Com Área) ---

export interface CozinhaData {
    tipo: string; // Ex: Americana, Fechada, Gourmet
    nomeCustomizado?: string; // Ex: "Cozinha Principal"
    possuiArmarios?: boolean;
    area?: number; // Área em m² específica deste cômodo
}

export interface SalaData {
    tipo: string; // Ex: Estar, Jantar, TV
    nomeCustomizado?: string;
    qtdAssentos?: number; // Capacidade estimada
    area?: number; // Área em m²
}

export interface VarandaData {
    tipo: string; // Ex: Gourmet, Simples, Terraço
    nomeCustomizado?: string;
    possuiChurrasqueira?: boolean;
    temFechamentoVidro?: boolean;
    area?: number; // Área em m²
}

export interface DispensaData {
    possuiDispensa: boolean;
    prateleirasEmbutidas?: boolean;
    area?: number; // Área em m²
}

// --- NOVAS ESTRUTURAS (Financeiro & Publicidade) ---

export interface SeguroData {
    tipo: 'INCENDIO' | 'FIANCA' | 'CONTEUDO' | 'OUTRO';
    valorMensal: number;
    pagoPor: 'PROPRIETARIO' | 'INQUILINO';
    obrigatorio: boolean; // Se é exigido por lei ou pelo contrato
    descricao?: string; // Ex: "Seguro Incêndio Obrigatório Lei do Inquilinato"
}

export interface PublicidadeConfig {
    publicadoRentou: boolean; // Visível no portal proprietário/app
    publicadoPortaisExternos: boolean; // Integração com Zap/VivaReal
    mostrarEnderecoCompleto: boolean; // Se true: Rua + Num. Se false: Apenas Bairro/Cidade (Privacidade)
    mostrarNumero: boolean; // Controle fino de privacidade
    statusPublicacao: 'RASCUNHO' | 'ATIVO' | 'PAUSADO' | 'VENDIDO' | 'ALUGADO';
}

// --- INTERFACE PRINCIPAL DO IMÓVEL ---

/**
 * Define a estrutura de dados robusta para um Imóvel na plataforma Rentou.
 */
export interface Imovel {
  /** ID técnico (Firestore Document ID) */
  id: string;
  /** ID de Negócio (Ex: RS0311142504) - Chave de rastreamento única e curta. */
  smartId: string; 
  /** UID do proprietário associado ao imóvel */
  proprietarioId: string;
  
  // === 1. Informações Básicas e Classificação ===
  titulo: string;
  categoriaPrincipal: ImovelCategoria;
  tipoDetalhado: string; // Ex: "Apartamento Alto Padrão", "Sítio Lazer"
  finalidades: ImovelFinalidade[]; 

  endereco: EnderecoImovel;
  condominio: CondominioData;
  
  // === 2. Geolocalização (Essencial para Mapas) ===
  latitude?: number; 
  longitude?: number; 
  
  // === 3. Áreas e Dimensões ===
  areaUtil: number; // Área construída/privativa
  areaTotal: number; // Área total (incluindo comuns/externas)
  areaTerreno: number; // Importante para Casas e Rural
  
  // === 4. Detalhes Estruturais ===
  quartos: number;
  suites: number; 
  banheiros: number; // Banheiros sociais
  lavabos: number; 
  banheirosServico: number; 
  vagasGaragem: number;
  andar?: number; // 0 = Térreo
  
  piscinaPrivativa: PiscinaPrivativaData;
  
  // Arrays de Cômodos Detalhados
  cozinhas: CozinhaData[];
  salas: SalaData[];       
  varandas: VarandaData[]; 
  dispensa: DispensaData;
  
  // === 5. Descrição e Comodidades ===
  descricaoLonga: string;
  /** Lista de strings. Para Rural inclui: 'Curral', 'Lago'. Para Urbano: 'Academia', 'Sauna'. */
  caracteristicas: string[]; 
  aceitaAnimais: boolean;
  
  // === 6. Valores, Status e Financeiro ===
  status: 'VAGO' | 'ALUGADO' | 'ANUNCIADO' | 'MANUTENCAO';
  
  valorAluguel: number; 
  valorCondominio: number; 
  valorIPTU: number; 
  
  // Lista de Seguros (Incêndio, Fiança, etc)
  seguros: SeguroData[];

  // Regras de Cobrança (Quem paga o quê)
  custoCondominioIncluso: boolean; // Se true, valor soma ao pacote. Se false, é cobrado à parte.
  responsavelCondominio: ResponsavelPagamento; 
  
  custoIPTUIncluso: boolean; 
  responsavelIPTU: ResponsavelPagamento; 

  dataDisponibilidade: string; // ISO Date YYYY-MM-DD
  
  // === 7. Mídia e Publicidade ===
  fotos: string[]; // URLs das imagens
  linkVideoTour?: string;
  visitaVirtual360: boolean;

  // Configurações de visibilidade no portal
  publicidade: PublicidadeConfig;
}

// Tipo auxiliar para criação (Omitindo campos gerados pelo backend)
export type NovoImovelData = Omit<Imovel, 'id' | 'smartId' | 'proprietarioId' | 'latitude' | 'longitude'>;
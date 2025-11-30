/**
 * @fileoverview Definições de Tipos para a Entidade Imóvel.
 * Atualizado para padrão "Portal Imobiliário Completo".
 */

// --- ENUMS E TIPOS BÁSICOS ---

export type ImovelCategoria = 'Residencial' | 'Comercial' | 'Terrenos' | 'Rural' | 'Imóveis Especiais' | 'Outro';
export type ImovelFinalidade = 'Venda' | 'Locação Residencial' | 'Locação Comercial' | 'Locação Temporada' | 'Arrendamento Rural' | 'Permuta';
export type ResponsavelPagamento = 'PROPRIETARIO' | 'LOCATARIO' | 'NA_LOCACAO';

// --- SUB-ESTRUTURAS DE DADOS ---

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

export interface CondominioData {
    possuiCondominio: boolean;
    condominioCadastradoId?: string;
    nomeCondominio?: string;
    portaria24h?: boolean;
    areaLazer?: boolean;
    // Novos campos sugeridos
    numeroTorres?: number;
    elevador?: boolean;
}

export interface PiscinaPrivativaData {
    possuiPiscina: boolean;
    tipo?: 'VINIL' | 'AZULEJO' | 'FIBRA' | 'NATURAL' | 'PASTILHA' | 'CONCRETO' | 'AREIA_COMPACTADA' | 'PEDRA_NATURAL' | 'OUTRO';
    aquecida?: boolean;
}

// --- ESTRUTURAS DE CÔMODOS ---

export interface CozinhaData {
    tipo: string;
    nomeCustomizado?: string;
    possuiArmarios?: boolean;
    area?: number;
}

export interface SalaData {
    tipo: string;
    nomeCustomizado?: string;
    qtdAssentos?: number;
    area?: number;
}

export interface VarandaData {
    tipo: string;
    nomeCustomizado?: string;
    possuiChurrasqueira?: boolean;
    temFechamentoVidro?: boolean;
    area?: number;
}

export interface DispensaData {
    possuiDispensa: boolean;
    prateleirasEmbutidas?: boolean;
    area?: number;
}

export interface ConstrucaoExternaData {
    tipo: string;
    nomeCustomizado?: string;
    area: number;
    possuiBanheiro?: boolean;
}

export interface RegrasAnimaisData {
    permiteGatos: boolean;
    permiteCaes: boolean;
    outrosAnimais: boolean;
    descricaoOutros?: string;
    portePequeno: boolean;
    porteMedio: boolean;
    porteGrande: boolean;
}

// --- NOVAS ESTRUTURAS PARA DETALHAMENTO (Expandidas) ---

// 7. Informações sobre vagas
export interface DetalhesVagaData {
    tipoCobertura: 'COBERTA' | 'DESCOBERTA' | 'MISTA'; // Coberta / descoberta
    tipoManobra: 'LIVRE' | 'PRESA' | 'MISTA';          // Vaga livre / presa
    tipoUso: 'INDIVIDUAL' | 'COMPARTILHADA' | 'ROTATIVA'; // Individual / compartilhada
    demarcada: boolean;                                // Vaga demarcada?
    escriturada: boolean;                              // Escritura separada
    paralela: boolean;                                 // Vagas lado a lado ou fila indiana
}

// 9. Materiais e Acabamentos (Expandido)
export interface AcabamentoData {
    pisoSala: 'PORCELANATO' | 'LAMINADO' | 'TACO_MADEIRA' | 'TABUA_CORRIDA' | 'CERAMICA' | 'CIMENTO_QUEIMADO' | 'CARPETE' | 'MARDOME' | 'GRANITO' | 'OUTRO';
    pisoQuartos: 'PORCELANATO' | 'LAMINADO' | 'TACO_MADEIRA' | 'VINILICO' | 'CARPETE' | 'CERAMICA' | 'OUTRO';
    pisoCozinha: 'PORCELANATO' | 'CERAMICA' | 'GRANITO' | 'MARMORE' | 'CIMENTO_QUEIMADO' | 'OUTRO'; // Novo
    pisoBanheiros: 'PORCELANATO' | 'CERAMICA' | 'GRANITO' | 'MARMORE' | 'PASTILHA' | 'OUTRO'; // Novo
    teto: 'LAJE' | 'GESSO_REBAIXADO' | 'PVC' | 'MADEIRA' | 'APARENTE' | 'SANCAS';
    esquadrias?: 'ALUMINIO' | 'MADEIRA' | 'PVC' | 'FERRO' | 'BLINDEX'; // Novo
}

// 3. Informações Externas e Diferenciais
export interface CaracteristicasExternasData {
    posicaoSolar: 'NORTE' | 'SUL' | 'LESTE' | 'OESTE' | 'SOL_DA_MANHA' | 'SOL_DA_TARDE' | 'NAO_INFORMADO';
    posicaoImovel: 'FRENTE' | 'FUNDOS' | 'LATERAL' | 'INTERNO'; // Separado conforme pedido
    vista: 'LIVRE' | 'MAR' | 'MONTANHA' | 'JARDIM' | 'CIDADE' | 'INTERNA' | 'PAREDE';
    nivelBarulho: 'SILENCIOSO' | 'RUA_TRANQUILA' | 'MODERADO' | 'MOVIMENTADO'; // Barulho
    tipoRua: 'ASFALTADA' | 'PARALELEPIPEDO' | 'TERRA' | 'CASCALHO' | 'PLANA' | 'ACLIVE' | 'DECLIVE';
    deEsquina: boolean;
}

// 5. Documentação (Expandido)
export interface DocumentacaoData {
    possuiEscritura: boolean;      // Possui escritura?
    registroCartorio: boolean;     // Registro no Cartório?
    isentoIPTU: boolean;
    aceitaFinanciamento: boolean;  // Imóvel financiável?
    aceitaFGTS: boolean;           // Aceita FGTS?
    aceitaPermuta: boolean;        // Aceita permuta?
    situacaoLegal: 'REGULAR' | 'INVENTARIO' | 'USUFRUTO' | 'LEILAO' | 'ALIENADO' | 'OUTRO';
}

export interface SeguroData {
    tipo: 'INCENDIO' | 'FIANCA' | 'CONTEUDO' | 'OUTRO';
    valorMensal: number;
    pagoPor: 'PROPRIETARIO' | 'INQUILINO';
    obrigatorio: boolean;
    descricao?: string;
}

export interface PublicidadeConfig {
    publicadoRentou: boolean;
    publicadoPortaisExternos: boolean;
    mostrarEnderecoCompleto: boolean;
    mostrarNumero: boolean;
    statusPublicacao: 'RASCUNHO' | 'ATIVO' | 'PAUSADO' | 'VENDIDO' | 'ALUGADO';
}

// --- INTERFACE PRINCIPAL DO IMÓVEL ---

export interface Imovel {
  id: string;
  smartId: string; 
  proprietarioId: string;
  
  // === 1. Informações Básicas ===
  titulo: string;
  categoriaPrincipal: ImovelCategoria;
  tipoDetalhado: string;
  finalidades: ImovelFinalidade[]; 

  endereco: EnderecoImovel;
  condominio: CondominioData;
  infraestruturaCondominio?: string[]; 
  
  latitude?: number; 
  longitude?: number; 
  
  // === 2. Áreas e Topografia ===
  areaUtil: number;
  areaTotal: number;
  areaTerreno: number;
  
  dimensoesTerreno?: { 
      frente: number; // metros lineares
      fundos: number; // metros lineares
      lateralDireita: number;
      lateralEsquerda: number;
      topografia: 'PLANO' | 'ACLIVE' | 'DECLIVE' | 'IRREGULAR';
  };

  areaMediaQuartos?: number;
  areaMediaSuites?: number;
  areaTotalBanheiros?: number;
  areaExternaPrivativa?: number;
  areaQuintal?: number;
  
  // === 3. Detalhes Estruturais ===
  quartos: number;
  suites: number; 
  banheiros: number;
  lavabos: number; 
  banheirosServico: number; 
  
  vagasGaragem: number;
  detalhesVaga?: DetalhesVagaData; // Expandido

  andar?: number;
  totalAndaresNoPredio?: number; 
  unidadesPorAndar?: number;     
  elevadores?: number;           
  
  // RURAL
  possuiCasaSede?: boolean;

  piscinaPrivativa: PiscinaPrivativaData;
  
  // Arrays Dinâmicos
  cozinhas: CozinhaData[];
  salas: SalaData[];       
  varandas: VarandaData[]; 
  dispensa: DispensaData;
  construcoesExternas: ConstrucaoExternaData[];
  
  // === 4. Detalhes Qualitativos e Estado ===
  descricaoLonga: string;
  caracteristicas: string[]; 
  
  estadoConservacao: 'EM_CONSTRUCAO' | 'NOVO' | 'REFORMADO' | 'USADO' | 'NECESSITA_REFORMA'; // 4. Estado do Imóvel
  tipoConstrucao?: 'ALVENARIA' | 'STEEL_FRAME' | 'WOOD_FRAME' | 'DRYWALL' | 'MISTA'; // 9. Materiais

  acabamentos?: AcabamentoData; // Expandido
  dadosExternos?: CaracteristicasExternasData; // 3. Info Externas

  aceitaAnimais: boolean;
  detalhesAnimais?: RegrasAnimaisData;
  
  // === 5. Financeiro & Documentação ===
  status: 'VAGO' | 'ALUGADO' | 'ANUNCIADO' | 'MANUTENCAO';
  
  valorAluguel: number; 
  valorCondominio: number; 
  valorIPTU: number; 
  
  seguros: SeguroData[];
  documentacao?: DocumentacaoData; // 5. Documentação

  seguroIncendioObrigatorio: boolean;
  segurosOpcionais?: {
      fiancaLocaticia: boolean;
      danosEletricos: boolean;
      vendaval: boolean;
      conteudo: boolean;
  };

  custoCondominioIncluso: boolean;
  responsavelCondominio: ResponsavelPagamento; 
  custoIPTUIncluso: boolean; 
  responsavelIPTU: ResponsavelPagamento; 

  dataDisponibilidade: string;
  
  // === 6. Mídia ===
  fotos: string[];
  linkVideoTour?: string;
  visitaVirtual360: boolean;

  publicidade: PublicidadeConfig;
}

export type NovoImovelData = Omit<Imovel, 'id' | 'smartId' | 'proprietarioId' | 'latitude' | 'longitude'>;
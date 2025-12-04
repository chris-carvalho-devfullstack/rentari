import { EnderecoImovel } from './imovel';

// Tipos auxiliares
export type PortariaTipo = 'HUMANA_24H' | 'HUMANA_DIURNA' | 'REMOTA/VIRTUAL' | 'HIBRIDA' | 'SEM_PORTARIA';
export type PadraoAcabamento = 'LUXO' | 'ALTO_PADRAO' | 'MEDIO_PADRAO' | 'ECONOMICO' | 'POPULAR';
export type FaseObra = 'BREVE_LANCAMENTO' | 'LANCAMENTO' | 'EM_OBRA' | 'PRONTO_PARA_MORAR';

export interface ProgressoObra {
    geral: number;
    fundacao: number;
    estrutura: number;
    alvenaria: number;
    acabamento: number;
}

export interface Planta {
    titulo: string; // Ex: "Final 1 e 2 - 89m²"
    descricao?: string;
    dormitorios: number;
    areaPrivativa: number;
    imagemUrl: string;
}

export interface InfraestruturaCondominio {
    // Lazer & Bem-estar
    piscinaAdulto: boolean;
    piscinaInfantil: boolean;
    piscinaAquecida: boolean;
    piscinaRaia: boolean; // Para natação
    saunaSeca: boolean;
    saunaUmida: boolean;
    spaHidromassagem: boolean;
    academia: boolean;
    espacoPilates: boolean;
    quadraPoliesportiva: boolean;
    quadraTenis: boolean;
    quadraSquash: boolean;
    campoFutebol: boolean;
    playground: boolean;
    brinquedoteca: boolean;
    salaoJogos: boolean;
    
    // Social & Eventos
    salaoFestas: boolean; // Geral
    salaoFestasInfantil: boolean;
    espacoGourmet: boolean; // Com cozinha equipada
    churrasqueira: boolean;
    fornoPizza: boolean;
    cinema: boolean;
    homeOffice: boolean; // Coworking
    
    // Serviços & Conveniência
    mercadinho: boolean; // Market autônomo
    lavanderiaColetiva: boolean;
    carWash: boolean;
    espacoBeleza: boolean;
    petPlace: boolean; // Área externa
    petCare: boolean; // Área de banho/tosa
    bicicletario: boolean;
    hobbyBox: boolean; // Depósito privativo extra
    
    // Tecnologia & Sustentabilidade
    carregadorCarroEletrico: boolean;
    painelSolar: boolean; // Para áreas comuns
    reusoAgua: boolean;
    geradorAreaComum: boolean;
    geradorElevadores: boolean;
    geradorTotal: boolean; // Inclui apartamentos
    acessoFacial: boolean;
    fechaduraBiometrica: boolean;
}

export interface Condominio {
    id?: string;
    nome: string;
    cnpj?: string; 
    descricao?: string; // Descrição comercial do empreendimento
    
    // === 1. Localização ===
    endereco: EnderecoImovel;
    latitude?: number;
    longitude?: number;

    // === 2. DNA Construtivo ===
    construtora: string;
    incorporadora?: string;
    anoConstrucao: number;
    dataEntrega?: string; // Data prevista ou realizada
    padraoAcabamento: PadraoAcabamento;
    areaTerrenoTotal?: number; // m²
    
    // === 3. Lançamento & Obras (Dados Ricos) ===
    lancamento: boolean;
    faseObra?: FaseObra;
    progressoObra?: ProgressoObra;
    plantas?: Planta[]; // Plantas baixas disponíveis
    videoTour?: string; // Link vídeo institucional
    tourVirtual360?: string; // Link tour 360

    // === 4. Estrutura Física ===
    numeroTorres: number;
    numeroAndares: number;
    unidadesPorAndar: number;
    totalUnidades: number;
    elevadoresSociais: number;
    elevadoresServico: number;
    vagasVisitantes: number;

    // === 5. Infraestrutura ===
    infraestrutura: InfraestruturaCondominio;

    // === 6. Governança & Gestão ===
    tipoPortaria: PortariaTipo;
    administradora?: string;
    zelador?: string;
    telefoneZelador?: string;
    valorCondominioMedio?: number;
    
    // Regras Básicas
    permiteAnimais: boolean;
    diasMudanca: string;
    horarioMudanca: string;

    // === 7. Mídia ===
    fotos: string[]; // Fachada, áreas comuns
    capa: string;
}

export const defaultCondominioData: Omit<Condominio, 'id'> = {
    nome: '',
    cnpj: '',
    descricao: '',
    endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        complemento: ''
    },
    construtora: '',
    anoConstrucao: new Date().getFullYear(),
    padraoAcabamento: 'MEDIO_PADRAO',
    
    lancamento: false,
    faseObra: 'PRONTO_PARA_MORAR',
    progressoObra: { geral: 100, fundacao: 100, estrutura: 100, alvenaria: 100, acabamento: 100 },
    plantas: [],

    numeroTorres: 1,
    numeroAndares: 1,
    unidadesPorAndar: 4,
    totalUnidades: 4,
    elevadoresSociais: 1,
    elevadoresServico: 0,
    vagasVisitantes: 0,
    infraestrutura: {
        piscinaAdulto: false, piscinaInfantil: false, piscinaAquecida: false, piscinaRaia: false,
        saunaSeca: false, saunaUmida: false, spaHidromassagem: false, academia: false,
        espacoPilates: false, quadraPoliesportiva: false, quadraTenis: false, quadraSquash: false,
        campoFutebol: false, playground: false, brinquedoteca: false, salaoJogos: false,
        salaoFestas: false, salaoFestasInfantil: false, espacoGourmet: false, churrasqueira: false,
        fornoPizza: false, cinema: false, homeOffice: false, mercadinho: false,
        lavanderiaColetiva: false, carWash: false, espacoBeleza: false, petPlace: false,
        petCare: false, bicicletario: false, hobbyBox: false, carregadorCarroEletrico: false,
        painelSolar: false, reusoAgua: false, geradorAreaComum: false, geradorElevadores: false,
        geradorTotal: false, acessoFacial: false, fechaduraBiometrica: false
    },
    tipoPortaria: 'HUMANA_24H',
    permiteAnimais: true,
    diasMudanca: 'Segunda a Sexta',
    horarioMudanca: '08:00 às 17:00',
    fotos: [],
    capa: ''
};
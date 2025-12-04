import { EnderecoImovel } from './imovel';

// Tipos auxiliares
export type PortariaTipo = 'HUMANA_24H' | 'HUMANA_DIURNA' | 'REMOTA/VIRTUAL' | 'HIBRIDA' | 'SEM_PORTARIA';
export type PadraoAcabamento = 'LUXO' | 'ALTO_PADRAO' | 'MEDIO_PADRAO' | 'ECONOMICO' | 'POPULAR';

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
    cnpj?: string; // Opcional, pois pode ser um prédio antigo sem gestão formalizada
    
    // === 1. Localização ===
    endereco: EnderecoImovel;
    latitude?: number;
    longitude?: number;

    // === 2. DNA Construtivo ===
    construtora: string;
    incorporadora?: string; // As vezes difere da construtora
    anoConstrucao: number;
    dataEntrega?: string;
    padraoAcabamento: PadraoAcabamento;
    areaTerrenoTotal?: number; // m²
    lancamento: boolean; // Flag de lançamento

    // === 3. Estrutura Física ===
    numeroTorres: number;
    numeroAndares: number; // Média
    unidadesPorAndar: number; // Média
    totalUnidades: number;
    elevadoresSociais: number;
    elevadoresServico: number;
    vagasVisitantes: number;

    // === 4. Infraestrutura ===
    infraestrutura: InfraestruturaCondominio;

    // === 5. Governança & Gestão ===
    tipoPortaria: PortariaTipo;
    administradora?: string;
    zelador?: string;
    telefoneZelador?: string;
    valorCondominioMedio?: number; // Referência
    
    // Regras Básicas
    permiteAnimais: boolean;
    diasMudanca: string; // Ex: "Seg a Sex"
    horarioMudanca: string; // Ex: "08:00 as 17:00"

    // === 6. Mídia ===
    fotos: string[]; // Fachada, áreas comuns
    capa: string;
}

// Estado inicial para formulários
export const defaultCondominioData: Omit<Condominio, 'id'> = {
    nome: '',
    cnpj: '',
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
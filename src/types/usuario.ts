// src/types/usuario.ts

/**
 * Define a estrutura de endereço completo para fins contratuais.
 */
export interface EnderecoCompleto {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string; // UF
  cep: string;
}

/**
 * Qualificação completa de Pessoa Física (PF) para contratos.
 */
export interface QualificacaoPF {
  documentoTipo: 'PF';
  nomeCompleto: string;
  cpf: string;
  nacionalidade: string;
  estadoCivil: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
  regimeDeBens?: string;
  profissao: string;
  dataNascimento: string;
  rgNumero: string;
  rgOrgaoExpedidor: string;
  rgUF: string;
  endereco: EnderecoCompleto;
  conjuge?: {
    nomeCompleto: string;
    cpf: string;
    rg: string;
    regimeDeBens: string;
  }
}

/**
 * Qualificação completa de Pessoa Jurídica (PJ) para contratos.
 */
export interface QualificacaoPJ {
  documentoTipo: 'PJ';
  razaoSocial: string;
  cnpj: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  endereco: EnderecoCompleto;
  representante: {
    nomeCompleto: string;
    nacionalidade: string;
    estadoCivil: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
    profissao: string;
    rgNumero: string;
    rgOrgaoExpedidor: string;
    rgUF: string;
    cpf: string;
  }
  baseDeRepresentacao: string;
}

// --- NOVAS ESTRUTURAS PARA O PERFIL DE USUÁRIO E POIs ---

export interface PontoImportante {
    id: string;
    nome: string; // Ex: "Trabalho", "Escola das Crianças"
    endereco: string;
    latitude: number;
    longitude: number;
}

export type PerfilUsuario = 'PROPRIETARIO' | 'INQUILINO' | 'AMBOS';

/**
 * Define a estrutura de dados básica para um Usuário autenticado.
 */
export interface Usuario {
  id: string;
  email: string;
  nome: string;
  documentoIdentificacao?: string; 
  
  tipo: 'PROPRIETARIO' | 'CORRETOR' | 'ADMIN'; // Mantido para compatibilidade, mas o foco agora será 'perfil'
  
  // NOVO: Define se é Proprietário, Inquilino ou Ambos
  perfil: PerfilUsuario; 

  fotoUrl?: string; 
  cpf?: string; 
  telefone: string;
  handlePublico?: string;
  qualificacao?: QualificacaoPF | QualificacaoPJ;

  // NOVO: Lista de pontos importantes salvos (Máx 3)
  pontosImportantes?: PontoImportante[];

  dadosBancarios: {
    banco: string;
    agencia: string;
    conta: string;
    tipo: 'CORRENTE' | 'POUPANCA'; 
    pixTipo: 'EMAIL' | 'TELEFONE' | 'CPF_CNPJ' | 'ALEATORIA';
    pixChave: string;
  }
}

export type UpdateUserBasicData = Pick<Usuario, 'nome' | 'telefone' | 'fotoUrl'>;
export type UpdateUserDadosBancarios = Usuario['dadosBancarios'];
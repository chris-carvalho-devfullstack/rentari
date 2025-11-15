// src/types/usuario.ts

/**
 * Define a estrutura de endereço completo para fins contratuais.
 */
export interface EnderecoCompleto {
  logradouro: string;
  numero: string;
  complemento?: string; // Opcional
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
  regimeDeBens?: string; // Obrigatório se Casado(a) ou União Estável
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
  baseDeRepresentacao: string; // Ex: "Contrato Social / Estatuto / Procuração"
}


/**
 * Define a estrutura de dados básica para um Usuário autenticado.
 */
export interface Usuario {
  /** UID do usuário, geralmente fornecido pelo Firebase Auth */
  id: string;
  /** E-mail do usuário */
  email: string;
  /** Nome completo ou de exibição */
  nome: string;
  /** CPF ou CNPJ de acesso rápido (preenchido no cadastro ou na qualificação) */
  documentoIdentificacao?: string; 
  /** Tipo de perfil do usuário. 'PROPRIETARIO' acessa a plataforma 'Rentou'. */
  tipo: 'PROPRIETARIO' | 'CORRETOR' | 'ADMIN'; 
  
  // URL da foto de perfil no Firebase Storage
  fotoUrl?: string; 
  
  // Campos adicionados para o formulário de Perfil básico
  cpf?: string; // CPF/CNPJ de acesso rápido no formato limpo
  telefone: string;

  // NOVO CAMPO: QUALIFICAÇÃO LEGAL COMPLETA
  qualificacao?: QualificacaoPF | QualificacaoPJ;

  // === DADOS BANCÁRIOS E PIX (AGORA COM TIPO DE CONTA) ===
  dadosBancarios: {
    banco: string;
    agencia: string;
    conta: string;
    // NOVO: Tipo de Conta
    tipo: 'CORRENTE' | 'POUPANCA'; 
    pixTipo: 'EMAIL' | 'TELEFONE' | 'CPF_CNPJ' | 'ALEATORIA';
    pixChave: string;
  }
}

// Tipos auxiliares para funções de atualização
export type UpdateUserBasicData = Pick<Usuario, 'nome' | 'telefone' | 'fotoUrl'>;
export type UpdateUserDadosBancarios = Usuario['dadosBancarios'];
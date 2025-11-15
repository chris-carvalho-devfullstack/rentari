// src/types/usuario.ts

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
  /** Tipo de perfil do usuário. 'PROPRIETARIO' acessa a plataforma 'Rentou'. */
  tipo: 'PROPRIETARIO' | 'CORRETOR' | 'ADMIN'; 
  
  // NOVO: URL da foto de perfil no Firebase Storage
  fotoUrl?: string; 
  
  // NOVOS: Campos adicionados para o formulário de Perfil
  cpf: string;
  telefone: string;

  // === NOVO: DADOS BANCÁRIOS E PIX ===
  dadosBancarios: {
    banco: string;
    agencia: string;
    conta: string;
    pixTipo: 'EMAIL' | 'TELEFONE' | 'CPF_CNPJ' | 'ALEATORIA';
    pixChave: string;
  }
}
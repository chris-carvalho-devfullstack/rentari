// src/types/imovel.ts

/**
 * Define a estrutura de dados básica para um Imóvel na plataforma Rentou.
 */
export interface Imovel {
  /** Identificador único do imóvel */
  id: string;
  /** UID do proprietário associado ao imóvel */
  proprietarioId: string;
  /** Título/Nome de exibição do imóvel (ex: "Apartamento 201 - Centro") */
  titulo: string;
  /** Endereço completo ou resumido */
  endereco: string;
  /** Cidade onde o imóvel está localizado */
  cidade: string;
  /** Status atual do imóvel na plataforma */
  status: 'VAGO' | 'ALUGADO' | 'ANUNCIADO';
  /** Valor atual do aluguel mensal */
  valorAluguel: number;
}
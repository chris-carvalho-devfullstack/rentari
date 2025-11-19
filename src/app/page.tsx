// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import React from 'react'; 

/**
 * @fileoverview Página inicial (Landing Page) que serve como porta de entrada
 * para o Portal do Proprietário Rentou, com foco em Minimalismo e Proposta de Valor.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900 p-8">
      <main className="w-full max-w-xl text-center space-y-10 p-10 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl">
        
        {/* Logomarca Rentou (Prominente) */}
        <Image
          src="/media/rentou-logo.png" // <-- CORRIGIDO: Nome do arquivo atualizado
          alt="Rentou Logomarca"
          width={250} // Aumentado o tamanho
          height={75}
          priority
          className="mx-auto h-auto w-auto max-w-[200px] sm:max-w-[250px]" 
        />
        
        {/* Título e Proposta de Valor (Hero Text Impactante) */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-5xl">
            Sua Gestão de Imóveis, Simplificada.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Acesse o portal para gerenciar locações, acompanhar finanças e ter uma visão completa dos seus ativos em tempo real.
          </p>
        </div>

        {/* Botão de Ação Principal (CTA - Call To Action) - CORREÇÃO: FORÇA !text-white */}
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full sm:w-2/3 px-8 py-4 border border-transparent text-lg font-semibold rounded-lg !text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-xl transform hover:scale-[1.02]"
        >
          Acessar Portal do Proprietário
        </Link>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 pt-4">
            Gerencie seus ativos com inteligência e controle total.
        </p>
      </main>
    </div>
  );
}
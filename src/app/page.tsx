// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import React from 'react'; 

/**
 * @fileoverview Página inicial (Landing Page) que serve como porta de entrada
 * para o Portal do Proprietário Rentou, antes do login.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900 p-8">
      <main className="w-full max-w-lg text-center space-y-8 p-10 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl">
        
        {/* Logomarca Rentou (Usando a imagem correta, que não está vazia) */}
        <Image
          src="/media/Rentou logomarcca.png"
          alt="Rentou Logomarca"
          width={200}
          height={60}
          priority
          className="mx-auto" 
        />
        
        {/* Título e Descrição */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Portal do Proprietário
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Acesse sua área de gestão de locações, imóveis e finanças em tempo real.
          </p>
        </div>

        {/* Botão de Acesso/Login */}
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-rentou-primary hover:bg-blue-700 transition-colors shadow-lg"
        >
          Acessar Área do Proprietário
        </Link>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 pt-4">
            Gerencie seus ativos com inteligência.
        </p>
      </main>
    </div>
  );
}
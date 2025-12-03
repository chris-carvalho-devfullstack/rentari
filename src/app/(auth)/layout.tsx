// src/app/(auth)/layout.tsx

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarField } from '@/components/ui/StarField'; // <--- 1. IMPORTAR O COMPONENTE

/**
 * @fileoverview Layout para as rotas do grupo (auth) - Login, Cadastro.
 * ATUALIZADO: Com campo estelar discreto no modo Dark.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-black relative overflow-hidden">
      
      {/* === IMAGEM DE FUNDO (MODO CLARO) === */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[50vh] md:h-[60vh] bg-no-repeat bg-cover bg-bottom z-0 pointer-events-none dark:hidden" 
        style={{ 
          backgroundImage: 'url(/media/background-city-login-page-rentou.png)',
          maskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-60"></div>
      </div>

      {/* === IMAGEM DE FUNDO (MODO ESCURO) === */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[50vh] md:h-[60vh] bg-no-repeat bg-cover bg-bottom z-0 pointer-events-none hidden dark:block" 
        style={{ 
          backgroundImage: 'url(/media/background-city-login-page-rentou-dark-mode.png)',
          maskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
        }}
      >
        {/* Overlay ajustado para garantir que o texto brilhe no modo escuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-70"></div>
      </div>

      {/* === ESTRELAS (APENAS MODO ESCURO) === */}
      {/* 2. ADICIONAR O COMPONENTE AQUI COM A CLASSE HIDDEN DARK:BLOCK */}
      <div className="hidden dark:block absolute inset-0 z-0">
          <StarField />
      </div>

      {/* === HEADER (LOGO DINÂMICO) === */}
      <header className="absolute top-0 left-0 p-6 w-full flex justify-center sm:justify-start z-20">
        <Link href="/" className="relative w-32 h-12 cursor-pointer transition-transform hover:scale-105">
           <Image 
              src="/media/rentou-logo.png" 
              alt="Rentou Logo" 
              fill
              className="object-contain dark:hidden"
              priority
           />
           <Image 
              src="/media/rentou-logo-dark-mode.png" 
              alt="Rentou Logo Dark" 
              fill
              className="object-contain hidden dark:block"
              priority
           />
        </Link>
      </header>
      
      {/* === CONTEÚDO PRINCIPAL (CARD DE LOGIN) === */}
      <main className="flex-grow flex items-center justify-center w-full px-4 z-10 bg-transparent relative">
        {children}
      </main>

      {/* === FOOTER === */}
      <footer className="absolute bottom-4 w-full text-center p-2 text-xs font-medium text-white z-20">
        <p className="drop-shadow-md opacity-90 hover:opacity-100 transition-opacity">
          © {new Date().getFullYear()} Rentou. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
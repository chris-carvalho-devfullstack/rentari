// src/app/(auth)/layout.tsx

import React from 'react';

/**
 * @fileoverview Layout para as rotas do grupo (auth) - Login, Cadastro.
 * Layout minimalista.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black">
      <header className="absolute top-0 left-0 p-6">
        <div className="text-2xl font-extrabold text-blue-600">
            Rentou
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center w-full">
        {children}
      </main>

      <footer className="w-full text-center p-4 text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Rentari. Todos os direitos reservados.
      </footer>
    </div>
  );
}
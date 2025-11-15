// src/app/(auth)/login/layout.tsx
import React from 'react';

/**
 * @fileoverview Layout para o grupo de rotas (auth) (Login, Signup).
 * Ele centraliza o conteúdo e remove qualquer navegação para focar no formulário.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // A classe do div pode ser ajustada para incluir a imagem de fundo se você tiver uma.
    // Por exemplo: className="... bg-cover bg-bottom" style={{ backgroundImage: 'url(/cidade.svg)' }}
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* O conteúdo (LoginForm) será renderizado aqui, centralizado. */}
        {children}
      </div>
    </div>
  );
}
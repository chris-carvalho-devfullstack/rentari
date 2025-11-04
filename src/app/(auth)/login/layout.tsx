// src/app/(auth)/layout.tsx
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* O conteúdo (LoginForm) será renderizado aqui, centralizado. */}
        {children}
      </div>
    </div>
  );
}
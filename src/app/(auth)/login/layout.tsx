// src/app/(auth)/login/layout.tsx
import React from 'react';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // IMPORTANTE: Sem background color aqui. Apenas controle de largura e padding.
    // 'bg-transparent' ou nenhuma classe de cor garante que a imagem do layout pai seja vista.
    <div className="w-full max-w-md p-4 relative z-10">
      {children}
    </div>
  );
}
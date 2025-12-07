// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';

/**
 * Página Raiz de Fallback.
 * Serve como rede de segurança caso o Middleware não redirecione a raiz.
 * Evita telas brancas ou erro 404 em 'localhost:3000/' ou 'app.rentou.com.br/'.
 */
export default function RootPage() {
  const router = useRouter();
  // Obtemos o estado de autenticação do Zustand
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Garante que estamos executando no navegador
    if (typeof window !== 'undefined') {
      
      // Um pequeno delay (100ms) garante que o estado de hidratação (Zustand/Firebase)
      // tenha tempo de ser lido antes de decidir.
      const timer = setTimeout(() => {
          if (isAuthenticated && user) {
            router.replace('/dashboard');
          } else {
            router.replace('/login');
          }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, router]);

  // Interface de carregamento enquanto o redirecionamento acontece
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner de Carregamento */}
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        <span className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">
          Redirecionando...
        </span>
      </div>
    </div>
  );
}
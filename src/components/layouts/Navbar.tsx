// src/components/layouts/Navbar.tsx
'use client';

import { useAuthStore } from '@/hooks/useAuthStore';
import { Icon } from '@/components/ui/Icon'; // Importar Icon Componente
import { faBell } from '@fortawesome/free-solid-svg-icons'; // Importar ícone de sino

/**
 * @fileoverview Barra de navegação superior (Navbar) para o Portal Rentou.
 * Agora utiliza ícones Font Awesome.
 */
export default function Navbar() {
  const { user } = useAuthStore();
  const userName = user?.nome || 'Usuário';

  return (
    <header className="flex justify-between items-center h-16 px-6 bg-white dark:bg-zinc-800 shadow-md border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10 w-full">
      {/* Área para título ou breadcrumbs */}
      <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Portal Proprietário
      </div>

      {/* Perfil e Ações */}
      <div className="flex items-center space-x-4">
        <button 
            title="Notificações"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
        >
          {/* Ícone de Notificações */}
          <Icon icon={faBell} className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userName[0]}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
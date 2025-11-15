// src/components/layouts/UserDropdown.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Icon } from '@/components/ui/Icon';
import { faUserEdit, faCog, faSignOutAlt, faIdCard, faEnvelope } from '@fortawesome/free-solid-svg-icons';

/**
 * Componente Dropdown de Perfil (Top Menu).
 * Exibe as informações do usuário e o menu de navegação do perfil/logout.
 */
export default function UserDropdown() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = user?.nome || 'Usuário';
  const userEmail = user?.email || 'email@rentou.com';
  const userHandle = '@proprietario'; // Simulação de um handle/username

  // Função para fechar o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const MenuItem: React.FC<{ href: string; icon: any; text: string; onClick?: () => void }> = ({ href, icon, text, onClick }) => (
    <li>
      {onClick ? (
        <button
          onClick={onClick}
          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <Icon icon={icon} className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          {text}
        </button>
      ) : (
        <Link 
          href={href}
          onClick={() => setIsOpen(false)} // Fecha ao navegar
          className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <Icon icon={icon} className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          {text}
        </Link>
      )}
    </li>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Toggle do Perfil */}
      <div 
        className="flex items-center space-x-2 cursor-pointer group p-1 pr-0 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Foto Miniatura (usando iniciais como placeholder) */}
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {userName[0]}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block pr-3">
          {userName}
        </span>
      </div>

      {/* Dropdown Menu (Menu Flutuante) */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl z-50 border border-gray-100 dark:border-zinc-700 transform origin-top-right animate-in fade-in zoom-in-95">
          
          {/* Seção de Informações do Usuário (CABEÇALHO AZUL - Replicando o Print) */}
          <div className="p-4 bg-rentou-primary dark:bg-blue-900 rounded-t-xl text-white">
            <div className="flex items-center space-x-4">
              {/* Foto de Perfil Grande */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl font-bold text-rentou-primary">
                {userName[0]}
              </div>
              <div className='flex flex-col'>
                <p className="font-semibold">{userName}</p>
                <p className="text-xs opacity-80">{userEmail}</p>
                <p className="text-xs opacity-70 mt-1">{userHandle}</p>
              </div>
            </div>
          </div>

          {/* Lista de Navegação */}
          <ul className="p-2 space-y-1">
            <MenuItem 
              href="/perfil" // Link para a nova página de perfil
              icon={faIdCard} // Ícone de perfil/documento
              text="Ver Meu Perfil"
            />
            <MenuItem 
              href="/perfil/editar" 
              icon={faUserEdit} 
              text="Editar Perfil"
            />
            <MenuItem 
              href="/configuracoes" 
              icon={faCog} 
              text="Configurações"
            />
          </ul>
          
          {/* Opção Sair (Separador e Logout) */}
          <div className="p-2 border-t border-gray-100 dark:border-zinc-700">
             <MenuItem 
              href="/" // O href é um fallback, o onClick é o principal
              icon={faSignOutAlt} 
              text="Sair"
              onClick={handleLogout}
            />
          </div>

        </div>
      )}
    </div>
  );
}
// src/components/layouts/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname, useRouter } from 'next/navigation'; 
import { useAuthStore } from '@/hooks/useAuthStore'; 
import { Icon } from '@/components/ui/Icon'; 
// Ícones atualizados: Adicionado faUserShield
import { faTachometerAlt, faBuilding, faWallet, faSignOutAlt, faUser, faGlobe, faUserShield } from '@fortawesome/free-solid-svg-icons'; 

// Definição dos links de navegação com ícones
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: faTachometerAlt },
  { name: 'Imóveis', href: '/imoveis', icon: faBuilding },
  // NOVO: Link para o Portal de Anúncios Público (Visão do Cliente)
  { name: 'Ver Anúncios Públicos', href: '/anuncios', icon: faGlobe }, 
  { name: 'Financeiro', href: '/financeiro', icon: faWallet },
  // Perfil do Proprietário
  { name: 'Meu Perfil', href: '/perfil', icon: faUser }, 
];

// Componente de Item da Sidebar
const SidebarItem: React.FC<{ href: string; name: string; isActive: boolean; icon: any }> = (props) => {
  const { href, name, isActive, icon } = props; 

  const baseClasses =
    'flex items-center p-3 rounded-lg transition-colors duration-200 group';
  // Item ATIVO
  const activeClasses = 'bg-blue-100 text-rentou-primary border border-rentou-primary shadow-inner'; 
  // Item INATIVO
  const inactiveClasses =
    'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <Icon icon={icon} className="w-5 h-5 mr-3" />
      <span className="font-medium">{name}</span>
    </Link>
  );
};

/**
 * @fileoverview Barra lateral de navegação (Sidebar) para o Portal Rentou.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); 
  // Obtemos também o 'user' para verificar o tipo de permissão
  const { logout, user } = useAuthStore(); 

  // FUNÇÃO DE LOGOUT COMPLETA E FUNCIONAL
  const handleLogout = async () => {
    await logout(); // Dispara o logout (Firebase e limpeza de cookie)
    router.push('/'); 
  };

  // Funções de verificação de rota ativa
  const isLinkActive = (href: string) => {
      // Regra especial para a raiz do Imóveis
      if (href === '/imoveis' && pathname.startsWith('/imoveis')) {
          return true;
      }
      // Se a rota for o link direto para o catálogo
      if (href === '/anuncios' && pathname.startsWith('/anuncios')) {
          return true;
      }
      // Regra para Dashboard, Financeiro, Perfil e Admin
       return pathname.startsWith(href) && href !== '/imoveis'; 
  }


  return (
    // Sidebar: w-64, bg-white no modo claro (padrão)
    <div className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-zinc-800 shadow-xl z-20 flex flex-col border-r border-gray-200 dark:border-zinc-700">
      {/* Logomarca */}
      <div className="p-4 h-16 flex items-center justify-center border-b border-gray-200 dark:border-zinc-700">
        <Link href="/dashboard" className="w-full h-full flex items-center justify-center relative">
          <Image
            src="/media/rentou-logo.png" 
            alt="Rentou Logomarca"
            fill 
            priority 
            className="object-contain" 
          />
        </Link>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            name={item.name}
            icon={item.icon} 
            isActive={isLinkActive(item.href)}
          />
        ))}

        {/* ITEM EXCLUSIVO DE ADMIN */}
        {user?.tipo === 'ADMIN' && (
            <>
                <div className="my-2 border-t border-gray-200 dark:border-zinc-700"></div>
                <SidebarItem 
                    href="/admin"
                    name="Super Admin"
                    icon={faUserShield}
                    isActive={isLinkActive('/admin')}
                />
            </>
        )}
      </nav>

      {/* Rodapé/Sair (Logout Funcional e Estilizado) */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
        <button 
            onClick={handleLogout}
            title="Sair do Portal do Proprietário e encerrar a sessão."
            className="w-full text-left p-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-700 transition-colors duration-200 font-medium flex items-center cursor-pointer" 
        >
            {/* Ícone de Log Out (Font Awesome) */}
            <Icon icon={faSignOutAlt} className="w-5 h-5 mr-3" />
            Sair
        </button>
      </div>
    </div>
  );
}
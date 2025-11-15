// src/components/layouts/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname, useRouter } from 'next/navigation'; 
import { useAuthStore } from '@/hooks/useAuthStore'; 
import { Icon } from '@/components/ui/Icon'; 
import { faTachometerAlt, faBuilding, faWallet, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; 

// Definição dos links de navegação com ícones
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: faTachometerAlt },
  { name: 'Imóveis', href: '/imoveis', icon: faBuilding },
  { name: 'Financeiro', href: '/financeiro', icon: faWallet },
];

const SidebarItem: React.FC<{ href: string; name: string; isActive: boolean; icon: any }> = ({
  href,
  name,
  isActive,
  icon,
}) => {
  const baseClasses =
    'flex items-center p-3 rounded-lg transition-colors duration-200 group';
  // CORREÇÃO CRÍTICA: Item ATIVO (Selecionado) usa fundo claro (bg-blue-100), texto da cor primária e borda.
  const activeClasses = 'bg-blue-100 text-rentou-primary border border-rentou-primary shadow-inner'; 
  
  // O estado inativo mantém o texto escuro no modo claro, o que já está correto.
  const inactiveClasses =
    'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {/* Usando o componente Icon do Font Awesome */}
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
  const { logout } = useAuthStore(); 

  // FUNÇÃO DE LOGOUT COMPLETA E FUNCIONAL
  const handleLogout = async () => {
    await logout(); // Dispara o logout (Firebase e limpeza de cookie)
    // ALTERAÇÃO AQUI: Redireciona para a Landing Page (/) em vez de /login
    router.push('/'); 
  };

  return (
    // Sidebar: w-64, bg-white no modo claro (padrão)
    <div className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-zinc-800 shadow-xl z-20 flex flex-col border-r border-gray-200 dark:border-zinc-700">
      {/* Logomarca */}
      <div className="p-4 h-16 flex items-center justify-center border-b border-gray-200 dark:border-zinc-700">
        {/* CORREÇÃO: Adicionado 'relative' ao Link e 'fill' no Image para preencher o container */}
        <Link href="/dashboard" className="w-full h-full flex items-center justify-center relative">
          <Image
            src="/media/Rentou logomarcca.png"
            alt="Rentou Logomarca"
            fill // Define que a imagem deve preencher as dimensões do pai
            priority 
            // object-contain é ideal para logos, pois maximiza o tamanho sem cortar
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
            icon={item.icon} // Passando o ícone
            // Verifica se a rota atual começa com o href (para incluir sub-rotas)
            isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
          />
        ))}
      </nav>

      {/* Rodapé/Sair (Logout Funcional e Estilizado) */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
        <button 
            onClick={handleLogout}
            title="Sair do Portal do Proprietário e encerrar a sessão." // Adicionado o title para o tooltip
            className="w-full text-left p-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-700 transition-colors duration-200 font-medium flex items-center cursor-pointer" // Adicionado cursor-pointer
        >
            {/* Ícone de Log Out (Font Awesome) */}
            <Icon icon={faSignOutAlt} className="w-5 h-5 mr-3" />
            Sair
        </button>
      </div>
    </div>
  );
}
// src/components/layouts/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname } from 'next/navigation';

// Definição dos links de navegação
const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Imóveis', href: '/imoveis' },
  { name: 'Financeiro', href: '/financeiro' },
];

const SidebarItem: React.FC<{ href: string; name: string; isActive: boolean }> = ({
  href,
  name,
  isActive,
}) => {
  const baseClasses =
    'flex items-center p-3 rounded-lg transition-colors duration-200 group';
  const activeClasses = 'bg-rentou-primary text-white shadow-lg';
  // CORREÇÃO FORÇADA: Usa !text-black no modo padrão para garantir contraste.
  const inactiveClasses =
    '!text-black dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {/* Ícone placeholder simples (opcional, pode ser substituído por ícones reais como Lucide ou Heroicons) */}
      <span className="w-5 h-5 mr-3 flex items-center justify-center">
        {name[0]}
      </span>
      <span className="font-medium">{name}</span>
    </Link>
  );
};

/**
 * @fileoverview Barra lateral de navegação (Sidebar) para o Portal Rentou.
 */
export default function Sidebar() {
  const pathname = usePathname();

  return (
    // Sidebar: w-64, bg-white no modo claro (padrão)
    <div className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-zinc-800 shadow-xl z-20 flex flex-col border-r border-gray-200 dark:border-zinc-700">
      {/* Logomarca */}
      <div className="p-4 h-16 flex items-center justify-center border-b border-gray-200 dark:border-zinc-700">
        <Link href="/dashboard" className="w-full h-full flex items-center justify-center">
          <Image
            src="/media/Rentou logomarcca.png"
            alt="Rentou Logomarca"
            width={120} 
            height={40} 
            priority 
            className="h-full w-auto object-contain" 
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
            // Verifica se a rota atual começa com o href (para incluir sub-rotas)
            isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
          />
        ))}
      </nav>

      {/* Rodapé/Sair (Placeholder) */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
        <button 
            onClick={() => console.log('Simulação de Logout')}
            className="w-full text-left p-3 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-zinc-700 transition-colors duration-200 font-medium"
        >
            Sair
        </button>
      </div>
    </div>
  );
}
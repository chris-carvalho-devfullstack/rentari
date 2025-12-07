// src/components/layouts/PublicNavbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { 
  Menu, X, User, ChevronRight, LogIn, ChevronDown, 
  LayoutDashboard, Home, UserCircle, LogOut 
} from 'lucide-react';

export default function PublicNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Buscar Imóveis', href: '/anuncios' },
    { label: 'Para Proprietários', href: '/proprietario' },
    { label: 'Sobre Nós', href: '/sobre' },
  ];

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    if (logout) logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const getUserRoleLabel = () => {
    if (!user?.tipo) return 'Usuário';
    return user.tipo === 'PROPRIETARIO' ? 'Proprietário' : 'Inquilino';
  };

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-gray-200 shadow-sm' 
          : 'bg-white border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* --- 1. LOGO RENTOU --- */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-32 h-10">
                <Image 
                  src="/media/rentou-logo.png" 
                  alt="Rentou Logo" 
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* --- 2. MENU DESKTOP CENTRAL --- */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-all duration-200 relative group py-2 ${
                  isActive(link.href) ? 'text-[#193f65]' : 'text-gray-600 hover:text-[#193f65]'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#193f65] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${isActive(link.href) ? 'scale-x-100' : ''}`}></span>
              </Link>
            ))}
          </nav>

          {/* --- 3. AÇÕES --- */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/proprietario/anunciar" 
              className="text-sm font-bold text-gray-700 hover:text-[#193f65] px-4 py-2 rounded-full hover:bg-gray-50 transition flex items-center gap-2"
            >
              Anunciar Imóvel
            </Link>

            <div className="h-6 w-px bg-gray-200"></div>

            {user ? (
              // --- MENU DO USUÁRIO (DROPDOWN) ---
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition group ${
                    isUserMenuOpen 
                      ? 'border-[#193f65]/30 bg-[#193f65]/5 shadow-sm' 
                      : 'border-gray-200 hover:border-[#193f65]/30 hover:shadow-md bg-white'
                  }`}
                >
                  {/* Avatar Pequeno */}
                  <div className="w-8 h-8 rounded-full border border-gray-100 overflow-hidden relative bg-gray-50 flex-shrink-0">
                    {user.fotoUrl ? (
                       <Image src={user.fotoUrl} alt="Avatar" fill className="object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-[#193f65]/10 text-[#193f65] font-bold text-xs">
                          {user.nome?.charAt(0) || 'U'}
                       </div>
                    )}
                  </div>
                  {/* NOME DO USUÁRIO NA NAVBAR (Cor Ajustada) */}
                  <span className="text-sm font-bold text-[#193f65] max-w-[100px] truncate">
                    {user.nome ? user.nome.split(' ')[0] : 'Conta'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#193f65] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Submenu Suspenso */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right z-50 ring-1 ring-black ring-opacity-5">
                    
                    {/* CABEÇALHO DO DROPDOWN (COR #193f65) */}
                    <div className="px-6 py-5 bg-[#193f65] text-white relative overflow-hidden">
                        {/* Efeito de fundo sutil */}
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            {/* Avatar Grande */}
                            <div className="w-12 h-12 rounded-full border-2 border-white/30 bg-white/20 flex-shrink-0 overflow-hidden relative flex items-center justify-center">
                                {user.fotoUrl ? (
                                    <Image src={user.fotoUrl} alt="Profile" fill className="object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-white/90" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate leading-tight">Olá, {user.nome?.split(' ')[0]}</p>
                                <p className="text-xs text-blue-100 truncate opacity-90">{user.email}</p>
                                {/* Badge de Função */}
                                <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 border border-white/20 uppercase tracking-wide">
                                    {getUserRoleLabel()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="py-2">
                      <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                        <div className="p-1.5 bg-[#193f65]/10 text-[#193f65] rounded-lg group-hover:bg-[#193f65]/20 transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> 
                        </div>
                        <span className="font-medium group-hover:text-[#193f65]">Meu Painel</span>
                      </Link>
                      <Link href="/meu-espaco" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                        <div className="p-1.5 bg-[#193f65]/10 text-[#193f65] rounded-lg group-hover:bg-[#193f65]/20 transition-colors">
                            <Home className="w-4 h-4" /> 
                        </div>
                        <span className="font-medium group-hover:text-[#193f65]">Meu Espaço</span>
                      </Link>
                      <Link href="/perfil" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                        <div className="p-1.5 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-200 transition-colors">
                            <UserCircle className="w-4 h-4" /> 
                        </div>
                        <span className="font-medium group-hover:text-gray-900">Minha Conta</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 mt-1 py-2 bg-gray-50">
                      <button 
                        onClick={handleLogout} 
                        className="flex w-full items-center gap-2 px-6 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // --- ESTADO NÃO LOGADO ---
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-[#193f65] transition px-3 py-2"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#193f65] hover:bg-[#153454] text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-md shadow-blue-900/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  Cadastre-se
                </Link>
              </div>
            )}
          </div>

          {/* --- 4. BOTÃO MOBILE --- */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-[#193f65] transition"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- 5. MENU MOBILE (DRAWER) --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full h-screen overflow-y-auto pb-32">
          
          {/* HEADER MOBILE USUÁRIO (COR #193f65) */}
          {user && (
             <div className="bg-[#193f65] p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white/30 bg-white/20 overflow-hidden relative flex items-center justify-center">
                        {user.fotoUrl ? (
                            <Image src={user.fotoUrl} alt="Profile" fill className="object-cover" />
                        ) : (
                            <span className="font-bold text-lg">{user.nome?.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-lg leading-tight">{user.nome}</p>
                        <p className="text-xs text-blue-100">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-black/20">{getUserRoleLabel()}</span>
                    </div>
                </div>
             </div>
          )}

          <div className="px-4 py-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-4 rounded-xl text-base font-semibold ${
                  isActive(link.href)
                    ? 'bg-[#193f65]/5 text-[#193f65]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
                <ChevronRight className={`w-5 h-5 ${isActive(link.href) ? 'text-[#193f65]' : 'text-gray-300'}`} />
              </Link>
            ))}
            
            <hr className="border-gray-100 my-4" />
            
            {user ? (
              <div className="space-y-1">
                 <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-700 font-medium hover:bg-gray-100">
                    <LayoutDashboard className="w-5 h-5 text-[#193f65]" /> Meu Painel
                 </Link>
                 <Link href="/meu-espaco" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-700 font-medium hover:bg-gray-100">
                    <Home className="w-5 h-5 text-[#193f65]" /> Meu Espaço
                 </Link>
                 <Link href="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-700 font-medium hover:bg-gray-100">
                    <UserCircle className="w-5 h-5 text-gray-500" /> Minha Conta
                 </Link>
                 
                 <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-600 font-medium border border-red-100 hover:bg-red-50 cursor-pointer mt-2">
                    <LogOut className="w-5 h-5" /> Sair da conta
                 </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50"
                >
                  <LogIn className="w-5 h-5" /> Entrar
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center bg-[#193f65] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#153454]"
                >
                  Criar Conta Grátis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
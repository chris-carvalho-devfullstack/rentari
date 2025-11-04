// src/proxy.ts (CÓDIGO CORRIGIDO)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Define as rotas que exigem autenticação.
 * NOTE: As rotas protegidas começam com o nome do grupo **na pasta**, mas não na URL pública.
 */
const PROTECTED_ROUTE_PREFIX = '/(rentou)'; 
const LOGIN_URL = '/login'; 
const DASHBOARD_URL = '/dashboard'; 
// Rotas de autenticação (sem parênteses na URL)
const AUTH_ROUTES = ['/login', '/signup']; 


export default function proxy(request: NextRequest) {
  const authToken = request.cookies.get('rentou-auth-token')?.value;

  // O pathname é a URL sem o grupo de rotas
  const pathname = request.nextUrl.pathname;
  
  // A verificação de rota protegida AINDA PRECISA do prefixo de pasta (para saber que é protegida)
  const isProtectedRoute = pathname.startsWith(DASHBOARD_URL) || pathname.startsWith('/imoveis') || pathname.startsWith('/financeiro');

  // Verifica se a URL ATUAL é uma rota de autenticação (sem parênteses)
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));

  // --- Lógica de Controle de Acesso ---

  // Caso 1: Usuário NÃO AUTENTICADO e tentando acessar uma rota PROTEGIDA
  if (isProtectedRoute && !authToken) {
    const url = new URL(LOGIN_URL, request.url);
    url.searchParams.set('from', pathname); 
    
    return NextResponse.redirect(url);
  }

  // Caso 2: Usuário AUTENTICADO e tentando acessar uma rota de AUTENTICAÇÃO (Login/Cadastro)
  if (isAuthRoute && authToken) {
    return NextResponse.redirect(new URL(DASHBOARD_URL, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|.*\\..*).*)',
  ],
};
// chris-carvalho-devfullstack/rentari/rentari-a5095e5f0efc1e543757fa8dd87a73cb94b50b98/src/proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_URL = '/dashboard'; 
const LOGIN_URL = '/login'; 

// Domínios de referência
const APP_DOMAIN = 'app.rentou.com.br';

/**
 * Middleware para controle de acesso ao Portal do Proprietário (app.rentou.com.br).
 * A proteção é baseada na URL e no token de autenticação (cookie).
 */
export default function proxy(request: NextRequest) {
  const authToken = request.cookies.get('rentou-auth-token')?.value;
  const url = request.nextUrl;
  const hostname = url.hostname;
  const pathname = url.pathname;

  // 1. Verifica se está no domínio PROTEGIDO (app.rentou.com.br)
  const isAppDomain = hostname === APP_DOMAIN;
  
  // As rotas de autenticação (login, signup)
  const isAuthRoute = pathname === LOGIN_URL || pathname === '/signup'; 
  
  // CORREÇÃO: Define que a rota raiz (/) e qualquer rota que não seja Auth são protegidas
  const isProtectedRoute = !isAuthRoute;

  if (isAppDomain) {
    // 1.1. Usuário NÃO AUTENTICADO e tentando acessar uma rota PROTEGIDA OU A RAIZ (/)
    if (!authToken && isProtectedRoute || (pathname === '/' && !authToken)) {
      // Redireciona para o login do subdomínio
      const redirectUrl = new URL(LOGIN_URL, url.origin);
      redirectUrl.searchParams.set('from', pathname); 
      return NextResponse.redirect(redirectUrl);
    }

    // 1.2. Usuário AUTENTICADO e tentando acessar uma rota de AUTENTICAÇÃO (Login/Cadastro)
    if (authToken && isAuthRoute) {
      // Redireciona para o dashboard do subdomínio
      return NextResponse.redirect(new URL(DASHBOARD_URL, url.origin));
    }
  }

  // 2. Comportamento para o domínio público (www.rentou.com.br)
  // Permite acesso irrestrito.
  
  return NextResponse.next();
}

export const config = {
  // O matcher precisa ser amplo para pegar todos os caminhos, exceto os assets estáticos.
  matcher: [
    // Nota: O matcher pega TUDO, incluindo / e /anuncios.
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|media|.*\\..*).*)',
  ],
};
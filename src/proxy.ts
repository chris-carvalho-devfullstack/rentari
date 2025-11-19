// chris-carvalho-devfullstack/rentari/rentari-a5095e5f0efc1e543757fa8dd87a73cb94b50b98/src/proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_URL = '/dashboard'; 
const LOGIN_URL = '/login'; 

// Domínios de referência
const APP_DOMAIN = 'app.rentou.com.br';

/**
 * Middleware para controle de acesso ao Portal do Proprietário (app.rentou.com.br).
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
  
  // As rotas que são internas ao portal de gestão e não são autenticação
  const isProtectedPath = pathname.startsWith(DASHBOARD_URL) || 
                          pathname.startsWith('/imoveis') || 
                          pathname.startsWith('/perfil') ||
                          pathname.startsWith('/financeiro');

  if (isAppDomain) {
    
    // CASO 1: Usuário AUTENTICADO acessando a RAIZ (/) OU uma rota de AUTENTICAÇÃO
    if (authToken && (pathname === '/' || isAuthRoute)) {
      // Redireciona para o dashboard
      return NextResponse.redirect(new URL(DASHBOARD_URL, url.origin));
    }
    
    // CASO 2: Usuário NÃO AUTENTICADO acessando a RAIZ (/) OU uma rota PROTEGIDA
    // O '/' (raiz) será tratado aqui se o usuário não tiver o token
    if (!authToken && (pathname === '/' || isProtectedPath)) {
      // Redireciona para o login
      const redirectUrl = new URL(LOGIN_URL, url.origin);
      // Mantém a origem da rota que o usuário tentou acessar, a menos que seja a raiz
      if(pathname !== '/') {
        redirectUrl.searchParams.set('from', pathname); 
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Comportamento para o domínio público (www.rentou.com.br)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // O matcher deve continuar amplo
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|media|.*\\..*).*)',
  ],
};
// chris-carvalho-devfullstack/rentari/rentari-a5095e5f0efc1e543757fa8dd87a73cb94b50b98/src/proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PATH = '/dashboard'; 
const LOGIN_PATH = '/login'; 
const APP_DOMAIN = 'app.rentou.com.br';

export default function proxy(request: NextRequest) {
  const authToken = request.cookies.get('rentou-auth-token')?.value;
  const url = request.nextUrl;
  const hostname = url.hostname;
  const pathname = url.pathname;

  const isAppDomain = hostname === APP_DOMAIN;
  
  // Rotas de autenticação (login, signup)
  const isAuthRoute = pathname === LOGIN_PATH || pathname === '/signup'; 
  
  // Rotas protegidas (todas que não são login/signup/API)
  const isProtectedPath = pathname.startsWith(DASHBOARD_PATH) || 
                          pathname.startsWith('/imoveis') || 
                          pathname.startsWith('/perfil') ||
                          pathname.startsWith('/financeiro');

  if (isAppDomain) {
    
    // CASO A: Acesso à RAIZ (/)
    if (pathname === '/') {
      if (authToken) {
        // Logado acessando raiz -> Dashboard
        return NextResponse.redirect(new URL(DASHBOARD_PATH, url.origin));
      } else {
        // Deslogado acessando raiz -> Login
        return NextResponse.redirect(new URL(LOGIN_PATH, url.origin));
      }
    }
    
    // CASO B: Usuário AUTENTICADO acessando uma ROTA DE AUTENTICAÇÃO (/login, /signup)
    if (authToken && isAuthRoute) {
      // Redireciona logado para o Dashboard
      return NextResponse.redirect(new URL(DASHBOARD_PATH, url.origin));
    }
    
    // CASO C: Usuário NÃO AUTENTICADO acessando uma ROTA PROTEGIDA
    if (!authToken && isProtectedPath) {
      // Redireciona deslogado para o Login
      const redirectUrl = new URL(LOGIN_PATH, url.origin);
      redirectUrl.searchParams.set('from', pathname); 
      return NextResponse.redirect(redirectUrl);
    }
    
    // Se não for nenhum dos casos acima (ex: uma rota estática pública), Next.next()
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|media|.*\\..*).*)',
  ],
};
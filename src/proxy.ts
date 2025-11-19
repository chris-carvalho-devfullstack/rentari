// chris-carvalho-devfullstack/rentari/rentari-main/src/proxy.ts

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
  
  // Rotas de autenticação (login, signup) - Usam o grupo (auth)
  const isAuthRoute = pathname === LOGIN_PATH || pathname === '/signup'; 
  
  // Rotas protegidas (todas que não são login/signup/API) - Usam o grupo (rentou)
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
    
    // NOVO CASO D (FIX): Re-escreve rotas protegidas (como /dashboard) para o caminho do arquivo no disco
    // O Next.js permite usar a convenção de pastas (grupo)/path em rewrites internos.
    if (pathname.startsWith('/')) { 
      if (isProtectedPath) {
          // Ex: /dashboard -> /rentou/dashboard (mapeando para a pasta física /src/app/(rentou))
          return NextResponse.rewrite(new URL(`/rentou${pathname}`, url.origin));
      }
      if (isAuthRoute) {
           // Ex: /login -> /auth/login (mapeando para a pasta física /src/app/(auth))
          return NextResponse.rewrite(new URL(`/auth${pathname}`, url.origin));
      }
    }
    
    // Se for uma rota que já está no domínio (ex: /anuncios) ou não é protegida, deixa passar.
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // ... (código mantido)
  ],
};
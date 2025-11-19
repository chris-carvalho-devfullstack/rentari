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
  let pathname = url.pathname; // Usamos 'let' para permitir modificação no Caso A

  const isAppDomain = hostname === APP_DOMAIN;
  
  // Rotas de autenticação (login, signup) - Usam o grupo (auth)
  const isAuthRoute = pathname === LOGIN_PATH || pathname === '/signup'; 
  
  // Rotas protegidas (todas que não são login/signup/API) - Usam o grupo (rentou)
  const isProtectedPath = pathname.startsWith(DASHBOARD_PATH) || 
                          pathname.startsWith('/imoveis') || 
                          pathname.startsWith('/perfil') ||
                          pathname.startsWith('/financeiro');

  if (isAppDomain) {
    
    // CASO A (CORREÇÃO FINAL): Acesso à RAIZ (/) OU a ROTA PROBLEMÁTICA "/rentou"
    // Nesses casos, definimos o pathname interno desejado (Dashboard ou Login) e 
    // permitimos que o código siga para o rewrite no final, sem redirecionar.
    if (pathname === '/' || pathname === '/rentou') {
      pathname = authToken ? DASHBOARD_PATH : LOGIN_PATH;
      url.pathname = pathname; // Atualiza a URL para ser usada no rewrite final
    }
    
    // CASO B: Usuário AUTENTICADO acessando uma ROTA DE AUTENTICAÇÃO (/login, /signup)
    if (authToken && isAuthRoute) {
      // Redireciona logado para o Dashboard (Redirecionamento externo, pois a URL deve mudar)
      return NextResponse.redirect(new URL(DASHBOARD_PATH, url.origin));
    }
    
    // CASO C: Usuário NÃO AUTENTICADO acessando uma ROTA PROTEGIDA
    if (!authToken && isProtectedPath) {
      // Redireciona deslogado para o Login (Redirecionamento externo, pois a URL deve mudar)
      const redirectUrl = new URL(LOGIN_PATH, url.origin);
      redirectUrl.searchParams.set('from', pathname); 
      return NextResponse.redirect(redirectUrl);
    }
    
    // CASO D (Mapeamento Interno): Re-escreve rotas para o caminho do arquivo no disco.
    // Esta regra garante que /dashboard -> /rentou/dashboard e /login -> /auth/login internamente.
    // Ela também captura o resultado do CASO A.
    if (isProtectedPath) {
        // Rotas protegidas: Ex: /dashboard -> /rentou/dashboard (caminho físico)
        return NextResponse.rewrite(new URL(`/rentou${pathname}`, url.origin));
    }
    
    if (isAuthRoute) {
         // Rotas de autenticação: Ex: /login -> /auth/login (caminho físico)
        return NextResponse.rewrite(new URL(`/auth${pathname}`, url.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Mantemos o matcher abrangente para que o Middleware intercepte o tráfego do app.rentou.com.br
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|media|.*\\..*).*)',
  ],
};
// chris-carvalho-devfullstack/rentari/rentari-a5095e5f0efc1e543757fa8dd87a73cb94b50b98/src/proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PATH = '/dashboard'; 
const LOGIN_PATH = '/login'; 
const APP_DOMAIN = 'app.rentou.com.br';

/**
 * Middleware para controle de acesso ao Portal do Proprietário (app.rentou.com.br).
 */
export default function proxy(request: NextRequest) {
  const authToken = request.cookies.get('rentou-auth-token')?.value;
  const url = request.nextUrl;
  const hostname = url.hostname;
  const pathname = url.pathname;

  // 1. Detecção do Domínio de Aplicação
  const isAppDomain = hostname === APP_DOMAIN;
  
  // Rotas de autenticação
  const isAuthRoute = pathname === LOGIN_PATH || pathname === '/signup'; 
  
  // Condição para determinar se a rota é protegida (incluindo a raiz /)
  const isProtectedOrRoot = pathname === '/' || 
                            pathname.startsWith(DASHBOARD_PATH) || 
                            pathname.startsWith('/imoveis') || 
                            pathname.startsWith('/perfil') ||
                            pathname.startsWith('/financeiro');

  if (isAppDomain) {
    
    // CASO 1: Usuário AUTENTICADO acessando a RAIZ (/) OU uma rota de AUTENTICAÇÃO
    // Se logado, sempre vai para o Dashboard (resolve a Landing Page e o loop de login)
    if (authToken && (isProtectedOrRoot || isAuthRoute)) {
      if (pathname !== DASHBOARD_PATH) {
        return NextResponse.redirect(new URL(DASHBOARD_PATH, url.origin));
      }
      return NextResponse.next();
    }
    
    // CASO 2: Usuário NÃO AUTENTICADO acessando a RAIZ (/) OU uma ROTA PROTEGIDA
    if (!authToken && isProtectedOrRoot) {
      // Redireciona para o login
      const redirectUrl = new URL(LOGIN_PATH, url.origin);
      
      // Adiciona o 'from' para redirecionar de volta após o login
      if(pathname !== '/') {
        redirectUrl.searchParams.set('from', pathname); 
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Permite o fluxo normal para www.rentou.com.br (que é tratado pelo next.config.ts/redirects)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|media|.*\\..*).*)',
  ],
};
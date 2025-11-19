// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PATH = '/dashboard'; 
const LOGIN_PATH = '/login'; 
// Defina o domínio da aplicação
const APP_DOMAIN = 'app.rentou.com.br';

export default function middleware(request: NextRequest) {
  const authToken = request.cookies.get('rentou-auth-token')?.value;
  const url = request.nextUrl;
  const hostname = url.hostname; // ex: app.rentou.com.br ou localhost
  const pathname = url.pathname;

  // Verifica se a requisição vem do subdomínio da aplicação (ajuste para localhost se necessário)
  // Para testes locais, você pode querer comentar essa verificação ou simular o host.
  const isAppDomain = hostname === APP_DOMAIN; // || hostname === 'localhost';

  // Rotas de autenticação
  const isAuthRoute = pathname === LOGIN_PATH || pathname === '/signup'; 
  
  // Rotas protegidas
  const isProtectedPath = pathname.startsWith(DASHBOARD_PATH) || 
                          pathname.startsWith('/imoveis') || 
                          pathname.startsWith('/perfil') ||
                          pathname.startsWith('/financeiro');

  // Apenas aplica a lógica se estiver no subdomínio correto (ou remova o if se quiser aplicar globalmente)
  if (isAppDomain) {
    
    // 1. Redirecionamento da Raiz (/)
    if (pathname === '/') {
      const destination = authToken ? DASHBOARD_PATH : LOGIN_PATH;
      return NextResponse.redirect(new URL(destination, request.url));
    }
    
    // 2. Proteção de Rotas (Usuário NÃO autenticado tenta acessar área logada)
    if (isProtectedPath && !authToken) {
      const redirectUrl = new URL(LOGIN_PATH, request.url);
      redirectUrl.searchParams.set('from', pathname); 
      return NextResponse.redirect(redirectUrl);
    }
    
    // 3. Redirecionamento de Logado (Usuário autenticado tenta acessar login)
    if (isAuthRoute && authToken) {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos e api
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|media|.*\\..*).*)',
  ],
};
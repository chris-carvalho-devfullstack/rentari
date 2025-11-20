// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PATH = '/dashboard';
const LOGIN_PATH = '/login';
const APP_DOMAIN = 'app.rentou.com.br';

export default function middleware(request: NextRequest) {
  // ... (mesma lógica anterior para URL e Token) ...
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || ''; 
  const pathname = url.pathname;
  const authToken = request.cookies.get('rentou-auth-token')?.value;

  const isAppEnvironment = hostname.includes(APP_DOMAIN) || hostname.includes('localhost');

  if (isAppEnvironment) {
    if (pathname.startsWith('/rentou')) {
      const cleanPath = pathname.replace('/rentou', '') || '/';
      return NextResponse.redirect(new URL(cleanPath, request.url));
    }

    if (pathname === '/') {
      const destination = authToken ? DASHBOARD_PATH : LOGIN_PATH;
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // ATUALIZADO: Inclui /meu-espaco na proteção
    const isProtectedPath = 
      pathname.startsWith(DASHBOARD_PATH) || 
      pathname.startsWith('/imoveis') || 
      pathname.startsWith('/perfil') || 
      pathname.startsWith('/financeiro') ||
      pathname.startsWith('/meu-espaco'); // <--- NOVO

    if (isProtectedPath && !authToken) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    if (isAuthRoute && authToken) {
      // Se já logado, idealmente verificar o perfil para redirecionar corretamente,
      // mas o dashboard é seguro como padrão.
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|media|.*\\..*).*)',
  ],
};
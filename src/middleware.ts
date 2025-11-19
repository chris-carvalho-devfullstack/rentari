// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Definição das rotas principais
const DASHBOARD_PATH = '/dashboard';
const LOGIN_PATH = '/login';
const APP_DOMAIN = 'app.rentou.com.br';

export default function middleware(request: NextRequest) {
  const url = request.nextUrl;
  // Obtém o host dos headers para maior confiabilidade em alguns ambientes
  const hostname = request.headers.get('host') || ''; 
  const pathname = url.pathname;
  
  // Obtém o token de autenticação dos cookies
  const authToken = request.cookies.get('rentou-auth-token')?.value;

  // 1. DETECÇÃO DE AMBIENTE (CORREÇÃO APLICADA)
  // Aplica a lógica se for o subdomínio 'app' OU se estiver rodando localmente (localhost)
  const isAppEnvironment = hostname.includes(APP_DOMAIN) || hostname.includes('localhost');

  if (isAppEnvironment) {
    
    // 2. CORREÇÃO DE ROTA "FANTASMA" (/rentou) - A CURA DO CACHE
    // Se o navegador do usuário (por cache antigo) mandar para /rentou/...,
    // nós interceptamos e forçamos o navegador a limpar essa parte da URL.
    if (pathname.startsWith('/rentou')) {
      const cleanPath = pathname.replace('/rentou', '') || '/';
      return NextResponse.redirect(new URL(cleanPath, request.url));
    }

    // 3. REDIRECIONAMENTO DA RAIZ (/)
    // Se acessar apenas o domínio (ou localhost:3000/), decide para onde ir.
    if (pathname === '/') {
      const destination = authToken ? DASHBOARD_PATH : LOGIN_PATH;
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // 4. PROTEÇÃO DE ROTAS (Área Logada)
    // Bloqueia acesso direto a páginas internas se não houver token.
    const isProtectedPath = 
      pathname.startsWith(DASHBOARD_PATH) || 
      pathname.startsWith('/imoveis') || 
      pathname.startsWith('/perfil') || 
      pathname.startsWith('/financeiro');

    if (isProtectedPath && !authToken) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      // (Opcional) Salva de onde o usuário veio para redirecionar de volta após o login
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 5. REDIRECIONAMENTO DE LOGIN (Usuário já logado)
    // Se já estiver logado e tentar acessar login/signup, manda para o dashboard.
    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    if (isAuthRoute && authToken) {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }
  }

  // Se nenhuma regra for acionada, permite que a requisição siga normalmente
  return NextResponse.next();
}

// Configuração do Matcher (Onde o middleware deve rodar)
// Excluímos arquivos estáticos, imagens e API para melhor performance
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|media|.*\\..*).*)',
  ],
};
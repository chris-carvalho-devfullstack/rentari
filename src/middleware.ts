// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Define as rotas que exigem autenticação.
 * Utilizamos a convenção de rota do Next.js App Router: /(nome-do-grupo)
 */
const protectedRoutes = ['/rentou']; // O prefixo real do path será /rentou/*

/**
 * Define as rotas que são de autenticação e acessíveis sem login.
 * O prefixo real do path será /login, /signup, etc.
 */
const authRoutes = ['/login', '/signup']; 

// URL de redirecionamento para login.
const LOGIN_URL = '/login'; 
// URL de redirecionamento após login (dashboard é a primeira rota protegida).
const DASHBOARD_URL = '/dashboard'; 

/**
 * Middleware para controle de acesso e autenticação no Rentou.
 * @param request - O objeto de requisição do Next.js.
 */
export function middleware(request: NextRequest) {
  // 1. Simulação de Leitura de Autenticação
  // Na prática, um token JWT seguro (HttpOnly cookie) seria lido aqui.
  const authToken = request.cookies.get('rentou-auth-token')?.value;

  // A URL que o usuário está tentando acessar (ex: /login, /rentou/dashboard)
  const pathname = request.nextUrl.pathname;
  
  // Verifica se o caminho atual está dentro do grupo protegido /(rentou)
  const isProtectedRoute = pathname.startsWith('/rentou');
  // Verifica se o caminho atual é uma rota de autenticação
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // --- Lógica de Controle de Acesso ---

  // Caso 1: Usuário NÃO AUTENTICADO e tentando acessar uma rota PROTEGIDA
  if (isProtectedRoute && !authToken) {
    // Redireciona para o login
    const url = new URL(LOGIN_URL, request.url);
    // Adiciona 'from' para redirecionar após o sucesso do login
    url.searchParams.set('from', pathname); 
    
    return NextResponse.redirect(url);
  }

  // Caso 2: Usuário AUTENTICADO e tentando acessar uma rota de AUTENTICAÇÃO (Login/Cadastro)
  if (isAuthRoute && authToken) {
    // Redireciona para a Dashboard Principal
    return NextResponse.redirect(new URL(DASHBOARD_URL, request.url));
  }

  // Caso 3: Rota é pública, rota de autenticação sem token, ou rota protegida com token.
  return NextResponse.next();
}

/**
 * Configuração que define quais rotas o middleware deve ser executado.
 * Excluímos: arquivos estáticos (images, fonts), a pasta _next, e o favicon.
 * O matcher DEVE incluir as rotas dos grupos (auth) e (rentou).
 */
export const config = {
  matcher: [
    // Isso garante que o middleware seja executado para todas as rotas que começam
    // com /login, /signup, /rentou (e suas sub-rotas), e o root /
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg|.*\\..*).*)',
  ],
};
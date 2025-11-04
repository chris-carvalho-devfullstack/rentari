// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

/**
 * @fileoverview Página principal de Login da plataforma Rentou.
 * Esta página é envolta pelo layout de autenticação (AuthLayout).
 */

export const metadata: Metadata = {
  title: 'Login Rentou - Acesso ao Portal do Proprietário',
  description: 'Faça login para gerenciar seus imóveis e finanças na plataforma Rentou.',
};

export default function LoginPage() {
  return (
    <>
      <LoginForm />
    </>
  );
}
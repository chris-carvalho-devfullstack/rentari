// src/app/(auth)/login/page.tsx

import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm'; 

export const metadata: Metadata = {
  title: 'Rentou Login - Acesso ao Portal do Proprietário',
  description: 'Faça login para gerenciar seus imóveis e finanças na plataforma Rentou.',
};

/**
 * @fileoverview Página principal de Login.
 */
export default function LoginPage() {
  return <LoginForm />;
}
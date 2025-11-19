// src/app/(auth)/signup/page.tsx
import { Metadata } from 'next';
import SignupForm from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Rentou - Crie sua Conta',
  description: 'Cadastre-se na plataforma Rentou para gerenciar seus imóveis.',
};

export default function SignupPage() {
  return <SignupForm />;
}
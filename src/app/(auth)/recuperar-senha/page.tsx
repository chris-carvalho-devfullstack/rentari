// src/app/(auth)/recuperar-senha/page.tsx
'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/services/FirebaseService';
import Link from 'next/link';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';

// Importar o SuccessModal
import SuccessModal from '@/components/auth/SuccessModal';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Configuração para redirecionar o usuário de volta ao login após redefinir (opcional)
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('Não encontramos um usuário com este email.');
      } else {
        setErrorMessage('Ocorreu um erro. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar o modal e voltar ao estado inicial
  const handleCloseModal = () => {
    setStatus('idle');
    setEmail('');
  };

  return (
    <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
      
      {/* 🛑 CORREÇÃO: REMOVER title e message daqui */}
      <SuccessModal
        isOpen={status === 'success'}
        onClose={handleCloseModal}
        redirectPath="/login"
        redirectText="Voltar para o login"
      />
      {/* 🛑 FIM DA CORREÇÃO */}

      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Recuperar acesso
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Informe seu email para receber as instruções de redefinição de senha.
        </p>
      </div>

      {status !== 'success' && (
        <form className="mt-8 space-y-6" onSubmit={handleRecover}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Endereço de email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative block w-full rounded-md border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-700 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:focus:ring-white dark:placeholder:text-gray-400"
                  placeholder="Seu email cadastrado"
                />
              </div>
            </div>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-black px-3 py-3 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </div>

          <div className="flex justify-center">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
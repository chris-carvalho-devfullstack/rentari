'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/services/FirebaseService';
import Link from 'next/link';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      // --- CORREÇÃO AQUI ---
      // 1. Verifica se é localhost
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // 2. Define a URL base correta. 
      // Em produção, FORÇA o domínio que está autorizado no Firebase.
      // Aponta para /redefinir-senha (onde está o formulário de nova senha), não para /login.
      const baseUrl = isLocalhost 
        ? `${window.location.origin}/redefinir-senha` 
        : 'https://conta.rentou.com.br/redefinir-senha';

      const actionCodeSettings = {
        url: baseUrl, 
        handleCodeInApp: true, // Importante ser true para fluxos modernos
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('Não encontramos um usuário com este email.');
      } else if (error.code === 'auth/unauthorized-continue-uri') {
        setErrorMessage('Erro de configuração: Domínio não autorizado no Firebase.');
      } else {
        setErrorMessage('Ocorreu um erro. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderização de Sucesso
  if (status === 'success') {
     return (
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in">
             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
               <CheckCircle2 className="h-10 w-10 text-green-500" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-900">Verifique seu e-mail</h2>
               <p className="text-gray-600 mt-2">
                 Enviamos um link para <strong>{email}</strong>.<br/>
                 Clique nele para criar sua nova senha.
               </p>
             </div>
             <div className="pt-4">
               <Link 
                 href="/login" 
                 className="block w-full rounded-xl bg-black px-4 py-4 text-sm font-bold text-white shadow-lg hover:bg-gray-800 transition-all"
               >
                 Voltar para o Login
               </Link>
             </div>
        </div>
     );
  }

  return (
    <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Recuperar acesso
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Informe seu email para receber as instruções de redefinição de senha.
        </p>
      </div>

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
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 p-3 rounded-lg">
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
    </div>
  );
}
// src/components/auth/LoginForm.tsx

'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/FirebaseService';
import { useAuthStore } from '@/hooks/useAuthStore';

interface LoginFormProps {
  onSuccess?: () => void;
}

// *** FUNÇÃO DE CORREÇÃO: Define o cookie de autenticação para o Middleware ***
const setAuthCookie = (token: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  // Define o cookie para que o Middleware possa ler na próxima requisição.
  document.cookie = `rentou-auth-token=${token}${expires}; path=/; SameSite=Lax; Secure`;
  console.log("--- [DEBUG] Cookie 'rentou-auth-token' mockado definido.");
};
// *****************************************************************************

/**
 * @fileoverview Formulário de login para o Portal Rentou.
 */
export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); 
  const { fetchUserData, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('--- [DEBUG] Iniciando tentativa de login.');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Se chegar aqui, o login com Firebase Auth foi um sucesso.
      console.log('--- [DEBUG] Login Firebase SUCESSO. UID:', userCredential.user.uid);

      // --- PASSO CRÍTICO AQUI: Definir o cookie com o UID ---
      // Mockamos o token com o UID. Na produção, seria um Session Cookie seguro.
      setAuthCookie(userCredential.user.uid); 
      // -----------------------------------------------------
      
      const user = userCredential.user;
      
      const userData = await fetchUserData(user.uid, user.email || '', user.displayName || 'Usuário Rentou');
      setUser(userData);
      
      console.log('--- [DEBUG] Dados do usuário carregados. Redirecionando...');

      // O router.push agora deve funcionar, pois o cookie está setado.
      router.push('/dashboard'); 
      onSuccess?.();
    } catch (err: any) {
      console.error('--- [DEBUG] ERRO DURANTE O PROCESSO DE LOGIN CATCH:', err);
      if (err && typeof err === 'object' && err.code) {
          console.error('--- [DEBUG] Código de Erro:', err.code);
      }
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos. Tente novamente.');
      } else {
        setError(`Ocorreu um erro inesperado. Verifique o console para detalhes.`);
      }
    } finally {
      console.log('--- [DEBUG] Finalizando tentativa de login. Loading = false');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6">
          Acesse o Portal Proprietário
        </h2>

        {error && (
          <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Esqueceu a senha?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Ainda não tem conta?{' '}
              <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Crie sua conta
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
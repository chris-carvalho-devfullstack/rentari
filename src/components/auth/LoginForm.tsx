// src/components/auth/LoginForm.tsx

'use client'; 

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; // <-- IMPORTANTE: Usar Link para navegação interna correta
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/services/FirebaseService'; 
import { useAuthStore } from '@/hooks/useAuthStore';
import { Icon } from '@/components/ui/Icon'; 
import { faEye, faEyeSlash, faEnvelope } from '@fortawesome/free-solid-svg-icons'; 

interface LoginFormProps {
  onSuccess?: () => void;
}

// Ícone SVG Oficial do Google (Colorido)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// Define o cookie de autenticação para o Middleware
const setAuthCookie = (token: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = `rentou-auth-token=${token}${expires}; path=/; SameSite=Lax; Secure`;
  console.log("--- [DEBUG] Cookie 'rentou-auth-token' definido.");
};

/**
 * @fileoverview Formulário de login para o Portal Rentou, atualizado com Google Sign-In oficial e melhorias de UX.
 */
export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); 
  const router = useRouter(); 
  const { fetchUserData, setUser } = useAuthStore();
  
  const handleTogglePassword = () => setShowPassword(prev => !prev);
  
  const handleLoginSuccess = useCallback(async (user: any) => {
      // 1. Define o cookie
      setAuthCookie(user.uid); 
      
      // 2. Busca/Cria o documento do usuário no Firestore
      const userData = await fetchUserData(user.uid, user.email || '', user.displayName || 'Usuário Rentou');
      setUser(userData);
      
      console.log('--- [DEBUG] Dados do usuário carregados. Redirecionando...');

      router.push('/dashboard'); 
      onSuccess?.();
  }, [fetchUserData, setUser, onSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('--- [DEBUG] Iniciando tentativa de login com Email/Senha.');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleLoginSuccess(userCredential.user);

    } catch (err: any) {
      console.error('--- [DEBUG] ERRO DURANTE O PROCESSO DE LOGIN CATCH:', err);
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos. Tente novamente.');
      } else {
        setError(`Ocorreu um erro inesperado. Detalhe: ${err.message || 'Erro desconhecido.'}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        console.log('--- [DEBUG] Login com Google SUCESSO. UID:', user.uid);
        
        await handleLoginSuccess(user);
        
    } catch (err: any) {
        console.error('--- [DEBUG] ERRO DURANTE O LOGIN GOOGLE CATCH:', err);
        let msg = 'Falha ao autenticar com Google. Tente novamente.';
        
        if (err.code === 'auth/account-exists-with-different-credential') {
            msg = 'Este e-mail já está cadastrado com outro método (Ex: Email/Senha). Por favor, use a opção de login padrão.';
        } else if (err.code === 'auth/popup-closed-by-user') {
            msg = 'O pop-up de login foi fechado.';
        }
        
        setError(msg);

    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700">
        
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
          Faça seu login
        </h2>
        
        {/* Link de Cadastro: Texto Azul, Link SPA, Cursor Pointer */}
        <p className="text-center text-sm mb-6 text-gray-600 dark:text-gray-400">
            Ainda não tem conta?{' '}
            <Link 
                href="/signup" 
                className="text-rentou-primary font-bold hover:underline cursor-pointer transition-colors"
            >
                Faça seu cadastro
            </Link>
        </p>
        
        {/* Botão Login Google com Ícone Oficial */}
        <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary mb-4 transition-all cursor-pointer ${
                 loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
            <GoogleIcon />
            Fazer Login com o Google
        </button>
        
        <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-600"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-gray-400 uppercase">ou com sua conta</span>
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-600"></div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <div className="relative mt-1">
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
                    <Icon icon={faEnvelope} className="h-4 w-4" />
                </span>
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm"
                />
                {/* Ícone de "Mostrar/Esconder Senha" com Cursor Pointer */}
                <span 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    onClick={handleTogglePassword}
                    title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                    <Icon icon={showPassword ? faEye : faEyeSlash} className="h-5 w-5" />
                </span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary cursor-pointer transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          
          <div className="text-center pt-2">
            <Link href="/forgot-password" className="font-medium text-rentou-primary text-sm hover:underline cursor-pointer">
              Esqueci minha senha
            </Link>
          </div>

        </form>
        
        {/* Rodapé do Card (Links de Ajuda) */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-6 border-t pt-4 border-gray-100 dark:border-zinc-700">
            <Link href="/terms" className="hover:underline cursor-pointer">Termos de serviço</Link>
            <Link href="/help" className="hover:underline cursor-pointer">Ajuda</Link>
        </div>
        
      </div>
    </div>
  );
}
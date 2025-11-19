// src/components/auth/SignupForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/services/FirebaseService';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Icon } from '@/components/ui/Icon';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function SignupForm() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { fetchUserData, setUser } = useAuthStore();

  const handleTogglePassword = () => setShowPassword(prev => !prev);

  const handleSuccess = async (user: any, displayName?: string) => {
    const date = new Date();
    date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
    document.cookie = `rentou-auth-token=${user.uid}; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;

    // Chama fetchUserData passando o NOME digitado no formulário (displayName)
    // Graças à correção no useAuthStore, se o usuário já existir com nome errado, ele será corrigido agora.
    const userData = await fetchUserData(user.uid, user.email || '', displayName || user.displayName || 'Novo Usuário');
    setUser(userData);
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Tenta atualizar o perfil no Auth (pode não propagar a tempo)
      await updateProfile(userCredential.user, { displayName: nome });
      
      // Chama o sucesso passando o NOME explicitamente
      await handleSuccess(userCredential.user, nome);

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSuccess(result.user);
    } catch (err: any) {
      setError('Falha ao cadastrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
        Crie sua conta
      </h2>
      
      <p className="text-center text-sm mb-6 text-gray-600 dark:text-gray-400">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-rentou-primary font-bold hover:underline cursor-pointer transition-colors">
          Faça login
        </Link>
      </p>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-all cursor-pointer mb-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary"
      >
        <GoogleIcon />
        Cadastrar com o Google
      </button>

      <div className="relative flex py-2 items-center mb-4">
        <div className="flex-grow border-t border-gray-200 dark:border-zinc-600"></div>
        <span className="flex-shrink-0 mx-4 text-xs text-gray-400 uppercase">ou com seu e-mail</span>
        <div className="flex-grow border-t border-gray-200 dark:border-zinc-600"></div>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
          <div className="relative mt-1">
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
              <Icon icon={faUser} className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
          <div className="relative mt-1">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
              <Icon icon={faEnvelope} className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm"
            />
            <span 
              className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={handleTogglePassword}
            >
              <Icon icon={showPassword ? faEye : faEyeSlash} className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Senha</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
               <Icon icon={faLock} className="h-4 w-4" />
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary cursor-pointer transition-colors"
        >
          {loading ? 'Cadastrando...' : 'Criar Conta'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
         <p className="text-xs text-gray-500">Ao se cadastrar, você concorda com os <Link href="/terms" className="hover:underline text-rentou-primary">Termos de Serviço</Link>.</p>
      </div>
    </div>
  );
}
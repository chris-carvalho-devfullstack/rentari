// src/components/auth/LoginForm.tsx

'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/FirebaseService';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Icon } from '@/components/ui/Icon'; // Importar Icon Componente
import { faEye, faEyeSlash, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'; // Ícones

interface LoginFormProps {
  onSuccess?: () => void;
}

// FUNÇÃO DE CORREÇÃO: Define o cookie de autenticação para o Middleware
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
 * @fileoverview Formulário de login para o Portal Rentou, atualizado com design Alude-style e ícones FA.
 */
export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // Adicionado para toggle de senha
  const router = useRouter(); 
  const { fetchUserData, setUser } = useAuthStore();
  
  const handleTogglePassword = () => setShowPassword(prev => !prev);

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
      setAuthCookie(userCredential.user.uid); 
      // -----------------------------------------------------
      
      const user = userCredential.user;
      
      const userData = await fetchUserData(user.uid, user.email || '', user.displayName || 'Usuário Rentou');
      setUser(userData);
      
      console.log('--- [DEBUG] Dados do usuário carregados. Redirecionando...');

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
      <div className="w-full max-w-sm bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700">
        
        {/* Título (Foco no centro do Card) */}
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
          Faça seu login
        </h2>
        {/* Link de Cadastro (Similar ao Alude) */}
        <p className="text-center text-sm mb-6 text-gray-600 dark:text-gray-400">
            Ainda não tem conta? <a href="/signup" className="text-rentou-primary font-medium hover:underline">Faça seu cadastro</a>
        </p>
        
        {/* Botão de Login Social (SIMULADO - Alude Style) - CORREÇÃO: Removido !text-white */}
        <button
            type="button"
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm text-sm font-medium text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary mb-4"
        >
            <span className="text-lg mr-2">G</span> 
            Fazer Login com o Google
        </button>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-4">
            ou com sua conta
        </div>

        {error && (
          <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <div className="relative">
                <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                    <Icon icon={faEnvelope} className="h-4 w-4" />
                </span>
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Campo com fundo levemente azul/cinza, como no print
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {/* Ícone de "Mostrar/Esconder Senha" com Font Awesome */}
                <span 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400"
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
              // Botão Principal Azul (Rentou Primary), com ajuste dark:hover e CORREÇÃO: Removido !text-white
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Continuando...' : 'Continuar'}
            </button>
          </div>
          
          {/* Link "Esqueceu minha senha" (Centralizado) */}
          <div className="text-center pt-2">
            <a href="#" className="font-medium text-rentou-primary text-sm hover:underline">
              Esqueci minha senha
            </a>
          </div>

        </form>
        
        {/* Rodapé do Card (Termos de Serviço e Ajuda) */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-6 border-t pt-4 border-gray-100 dark:border-zinc-700">
            <a href="#" className="hover:underline">Termos de serviço</a>
            <a href="#" className="hover:underline">Ajuda</a>
        </div>
        
      </div>
    </div>
  );
}
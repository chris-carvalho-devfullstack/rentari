// src/components/auth/LoginForm.tsx

'use client'; 

import { useState, useRef } from 'react';
// IMPORT ATUALIZADO: Adicionado useSearchParams para ler a URL de retorno
import { useRouter, useSearchParams } from 'next/navigation'; 
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/services/FirebaseService';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Icon } from '@/components/ui/Icon'; // Importar Icon Componente
import { faEye, faEyeSlash, faEnvelope } from '@fortawesome/free-solid-svg-icons'; // Ícones de visibilidade e envelope
import { Turnstile } from '@marsidev/react-turnstile';
// IMPORT NOVO: Notificações modernas
import { toast } from 'sonner';

// Ícone do Google (Adicionado conforme correção)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

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
  
  // Estados do Cloudflare Turnstile (FIX DE SEGURANÇA)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);

  const router = useRouter(); 
  // HOOK NOVO: Captura parâmetros da URL (ex: ?redirect=/anuncios/123)
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { fetchUserData, setUser } = useAuthStore();
  
  const handleTogglePassword = () => setShowPassword(prev => !prev);

  // Função auxiliar para processar o sucesso do login e redirecionar
  const handleLoginSuccess = async (user: any) => {
      // --- PASSO CRÍTICO AQUI: Definir o cookie com o UID ---
      setAuthCookie(user.uid); 
      // -----------------------------------------------------

      const userData = await fetchUserData(user.uid, user.email || '', user.displayName || 'Usuário Rentou');
      setUser(userData);
      
      console.log('--- [DEBUG] Dados do usuário carregados. Redirecionando...');
      toast.success(`Bem-vindo de volta, ${userData.nome?.split(' ')[0] || 'Usuário'}!`);

      // Redirecionamento Inteligente (FIX DE NAVEGAÇÃO + MELHORIA DE UX)
      // Se houver uma URL de redirecionamento, prioriza ela
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (!userData.perfil) {
        router.push('/selecao-perfil');
      } else if (userData.perfil === 'INQUILINO') {
        router.push('/meu-espaco');
      } else {
        router.push('/dashboard');
      }

      onSuccess?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação do Turnstile
    if (!turnstileToken) {
        setError('Verificação de segurança necessária. Aguarde a confirmação.');
        toast.warning('Verificação de segurança necessária.');
        setLoading(false);
        return;
    }

    try {
      console.log('--- [DEBUG] Iniciando tentativa de login.');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Se chegar aqui, o login com Firebase Auth foi um sucesso.
      console.log('--- [DEBUG] Login Firebase SUCESSO. UID:', userCredential.user.uid);

      // Reseta widget após sucesso (boa prática)
      if (turnstileRef.current) turnstileRef.current.reset();

      await handleLoginSuccess(userCredential.user);

    } catch (err: any) {
      // Reseta widget em caso de erro para forçar nova verificação
      if (turnstileRef.current) turnstileRef.current.reset();
      setTurnstileToken(null);

      console.error('--- [DEBUG] ERRO DURANTE O PROCESSO DE LOGIN CATCH:', err);
      if (err && typeof err === 'object' && err.code) {
          console.error('--- [DEBUG] Código de Erro:', err.code);
      }
      
      let errorMessage = `Ocorreu um erro inesperado.`;

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'E-mail ou senha inválidos. Tente novamente.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage); // Feedback visual moderno

    } finally {
      console.log('--- [DEBUG] Finalizando tentativa de login. Loading = false');
      setLoading(false);
    }
  };

  // Handler para Login com Google (FIX FUNCIONALIDADE)
  const handleGoogleSignIn = async () => {
    if (!turnstileToken) {
      setError('Verificação de segurança necessária. Aguarde o captcha.');
      toast.warning('Aguarde o captcha de segurança.');
      return;
    }
  
    setLoading(true);
    setError(null);
    try {
      console.log('--- [DEBUG] Iniciando Login Google.');
      const result = await signInWithPopup(auth, googleProvider);
      
      // Opcional: Resetar o widget após uso
      if (turnstileRef.current) turnstileRef.current.reset();
      
      console.log('--- [DEBUG] Login Google SUCESSO. UID:', result.user.uid);
      await handleLoginSuccess(result.user);

    } catch (err: any) {
      // Resetar widget em caso de erro
      if (turnstileRef.current) turnstileRef.current.reset();
      setTurnstileToken(null);
      console.error('--- [DEBUG] Erro Google:', err);
      setError('Falha no login com Google.');
      toast.error('Falha ao conectar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ADICIONADO: mb-10 para dar espaço ao footer de copyright
    <div className="flex flex-col items-center justify-center p-4 mb-10">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700 transition-colors duration-300">
        
        {/* Título (Foco no centro do Card) */}
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
          Faça seu login
        </h2>
        
        {/* Link de Cadastro (Similar ao Alude) */}
        <p className="text-center text-sm mb-6 text-gray-600 dark:text-gray-400">
            Ainda não tem conta?{' '}
            {/* ATUALIZADO: Cor mais escura no hover, Negrito e Title */}
            <a 
              href="/signup" 
              title="Crie sua conta agora e comece a usar a Rentou!"
              className="text-rentou-primary font-bold hover:underline hover:text-blue-800 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Faça seu cadastro
            </a>
        </p>
        
        {/* Botão de Login Social (FIX: Botão real funcional) */}
        <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            // Estilização atualizada para padrão Google (White/Gray) conforme fix
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary mb-4 transition-all cursor-pointer"
        >
            <GoogleIcon />
            Entrar com o Google
        </button>
        
        <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-600"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-gray-400 uppercase">ou com sua conta</span>
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-600"></div>
        </div>

        {error && (
          <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/50">
            {error}
          </p>
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
                // Campo com fundo levemente azul/cinza, como no print
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
                {/* Adicionado ícone de envelope para paridade com fix */}
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
                  // Campo com fundo levemente azul/cinza, como no print
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
                {/* Ícone de "Mostrar/Esconder Senha" com Font Awesome */}
                <span 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={handleTogglePassword}
                    title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                    <Icon icon={showPassword ? faEye : faEyeSlash} className="h-4 w-4" />
                </span>
            </div>
          </div>

          {/* CLOUDFLARE TURNSTILE (CAPTCHA) - FIX DE SEGURANÇA */}
          <div className="flex justify-center my-4">
            <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{
                    theme: 'auto',
                    size: 'normal',
                }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !turnstileToken}
              // Botão Principal Azul (Rentou Primary), com ajuste dark:hover
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary transition-colors cursor-pointer ${
                (loading || !turnstileToken) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Continuando...' : 'Continuar'}
            </button>
          </div>
          
          {/* Link "Esqueceu minha senha" (Centralizado) */}
          <div className="text-center pt-2">
            <a href="/recuperar-senha" className="font-medium text-rentou-primary text-sm hover:underline">
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
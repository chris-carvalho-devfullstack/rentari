// src/components/auth/SignupForm.tsx

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { auth, googleProvider } from '@/services/FirebaseService';
import { useAuthStore } from '@/hooks/useAuthStore';
import { updateUserInFirestore } from '@/services/UserService';
import { Icon } from '@/components/ui/Icon';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faBuilding, faHome, faSync } from '@fortawesome/free-solid-svg-icons';
import { PerfilUsuario } from '@/types/usuario';
import { Turnstile } from '@marsidev/react-turnstile';

// --- LÓGICA DE SEGURANÇA (Copiada e adaptada) ---
const calculateStrength = (password: string, emailUser: string = '') => {
  let score = 0;
  
  const passLower = password.toLowerCase();
  
  // 0. VERIFICAÇÕES BLOQUEANTES
  const commonPasswords = [
    "123456", "12345678", "123456789", "12345", "000000", "111111",
    "senha", "senha123", "password", "trocarsenha", "admin", "admin123",
    "rentou", "rentou123", "mudar123", "qwerty"
  ];

  if (commonPasswords.includes(passLower)) {
    return { score: 0, label: 'Insegura', color: 'bg-red-500', width: '100%', isBlocked: true, message: 'Esta senha é muito comum.' };
  }

  if (emailUser) {
    const userPart = emailUser.split('@')[0].toLowerCase();
    if (userPart.length > 3 && passLower.includes(userPart)) {
      return { score: 0, label: 'Insegura', color: 'bg-red-500', width: '100%', isBlocked: true, message: 'Não use parte do seu e-mail na senha.' };
    }
  }

  if (/(\w)\1{3,}/.test(password)) {
    return { score: 0, label: 'Insegura', color: 'bg-red-500', width: '100%', isBlocked: true, message: 'Evite repetir o mesmo caractere muitas vezes.' };
  }

  // --- CÁLCULO DE SCORE NORMAL ---
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (password.length >= 8) score += 1;

  if (!password) return { score: 0, label: '', color: 'bg-transparent', width: '0%', isBlocked: false, message: '' };
  
  if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-500', width: '25%', isBlocked: false, message: '' };
  if (score === 2) return { score, label: 'Razoável', color: 'bg-orange-400', width: '50%', isBlocked: false, message: '' };
  if (score === 3) return { score, label: 'Forte', color: 'bg-green-500', width: '75%', isBlocked: false, message: '' };
  return { score, label: 'Fortíssima', color: 'bg-emerald-600', width: '100%', isBlocked: false, message: '' };
};

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
  
  const [perfil, setPerfil] = useState<PerfilUsuario>('INQUILINO'); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do Cloudflare Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  
  // Ref para o container do captcha para scroll
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const { fetchUserData, setUser } = useAuthStore();

  // Calcula a força da senha em tempo real
  const strength = calculateStrength(password, email);

  // Verifica se as senhas conferem para uso na UI
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleTogglePassword = () => setShowPassword(prev => !prev);

  const getButtonClass = (tipo: PerfilUsuario) => {
    const isSelected = perfil === tipo;
    if (isSelected) {
      return "flex items-center p-3 text-left border rounded-lg text-sm transition-all cursor-pointer " +
             "border-rentou-primary bg-blue-50 text-rentou-primary ring-1 ring-rentou-primary " +
             "dark:bg-blue-600/20 dark:border-blue-400 dark:text-white dark:ring-blue-400";
    }
    return "flex items-center p-3 text-left border rounded-lg text-sm transition-all cursor-pointer " +
           "border-gray-300 text-gray-700 hover:bg-gray-50 " +
           "dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700 dark:hover:border-zinc-500";
  };

  // Handler APENAS para o formulário de Email/Senha (onde o usuário escolheu o perfil visualmente)
  const handleEmailSignUpSuccess = async (user: any, displayName?: string) => {
    const date = new Date();
    date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
    document.cookie = `rentou-auth-token=${user.uid}; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;

    // 1. Busca dados
    const userData = await fetchUserData(user.uid, user.email || '', displayName || user.displayName || 'Novo Usuário');
    
    // 2. FORÇA a atualização do perfil baseado no que está selecionado no formulário (State)
    if (userData.perfil !== perfil) {
        await updateUserInFirestore(user.uid, { perfil });
        userData.perfil = perfil;
    }
    
    setUser(userData);

    // 3. Redirecionamento
    if (perfil === 'INQUILINO') {
        router.push('/meu-espaco');
    } else {
        router.push('/dashboard');
    }
  };

  // Handler Específico para Google (Com lógica de redirecionamento para seleção)
  const handleGoogleSignUp = async () => {
    if (!turnstileToken) {
        setError('Verificação de segurança necessária. Aguarde o captcha.');
        // Foca no captcha
        captchaContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser;

      // Configura Cookie
      const date = new Date();
      date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
      document.cookie = `rentou-auth-token=${user.uid}; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;

      // Busca dados do usuário (cria se não existir, mas NÃO define perfil padrão ainda)
      const userData = await fetchUserData(user.uid, user.email || '', user.displayName || 'Novo Usuário');
      setUser(userData);

      // --- LÓGICA DE DECISÃO DE ROTA ---
      
      // Se for usuário novo, ele NÃO escolheu perfil ainda -> Manda para página de seleção
      if (isNewUser) {
        router.push('/selecao-perfil');
        return;
      }

      // Se for usuário existente, verificamos se ele já tem um perfil definido
      if (userData.perfil) {
        // Já tem perfil, manda para a área correta
        if (userData.perfil === 'INQUILINO') {
           router.push('/meu-espaco');
        } else {
           router.push('/dashboard');
        }
      } else {
        // Usuário existe mas por algum motivo não tem perfil (cadastro antigo incompleto)
        router.push('/selecao-perfil');
      }

    } catch (err: any) {
      if (turnstileRef.current) turnstileRef.current.reset();
      setTurnstileToken(null);
      console.error(err);
      setError('Falha ao cadastrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!turnstileToken) {
        setError('Complete a verificação de segurança (Captcha).');
        captchaContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (strength.isBlocked) {
        setError(strength.message || 'Sua senha é considerada insegura.');
        return;
    }
    if (strength.score < 2) {
        setError('Sua senha é muito fraca. Tente adicionar números, letras maiúsculas ou símbolos.');
        return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: nome });
      // Usa o handler de Email que aplica o perfil selecionado
      await handleEmailSignUpSuccess(userCredential.user, nome);
    } catch (err: any) {
      if (turnstileRef.current) turnstileRef.current.reset();
      setTurnstileToken(null);
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

  return (
    <div className="w-full bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700 transition-colors duration-300">
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
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* SELEÇÃO DE PERFIL */}
        <div className="space-y-2 pb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">O que você busca na Rentou?</label>
            <div className="grid grid-cols-1 gap-3">
                <button type="button" onClick={() => setPerfil('PROPRIETARIO')} className={getButtonClass('PROPRIETARIO')}>
                    <Icon icon={faBuilding} className={`w-5 h-5 mr-3 ${perfil === 'PROPRIETARIO' ? 'text-rentou-primary dark:text-blue-400' : 'text-gray-400'}`} />
                    <div><span className="block font-bold">Sou Proprietário</span><span className={`text-xs block font-normal mt-0.5 ${perfil === 'PROPRIETARIO' ? 'text-blue-600 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>Quero anunciar e gerir imóveis</span></div>
                </button>
                <button type="button" onClick={() => setPerfil('INQUILINO')} className={getButtonClass('INQUILINO')}>
                    <Icon icon={faHome} className={`w-5 h-5 mr-3 ${perfil === 'INQUILINO' ? 'text-rentou-primary dark:text-blue-400' : 'text-gray-400'}`} />
                    <div><span className="block font-bold">Sou Inquilino</span><span className={`text-xs block font-normal mt-0.5 ${perfil === 'INQUILINO' ? 'text-blue-600 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>Quero buscar um imóvel para alugar</span></div>
                </button>
                <button type="button" onClick={() => setPerfil('AMBOS')} className={getButtonClass('AMBOS')}>
                    <Icon icon={faSync} className={`w-5 h-5 mr-3 ${perfil === 'AMBOS' ? 'text-rentou-primary dark:text-blue-400' : 'text-gray-400'}`} />
                    <div><span className="block font-bold">Ambos</span><span className={`text-xs block font-normal mt-0.5 ${perfil === 'AMBOS' ? 'text-blue-600 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>Investidor e morador</span></div>
                </button>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
          <div className="relative mt-1">
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm transition-colors" />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none"><Icon icon={faUser} className="h-4 w-4" /></span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
          <div className="relative mt-1">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm transition-colors" />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none"><Icon icon={faEnvelope} className="h-4 w-4" /></span>
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
              className={`block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm transition-colors ${strength.isBlocked ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`} 
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={handleTogglePassword}><Icon icon={showPassword ? faEye : faEyeSlash} className="h-4 w-4" /></span>
          </div>

          {password && (
            <div className="mt-2 space-y-2 animate-in slide-in-from-top-1">
              {strength.isBlocked ? (
                  <div className="w-full h-1.5 rounded-full bg-red-500 transition-all duration-300" />
              ) : (
                  <div className="flex gap-1 h-1.5 w-full">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 0 ? strength.color : 'bg-gray-200 dark:bg-zinc-600'}`} style={{ width: '25%' }} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-gray-200 dark:bg-zinc-600'}`} style={{ width: '25%' }} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-gray-200 dark:bg-zinc-600'}`} style={{ width: '25%' }} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-gray-200 dark:bg-zinc-600'}`} style={{ width: '25%' }} />
                  </div>
              )}
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {strength.isBlocked ? 'Senha inválida' : 'Nível de segurança'}
                </span>
                <span className={`font-bold ${strength.color.replace('bg-', 'text-')}`}>
                  {strength.label}
                </span>
              </div>
              
              {strength.isBlocked && (
                  <p className="text-xs text-red-500 font-medium mt-1">{strength.message}</p>
              )}

              {!strength.isBlocked && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600 dark:text-green-400 font-bold' : ''}>• Especial</span>
                    <span className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400 font-bold' : ''}>• Maiúscula</span>
                    <span className={/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400 font-bold' : ''}>• Número</span>
                    <span className={password.length >= 8 ? 'text-green-600 dark:text-green-400 font-bold' : ''}>• 8+ chars</span>
                  </div>
              )}
            </div>
          )}

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Senha</label>
          <div className="relative mt-1">
            <input 
              type={showPassword ? 'text' : 'password'} 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary sm:text-sm transition-colors dark:bg-zinc-700/70 dark:text-white ${!passwordsMatch ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : 'border-gray-300 dark:border-zinc-600'}`} 
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none"><Icon icon={faLock} className="h-4 w-4" /></span>
          </div>
          {!passwordsMatch && (
            <p className="text-xs text-red-500 mt-1 font-medium animate-in slide-in-from-top-1">
              As senhas não conferem.
            </p>
          )}
        </div>

        {/* CLOUDFLARE TURNSTILE (CAPTCHA) */}
        <div ref={captchaContainerRef} className="flex justify-center my-4">
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

        <button 
          type="submit" 
          disabled={loading || (password.length > 0 && (strength.isBlocked || strength.score < 2)) || !turnstileToken} 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Cadastrando...' : 'Criar Conta'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
         <p className="text-xs text-gray-500 dark:text-gray-400">Ao se cadastrar, você concorda com os <Link href="/terms" className="hover:underline text-rentou-primary dark:text-blue-400">Termos de Serviço</Link>.</p>
      </div>
    </div>
  );
}
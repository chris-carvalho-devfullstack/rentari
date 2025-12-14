// src/app/(auth)/redefinir-senha/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/services/FirebaseService';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

// --- COMPONENTE VISUAL (Movido para fora para corrigir o bug de foco) ---
const CardWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl mx-auto animate-in fade-in zoom-in duration-300">
      {children}
  </div>
);

// --- LÓGICA DE SEGURANÇA ---
const calculateStrength = (password: string, emailUser: string = '') => {
  let score = 0;
  let message = ''; 

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
      return { score: 0, label: 'Insegura', color: 'bg-red-500', width: '100%', isBlocked: true, message: 'Não use seu nome de usuário na senha.' };
    }
  }

  if (/(\w)\1{3,}/.test(password)) {
    return { score: 0, label: 'Insegura', color: 'bg-red-500', width: '100%', isBlocked: true, message: 'Evite repetir o mesmo caractere.' };
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

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  // Estados
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Novo estado para a confirmação
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'verifying' | 'input' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = calculateStrength(password, email);

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setErrorMessage('Link inválido ou incompleto.');
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setStatus('input');
      })
      .catch((error) => {
        console.error("Erro ao verificar código:", error);
        setStatus('error');
        setErrorMessage('Este link expirou ou já foi utilizado.');
      });
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (strength.isBlocked) {
        setErrorMessage(strength.message || 'Escolha uma senha mais segura.');
        return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    if (!oobCode) return;

    setLoading(true);
    setErrorMessage('');

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('success');
    } catch (error: any) {
      setErrorMessage('Erro ao salvar nova senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZAÇÃO DOS ESTADOS ---

  // 1. Verificando
  if (status === 'verifying') {
    return (
      <CardWrapper>
        <div className="flex flex-col items-center justify-center space-y-4 animate-pulse py-4">
            <div className="h-8 w-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-500">Validando segurança...</p>
        </div>
      </CardWrapper>
    );
  }

  // 2. Erro
  if (status === 'error') {
    return (
      <CardWrapper>
        <div className="text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Link Indisponível</h2>
            <p className="text-gray-600">{errorMessage}</p>
            <Link 
                href="/recuperar-senha" 
                className="inline-flex w-full justify-center rounded-xl bg-black px-4 py-4 text-sm font-bold text-white shadow-lg hover:bg-gray-800 transition-all"
            >
                Solicitar novo link
            </Link>
        </div>
      </CardWrapper>
    );
  }

  // 3. Sucesso
  if (status === 'success') {
    return (
      <CardWrapper>
         <div className="text-center space-y-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tudo certo!</h2>
                <p className="text-gray-600">
                    Sua senha foi redefinida com segurança.
                </p>
            </div>
            <Link 
                href="/login" 
                className="inline-flex w-full justify-center rounded-xl bg-black px-4 py-4 text-sm font-bold text-white shadow-lg hover:bg-gray-800 transition-transform active:scale-95"
            >
                Entrar na minha conta
            </Link>
         </div>
      </CardWrapper>
    );
  }

  // 4. Formulário Principal
  return (
    <CardWrapper>
      <div className="space-y-8">
        
        {/* Cabeçalho do Form - LIMPO */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nova Senha
          </h1>
          <p className="text-sm text-gray-500">
            Defina a nova senha para <br/>
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          
          {/* Input Senha */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 ml-1">
                Senha
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                      setPassword(e.target.value);
                      if(errorMessage) setErrorMessage('');
                  }}
                  className={`block w-full rounded-2xl border-0 bg-gray-50 py-4 pl-5 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all ${strength.isBlocked ? 'ring-red-300 focus:ring-red-500 bg-red-50' : ''}`}
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Medidor de Força */}
              {password && (
                <div className="px-1 space-y-2 animate-in slide-in-from-top-1">
                  {strength.isBlocked ? (
                      <div className="w-full h-1.5 rounded-full bg-red-500 transition-all duration-300" />
                  ) : (
                      <div className="flex gap-1 h-1.5 w-full">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 0 ? strength.color : 'bg-gray-200'}`} style={{ width: '25%' }} />
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-gray-200'}`} style={{ width: '25%' }} />
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-gray-200'}`} style={{ width: '25%' }} />
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-gray-200'}`} style={{ width: '25%' }} />
                      </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">
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
                      <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-1">
                        <span className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600 font-bold' : ''}>• Especial</span>
                        <span className={/[A-Z]/.test(password) ? 'text-green-600 font-bold' : ''}>• Maiúscula</span>
                        <span className={/[0-9]/.test(password) ? 'text-green-600 font-bold' : ''}>• Número</span>
                        <span className={password.length >= 8 ? 'text-green-600 font-bold' : ''}>• 8+ chars</span>
                      </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 ml-1">
                Confirmação
              </label>
              <div className="relative group"> {/* Adicionado 'group' para consistência */}
                <input
                  type={showConfirmPassword ? 'text' : 'password'} // Usa o novo estado
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-2xl border-0 bg-gray-50 py-4 pl-5 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                  placeholder="Confirme a senha"
                />
                {/* Botão de visualizar senha para a confirmação */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 animate-pulse border border-red-100">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
          )}

          <button
            type="submit"
            disabled={loading || strength.score < 2 || strength.isBlocked}
            className="w-full rounded-2xl bg-black px-4 py-4 text-sm font-bold text-white shadow-xl hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
          >
            {loading ? 'Salvando Alterações...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </CardWrapper>
  );
}

// Layout Principal
export default function RedefinirSenhaPage() {
    return (
        <div className="min-h-screen flex flex-col justify-between">
            
            {/* Header removido conforme solicitado (o RENTOU do layout deve aparecer) */}
            <div className="p-6"></div> {/* Espaçador simples se necessário, ou remover */}

            <main className="flex-grow flex items-center justify-center p-4">
                <Suspense fallback={<div className="flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-black rounded-full border-t-transparent"></div></div>}>
                    <RedefinirSenhaContent />
                </Suspense>
            </main>

            {/* Rodapé fixo */}
            <footer className="flex-shrink-0 w-full p-6 text-center">
                <p className="text-xs text-gray-400 font-medium">
                    © 2025 Rentou. Todos os direitos reservados.
                </p>
            </footer>

        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/FirebaseService';
import { updateUserInFirestore } from '@/services/UserService';
import { useAuthStore } from '@/hooks/useAuthStore';
import { PerfilUsuario } from '@/types/usuario';
import { Icon } from '@/components/ui/Icon';
import { faBuilding, faHome, faSync, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function SelecaoPerfilPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState<PerfilUsuario | null>(null); // Loading específico para o botão clicado
  const [authChecking, setAuthChecking] = useState(true);

  // Proteção básica da rota: verifica se há utilizador logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSelect = async (perfil: PerfilUsuario) => {
    if (!auth.currentUser) return;
    
    setLoading(perfil);

    try {
      // 1. Atualiza no Firestore
      await updateUserInFirestore(auth.currentUser.uid, { perfil });

      // 2. Atualiza estado global se estiver disponível
      if (user) {
        setUser({ ...user, perfil });
      }

      // 3. Redireciona para a área correta
      if (perfil === 'INQUILINO') {
        router.push('/meu-espaco');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Ocorreu um erro ao salvar sua escolha. Tente novamente.");
      setLoading(null);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Icon icon={faSpinner} className="w-8 h-8 text-rentou-primary animate-spin" />
      </div>
    );
  }

  // Definição das classes comuns para os botões para manter o código limpo e consistente
  const cardClasses = (perfil: PerfilUsuario) => `
    group relative flex flex-col items-center p-8 
    bg-white dark:bg-zinc-800 
    rounded-2xl shadow-lg border-2 border-transparent 
    transition-all duration-300 ease-out
    text-left
    ${!!loading // Se estiver carregando (qualquer um), desabilita interação visual
      ? 'opacity-50 cursor-not-allowed' 
      : 'cursor-pointer hover:border-rentou-primary hover:ring-4 hover:ring-rentou-primary/20 hover:shadow-2xl hover:-translate-y-2'
    }
    ${loading === perfil ? 'cursor-wait opacity-80 ring-4 ring-rentou-primary/20 border-rentou-primary' : ''}
  `;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 p-6">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Bem-vindo à Rentou!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Para personalizarmos a sua experiência, diga-nos: qual é o seu objetivo principal?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Opção 1: Proprietário */}
          <button
            onClick={() => handleSelect('PROPRIETARIO')}
            disabled={!!loading}
            className={cardClasses('PROPRIETARIO')}
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Icon icon={faBuilding} className="w-8 h-8 text-rentou-primary dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sou Proprietário</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Quero anunciar meus imóveis, gerir contratos e receber aluguéis.
            </p>
            {loading === 'PROPRIETARIO' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 rounded-2xl backdrop-blur-sm">
                <Icon icon={faSpinner} className="w-8 h-8 text-rentou-primary animate-spin" />
              </div>
            )}
          </button>

          {/* Opção 2: Inquilino */}
          <button
            onClick={() => handleSelect('INQUILINO')}
            disabled={!!loading}
            className={cardClasses('INQUILINO')}
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Icon icon={faHome} className="w-8 h-8 text-rentou-primary dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sou Inquilino</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Estou à procura de um imóvel para alugar e quero facilitar o processo.
            </p>
            {loading === 'INQUILINO' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 rounded-2xl backdrop-blur-sm">
                <Icon icon={faSpinner} className="w-8 h-8 text-rentou-primary animate-spin" />
              </div>
            )}
          </button>

          {/* Opção 3: Ambos */}
          <button
            onClick={() => handleSelect('AMBOS')}
            disabled={!!loading}
            className={cardClasses('AMBOS')}
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Icon icon={faSync} className="w-8 h-8 text-rentou-primary dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ambos</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Sou investidor imobiliário e também procuro imóveis para uso próprio.
            </p>
            {loading === 'AMBOS' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 rounded-2xl backdrop-blur-sm">
                <Icon icon={faSpinner} className="w-8 h-8 text-rentou-primary animate-spin" />
              </div>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
          Não se preocupe, você poderá alterar o seu perfil nas configurações mais tarde se necessário.
        </p>
      </div>
    </div>
  );
}
// src/app/(rentou)/perfil/page.tsx
'use client'; 

import { useAuthStore } from '@/hooks/useAuthStore';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { faArrowLeft, faUser, faCreditCard, faKey, faCheckCircle, faEnvelope } from '@fortawesome/free-solid-svg-icons';

// Componente auxiliar para formatação de CPF e Telefone (apenas para exibição)
const formatCpf = (cpf: string) => {
    if (!cpf) return 'Não informado';
    // Exemplo: 45678912300 -> ***.456.789-**
    if (cpf.length >= 11) {
        return `CPF: ***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
    }
    return cpf;
}

const formatTelefone = (telefone: string) => {
    if (!telefone) return 'Não informado';
    // Exemplo: 11987654321 -> (11) 98765-4321
    if (telefone.length === 11) {
        return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`;
    }
    // Suporta também o formato (XX) XXXX-XXXX para telefones fixos/antigos
    if (telefone.length === 10) {
        return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 6)}-${telefone.slice(6)}`;
    }
    return telefone;
}

// Componente auxiliar para blocos de informação
const InfoBlock: React.FC<{ label: string; value: string | number | React.ReactNode; color?: string }> = ({ label, value, color = 'text-gray-900 dark:text-gray-100' }) => (
    <div className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{label}</p>
      {/* CORREÇÃO: Usar <div> em vez de <p> para o valor para evitar erro de hidratação (div dentro de p) */}
      <div className={`mt-1 text-base font-semibold ${color}`}>{value}</div>
    </div>
);

/**
 * @fileoverview Página de Perfil do Proprietário: Dados Pessoais, Contato e Dados Bancários.
 * ATUALIZADO: Exibe a foto de perfil, CPF e Telefone do usuário a partir do Store.
 */
export default function PerfilPage() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="text-center p-10 text-gray-600 dark:text-gray-300">Carregando dados do usuário...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link href="/dashboard" className="text-rentou-primary hover:underline font-medium text-sm flex items-center">
        <Icon icon={faArrowLeft} className="w-3 h-3 mr-2" />
        Voltar para o Dashboard
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 border-b pb-4">
        Meu Perfil & Dados de Pagamento
      </h1>

      {/* Seção 1: Informações Pessoais (Com Foto de Perfil) */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Icon icon={faUser} className="w-5 h-5 mr-3 text-rentou-primary" />
            Dados Pessoais
        </h2>
        
        <div className="flex items-center space-x-6 mb-6 pb-6 border-b border-gray-100 dark:border-zinc-700">
            {/* Foto de Perfil Grande (Lógica Atualizada) */}
            {user.fotoUrl ? (
                <img 
                    src={user.fotoUrl} 
                    alt={`Foto de perfil de ${user.nome}`} 
                    className="w-20 h-20 object-cover rounded-full shadow-md border-2 border-rentou-primary"
                />
            ) : (
                // Placeholder padrão
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md">
                    {user.nome[0]}
                </div>
            )}
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.nome}</p>
                <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                    <Icon icon={faEnvelope} className="w-3 h-3 mr-2" />
                    <p className="text-base">{user.email}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoBlock label="Tipo de Perfil" value={user.tipo} />
            <InfoBlock 
                label="Status de Verificação" 
                value={<div className='flex items-center text-green-600 dark:text-green-400'><Icon icon={faCheckCircle} className="w-4 h-4 mr-2" /> Verificado (Completo)</div>} 
            />
            {/* CPF e Telefone (Usando os novos campos do Store) */}
            <InfoBlock label="Documento" value={formatCpf(user.cpf)} />
            <InfoBlock label="Telefone" value={formatTelefone(user.telefone)} />
        </div>
        
        <div className="mt-6 text-right">
             <Link href="/perfil/editar" className="px-4 py-2 bg-rentou-primary text-white rounded-lg hover:bg-blue-700 font-medium">
                Editar Informações Pessoais
            </Link>
        </div>
      </div>

      {/* Seção 2: Dados Bancários e PIX (USANDO DADOS REAIS DO STORE) */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-xl border-l-4 border-rentou-primary">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Icon icon={faCreditCard} className="w-5 h-5 mr-3 text-rentou-primary" />
            Dados Bancários para Recebimento
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoBlock label="Banco" value={user.dadosBancarios.banco} />
            <InfoBlock label="Agência" value={user.dadosBancarios.agencia} />
            <InfoBlock label="Conta" value={user.dadosBancarios.conta} />
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-zinc-700 rounded-lg border-2 border-dashed border-rentou-primary/50 dark:border-blue-500/50">
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">Chave PIX Principal ({user.dadosBancarios.pixTipo})</p>
            <p className="text-2xl font-bold text-rentou-primary dark:text-blue-400 mt-1">{user.dadosBancarios.pixChave}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Principal meio de recebimento de aluguéis.</p>
        </div>
        
        <div className="mt-6 text-right">
            {/* NOVO LINK PARA EDIÇÃO FINANCEIRA */}
            <Link href="/perfil/pagamento" className="px-4 py-2 bg-rentou-primary text-white rounded-lg hover:bg-blue-700 font-medium">
                Editar Dados Bancários
            </Link>
        </div>
      </div>
      
      {/* Seção 3: Segurança */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Icon icon={faKey} className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
            Segurança da Conta
        </h2>
        <button className="text-sm font-medium text-red-600 hover:underline">
            Alterar Senha de Acesso
        </button>
      </div>

    </div>
  );
}
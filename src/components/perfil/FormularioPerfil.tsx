// src/components/perfil/FormularioPerfil.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Usuario } from '@/types/usuario';
import { Icon } from '@/components/ui/Icon';
import { faSave, faUser, faEnvelope } from '@fortawesome/free-solid-svg-icons';

/**
 * Interface para os dados do formulário (apenas campos editáveis)
 */
interface PerfilFormData {
    nome: string;
    email: string;
    // Outros campos a serem adicionados no futuro (ex: telefone, cpf)
}

/**
 * @fileoverview Formulário para edição das informações pessoais do Proprietário.
 */
export default function FormularioPerfil() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  
  // Estado inicial do formulário (baseado no usuário logado)
  const [formData, setFormData] = useState<PerfilFormData>({
    nome: user?.nome || '',
    email: user?.email || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Redireciona se não houver usuário (embora o layout deva proteger)
    if (!user) {
        router.push('/login');
    }
  }, [user, router]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validação básica
    if (!formData.nome || !formData.email) {
      setError("Nome e E-mail são campos obrigatórios.");
      setLoading(false);
      return;
    }
    
    try {
        // Chamada para a função de atualização no Zustand/Store (simulando a API)
        const updatedUser = await updateUser(formData); 
        
        setSuccess("Perfil atualizado com sucesso!");
        
        // Redireciona para a página de visualização após o sucesso
        setTimeout(() => {
            router.push('/perfil');
        }, 1500);

    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(`Falha ao atualizar o perfil. Detalhe: ${err.message || 'Erro desconhecido.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Editar Informações Pessoais
        </h2>
        
        {/* Mensagens de feedback */}
        {error && (
            <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
                {error}
            </p>
        )}
        {success && (
            <p className="p-3 mb-4 text-sm text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-lg">
                {success}
            </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo Nome */}
            <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo
                </label>
                <div className="relative">
                    <input
                        id="nome"
                        name="nome"
                        type="text"
                        required
                        value={formData.nome}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                        className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                    />
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Icon icon={faUser} className="h-4 w-4" />
                    </span>
                </div>
            </div>

            {/* Campo Email */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-mail
                </label>
                <div className="relative">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu.email@exemplo.com"
                        className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                    />
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Icon icon={faEnvelope} className="h-4 w-4" />
                    </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    O e-mail pode ser diferente do login do Firebase.
                </p>
            </div>
            
            {/* Botão de Submissão */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <Icon icon={faSave} className={`h-5 w-5 mr-3 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Salvando Alterações...' : 'Salvar Perfil'}
                </button>
            </div>

        </form>
    </div>
  );
}
// src/components/perfil/FormularioPerfil.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Usuario } from '@/types/usuario';
// Importa o serviço de upload
import { uploadFotoPerfil } from '@/services/StorageService'; 
import { Icon } from '@/components/ui/Icon';
// Adicionado faImage, faIdCard, faPhone
import { faSave, faUser, faEnvelope, faImage, faIdCard, faPhone } from '@fortawesome/free-solid-svg-icons';

/**
 * Interface para os dados do formulário (apenas campos editáveis)
 */
interface PerfilFormData {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
}

// Funções de formatação de exibição (usadas apenas no input)
const displayCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    return match ? `${match[1]}.${match[2]}.${match[3]}-${match[4]}` : value;
};

const displayTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let match;
    if (cleaned.length === 11) {
        match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
    }
    if (cleaned.length === 10) {
        match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
    }
    return value;
};


/**
 * @fileoverview Formulário para edição das informações pessoais do Proprietário.
 * CORRIGIDO: Lógica de upload e fallback de foto de perfil ajustadas.
 */
export default function FormularioPerfil() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  
  // --- ESTADOS PARA FOTO DE PERFIL ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Inicializa o preview com a foto atual do usuário
  const [filePreview, setFilePreview] = useState<string | null>(user?.fotoUrl || null); 
  // ----------------------------------------
    
  // Estado inicial do formulário (baseado no usuário logado)
  const [formData, setFormData] = useState<PerfilFormData>({
    nome: user?.nome || '',
    email: user?.email || '',
    cpf: user?.cpf || '',
    telefone: user?.telefone || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Efeito para criar o preview da imagem
  useEffect(() => {
    if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    } else if (user?.fotoUrl) {
         setFilePreview(user.fotoUrl);
    } else {
         setFilePreview(null);
    }
  }, [selectedFile, user?.fotoUrl]);

  useEffect(() => {
    if (!user) {
        router.push('/login');
    }
  }, [user, router]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    
    // Handler para o campo de arquivo
    if (name === 'fotoPerfil' && files && files.length > 0) {
        setSelectedFile(files[0]);
        // Não retorna aqui, permite que o restante do handler processe
    }

    // Filtra caracteres não numéricos para CPF e Telefone (melhora a usabilidade para salvar limpo)
    let cleanedValue = value;
    if (name === 'cpf' || name === 'telefone') {
        // Remove apenas não-dígitos para garantir que o estado interno salve o valor "limpo"
        cleanedValue = value.replace(/\D/g, ''); 
    }
    
    // Atualiza apenas se for um campo do formulário (não o campo file)
    if (name !== 'fotoPerfil') {
        setFormData(prevData => ({
          ...prevData,
          [name]: cleanedValue,
        }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
    }

    // Validação básica
    if (!formData.nome || !formData.email || !formData.cpf || !formData.telefone) {
      setError("Todos os campos pessoais (Nome, E-mail, CPF e Telefone) são obrigatórios.");
      setLoading(false);
      return;
    }
    
    try {
        let fotoUrl: string | undefined;

        if (selectedFile) {
            // 1. Upload da foto de perfil para o Storage
            // IMPORTANTE: Se o erro de CORS persistir, a chamada abaixo falhará.
            fotoUrl = await uploadFotoPerfil(selectedFile, user.id); 
            console.log('Upload de foto concluído:', fotoUrl);
        } else if (filePreview === null) {
            // Caso o usuário tenha removido a foto e não tenha selecionado uma nova (Limpar a foto)
             fotoUrl = ''; 
        }
        
        // 2. Atualiza o perfil do usuário (incluindo o novo URL da foto, se houver)
        const updatePayload: Partial<Usuario> = {
            ...formData,
            // Adiciona a URL apenas se o upload foi feito OU se a foto foi limpa
            ...(fotoUrl !== undefined ? { fotoUrl } : {}) 
        };

        await updateUser(updatePayload); 
        
        setSuccess("Perfil e foto atualizados com sucesso!");
        setSelectedFile(null); 
        
        // Redireciona para a página de visualização após o sucesso
        setTimeout(() => {
            router.push('/perfil');
        }, 1500);

    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      // Inclui instrução para verificar o CORS, pois é o problema mais provável neste ponto
      setError(`Falha ao atualizar o perfil. Detalhe: ${err.message || 'Erro desconhecido.'}. **Verifique o CORS no Firebase Storage!**`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemovePhoto = () => {
    setSelectedFile(null); // Limpa o arquivo selecionado
    setFilePreview(null);  // Limpa o preview para forçar o placeholder
    // O submit enviará fotoUrl: '' para limpar o valor no store
  };


  
  if (!user) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Editar Informações Pessoais
        </h2>
        
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
            
            {/* CAMPO DE FOTO DE PERFIL */}
            <div className="flex items-center space-x-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
                <div className="relative w-24 h-24">
                    {/* Imagem de Preview/Foto Atual */}
                    {filePreview ? (
                        <img 
                            src={filePreview} 
                            alt="Preview da Foto de Perfil" 
                            className="w-full h-full object-cover rounded-full border-4 border-rentou-primary shadow-lg"
                        />
                    ) : (
                        <div className="w-full h-full bg-blue-500 dark:bg-zinc-700 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                            {user.nome[0]}
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col space-y-2">
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Atualizar Foto</p>
                    <div className='flex space-x-3'>
                        <label htmlFor="fotoPerfil" className="cursor-pointer">
                            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rentou-primary hover:bg-blue-700 transition-colors">
                                <Icon icon={faImage} className="w-4 h-4 mr-2" />
                                {selectedFile ? 'Trocar Arquivo' : (user.fotoUrl ? 'Alterar Foto' : 'Selecionar Foto')}
                            </span>
                            <input
                                id="fotoPerfil"
                                name="fotoPerfil"
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                                className="sr-only" // Esconde o input original
                            />
                        </label>
                        
                        {(user.fotoUrl || selectedFile) && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors dark:bg-zinc-700 dark:text-red-400 dark:hover:bg-zinc-600"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                     {selectedFile && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            **{selectedFile.name}** pronto para upload.
                        </p>
                    )}
                </div>
            </div>
            {/* FIM: CAMPO DE FOTO DE PERFIL */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            disabled={user.tipo !== 'ADMIN'} 
                        />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Icon icon={faEnvelope} className="h-4 w-4" />
                        </span>
                    </div>
                    {user.tipo !== 'ADMIN' && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">E-mail de login é protegido. Contate o suporte para alteração.</p>}
                </div>
            </div>
            
            {/* NOVO: Linha para CPF e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                {/* Campo CPF */}
                <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CPF
                    </label>
                    <div className="relative">
                        <input
                            id="cpf"
                            name="cpf"
                            type="text"
                            required
                            value={displayCpf(formData.cpf)} 
                            onChange={handleChange}
                            placeholder="123.456.789-00"
                            maxLength={14} 
                            className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Icon icon={faIdCard} className="h-4 w-4" />
                        </span>
                    </div>
                </div>

                {/* Campo Telefone */}
                <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefone de Contato
                    </label>
                    <div className="relative">
                        <input
                            id="telefone"
                            name="telefone"
                            type="tel"
                            required
                            value={displayTelefone(formData.telefone)}
                            onChange={handleChange}
                            placeholder="(11) 99999-9999"
                            maxLength={15} 
                            className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Icon icon={faPhone} className="h-4 w-4" />
                        </span>
                    </div>
                </div>
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
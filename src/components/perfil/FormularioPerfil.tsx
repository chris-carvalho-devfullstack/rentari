// src/components/perfil/FormularioPerfil.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Usuario } from '@/types/usuario';
import { uploadFotoPerfil } from '@/services/StorageService'; 
import { Icon } from '@/components/ui/Icon';
// Adicionado faTrash e faExclamationTriangle para o botão de excluir
import { faSave, faUser, faEnvelope, faImage, faIdCard, faPhone, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface PerfilFormData {
    nome: string;
    email: string;
    documentoIdentificacao: string; 
    telefone: string;
}

const displayDocumento = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
        return match ? `${match[1]}.${match[2]}.${match[3]}-${match[4]}` : value;
    }
    if (cleaned.length === 14) {
        const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
        return match ? `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}` : value;
    }
    return value;
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

export default function FormularioPerfil() {
  // Importa a nova função deleteAccount
  const { user, updateUser, deleteAccount } = useAuthStore();
  const router = useRouter();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(user?.fotoUrl || null); 
    
  const [formData, setFormData] = useState<PerfilFormData>({
    nome: user?.nome || '',
    email: user?.email || '',
    documentoIdentificacao: user?.documentoIdentificacao?.replace(/\D/g, '') || user?.cpf || '',
    telefone: user?.telefone || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false); // Estado para loading da exclusão
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    
    if (name === 'fotoPerfil' && files && files.length > 0) {
        setSelectedFile(files[0]);
    }

    let cleanedValue = value;
    if (name === 'documentoIdentificacao' || name === 'telefone') {
        cleanedValue = value.replace(/\D/g, ''); 
    }
    
    if (name !== 'fotoPerfil') {
        setFormData(prevData => ({
          ...prevData,
          [name]: cleanedValue,
        }));
    }
  }, []);

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

    if (!formData.nome || !formData.email || !formData.documentoIdentificacao || !formData.telefone) {
      setError("Todos os campos básicos (Nome, E-mail, CPF/CNPJ e Telefone) são obrigatórios.");
      setLoading(false);
      return;
    }
    
    try {
        let fotoUrl: string | undefined;

        if (selectedFile) {
            fotoUrl = await uploadFotoPerfil(selectedFile, user.id); 
        } else if (filePreview === null) {
             fotoUrl = ''; 
        }
        
        const cleanDoc = formData.documentoIdentificacao.replace(/\D/g, '');
        
        const updatePayload: Partial<Usuario> = {
            nome: formData.nome,
            telefone: formData.telefone,
            cpf: cleanDoc.length === 11 ? cleanDoc : undefined,
            documentoIdentificacao: displayDocumento(cleanDoc),
            ...(fotoUrl !== undefined ? { fotoUrl } : {}) 
        };
        
        await updateUser(updatePayload); 
        
        setSuccess("Perfil e foto atualizados com sucesso!");
        setSelectedFile(null); 
        
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
  
  const handleRemovePhoto = () => {
    setSelectedFile(null); 
    setFilePreview(null);  
  };

  // --- FUNÇÃO DE EXCLUSÃO DE CONTA ---
  const handleDeleteAccount = async () => {
      if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir sua conta permanentemente? Todos os seus dados e imóveis serão perdidos. Esta ação é irreversível.")) {
          return;
      }
      
      // Segunda confirmação para segurança
      if (!window.confirm("Confirmação Final: Deseja realmente apagar sua conta e sair do sistema?")) {
          return;
      }

      setDeleteLoading(true);
      setError(null);

      try {
          await deleteAccount();
          router.push('/'); // Redireciona para home após exclusão
      } catch (err: any) {
          console.error("Erro ao excluir conta:", err);
          setError(err.message || "Erro ao excluir conta.");
          setDeleteLoading(false);
      }
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
                                className="sr-only"
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
            
            {/* Campos do Formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                    <div className="relative">
                        <input id="nome" name="nome" type="text" required value={formData.nome} onChange={handleChange} placeholder="Seu nome completo" className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary" />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Icon icon={faUser} className="h-4 w-4" /></span>
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                    <div className="relative">
                        <input id="email" name="email" type="email" required value={formData.email} placeholder="seu.email@exemplo.com" className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary" disabled />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Icon icon={faEnvelope} className="h-4 w-4" /></span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">E-mail de login é protegido.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                <div>
                    <label htmlFor="documentoIdentificacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF ou CNPJ</label>
                    <div className="relative">
                        <input id="documentoIdentificacao" name="documentoIdentificacao" type="text" required value={displayDocumento(formData.documentoIdentificacao)} onChange={handleChange} placeholder="123.456.789-00" maxLength={18} className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary" />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Icon icon={faIdCard} className="h-4 w-4" /></span>
                    </div>
                </div>

                <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone de Contato</label>
                    <div className="relative">
                        <input id="telefone" name="telefone" type="tel" required value={displayTelefone(formData.telefone)} onChange={handleChange} placeholder="(11) 99999-9999" maxLength={15} className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary" />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Icon icon={faPhone} className="h-4 w-4" /></span>
                    </div>
                </div>
            </div>
            
            {/* Botão de Submissão Principal */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading || deleteLoading}
                    className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <Icon icon={faSave} className={`h-5 w-5 mr-3 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Salvando Alterações...' : 'Salvar Perfil'}
                </button>
            </div>

        </form>
        
        {/* --- ZONA DE PERIGO (EXCLUIR CONTA) --- */}
        <div className="mt-12 pt-8 border-t-2 border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center mb-2">
                <Icon icon={faExclamationTriangle} className="w-5 h-5 mr-2" />
                
            </h3>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="font-semibold">Excluir sua conta permanentemente</p>
                    <p>Uma vez excluída, todos os seus dados, imóveis e histórico serão removidos e não poderão ser recuperados.</p>
                </div>
                <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || loading}
                    className={`whitespace-nowrap px-4 py-2 bg-white border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors text-sm font-bold shadow-sm dark:bg-transparent dark:hover:bg-red-700 ${
                        deleteLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {deleteLoading ? 'Excluindo...' : 'Excluir Conta'}
                </button>
            </div>
        </div>
        {/* --- FIM ZONA DE PERIGO --- */}

    </div>
  );
}
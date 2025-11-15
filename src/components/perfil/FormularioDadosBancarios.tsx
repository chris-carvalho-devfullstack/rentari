// src/components/perfil/FormularioDadosBancarios.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Usuario } from '@/types/usuario';
import { Icon } from '@/components/ui/Icon';
import { faSave, faBuildingColumns, faCreditCard, faKey, faMobileAlt, faAt } from '@fortawesome/free-solid-svg-icons';

type PixTipo = Usuario['dadosBancarios']['pixTipo'];
type TipoConta = Usuario['dadosBancarios']['tipo'];

/**
 * @fileoverview Formulário para edição dos dados bancários e chave PIX do Proprietário.
 * ATUALIZADO: Inclui a seleção de Tipo de Conta (Corrente/Poupança).
 */
export default function FormularioDadosBancarios() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  
  // Estado inicial do formulário (baseado nos dados bancários do usuário logado)
  const [formData, setFormData] = useState<Usuario['dadosBancarios']>({
    banco: user?.dadosBancarios.banco || '',
    agencia: user?.dadosBancarios.agencia || '',
    conta: user?.dadosBancarios.conta || '',
    tipo: user?.dadosBancarios.tipo || 'CORRENTE', // NOVO: Inicializado com o tipo existente ou 'CORRENTE'
    pixTipo: user?.dadosBancarios.pixTipo || 'EMAIL',
    pixChave: user?.dadosBancarios.pixChave || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prevData => ({
        ...prevData,
        [name]: value,
    }));
  };
  
  const handlePixTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPixType = e.target.value as PixTipo;
      setFormData(prevData => ({
          ...prevData,
          pixTipo: newPixType,
          pixChave: '', // Limpa a chave ao mudar o tipo
      }));
  };
  
  const handleTipoContaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTipoConta = e.target.value as TipoConta;
      setFormData(prevData => ({
          ...prevData,
          tipo: newTipoConta,
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validação básica
    if (!formData.banco || !formData.agencia || !formData.conta || !formData.pixChave) {
      setError("Preencha todos os campos obrigatórios (Banco, Agência, Conta e Chave PIX).");
      setLoading(false);
      return;
    }
    
    try {
        // Envia APENAS a subestrutura de dadosBancarios dentro de um objeto parcial
        await updateUser({ dadosBancarios: formData }); 
        
        setSuccess("Dados bancários e PIX atualizados com sucesso!");
        
        // Redireciona após o sucesso
        setTimeout(() => {
            router.push('/perfil');
        }, 1500);

    } catch (err: any) {
      console.error('Erro ao atualizar dados bancários:', err);
      setError(`Falha ao atualizar dados. Detalhe: ${err.message || 'Erro desconhecido.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
             <Icon icon={faCreditCard} className="w-6 h-6 mr-3 text-rentou-primary" />
             Editar Dados Bancários e PIX
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
            Estes dados são usados para o repasse dos aluguéis e pagamentos.
        </p>
        
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
            
            {/* Seção Dados Bancários */}
            <div className='space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-zinc-700'>
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <Icon icon={faBuildingColumns} className="w-4 h-4 mr-2" /> Conta Corrente/Poupança
                </h3>
                
                {/* Banco */}
                <div>
                    <label htmlFor="banco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome do Banco
                    </label>
                    <input
                        id="banco"
                        name="banco"
                        type="text"
                        required
                        value={formData.banco}
                        onChange={handleChange}
                        placeholder="Ex: Banco do Brasil, Itaú, NuBank"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                    />
                </div>
                
                {/* Agência e Conta */}
                <div className='grid grid-cols-3 gap-4'>
                    <div>
                        <label htmlFor="agencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Agência
                        </label>
                        <input
                            id="agencia"
                            name="agencia"
                            type="text"
                            required
                            value={formData.agencia}
                            onChange={handleChange}
                            placeholder="Ex: 0001"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="conta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Conta (com dígito)
                        </label>
                        <input
                            id="conta"
                            name="conta"
                            type="text"
                            required
                            value={formData.conta}
                            onChange={handleChange}
                            placeholder="Ex: 123456-7"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                    </div>
                    {/* NOVO: Tipo de Conta */}
                    <div>
                        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Conta
                        </label>
                        <select
                            id="tipo"
                            name="tipo"
                            required
                            value={formData.tipo}
                            onChange={handleTipoContaChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        >
                            <option value="CORRENTE">Corrente</option>
                            <option value="POUPANCA">Poupança</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Seção PIX */}
             <div className='space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-zinc-700'>
                 <h3 className="text-lg font-semibold text-rentou-primary dark:text-blue-400 flex items-center">
                    <Icon icon={faKey} className="w-4 h-4 mr-2" /> Chave PIX (Preferencial)
                </h3>

                {/* Tipo de Chave PIX */}
                <div>
                    <label htmlFor="pixTipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Chave
                    </label>
                    <select
                        id="pixTipo"
                        name="pixTipo"
                        required
                        value={formData.pixTipo}
                        onChange={handlePixTypeChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                    >
                        <option value="EMAIL">E-mail</option>
                        <option value="TELEFONE">Telefone</option>
                        <option value="CPF_CNPJ">CPF/CNPJ</option>
                        <option value="ALEATORIA">Chave Aleatória</option>
                    </select>
                </div>

                {/* Valor da Chave PIX */}
                <div>
                    <label htmlFor="pixChave" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Chave PIX
                    </label>
                    <div className="relative">
                        <input
                            id="pixChave"
                            name="pixChave"
                            type="text"
                            required
                            value={formData.pixChave}
                            onChange={handleChange}
                            placeholder={
                                formData.pixTipo === 'EMAIL' ? 'seu.email@exemplo.com' :
                                formData.pixTipo === 'TELEFONE' ? '(99) 99999-9999' :
                                formData.pixTipo === 'CPF_CNPJ' ? '123.456.789-00' :
                                'Chave Aleatória'
                            }
                            className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                             {formData.pixTipo === 'EMAIL' && <Icon icon={faAt} className="h-4 w-4" />}
                             {formData.pixTipo === 'TELEFONE' && <Icon icon={faMobileAlt} className="h-4 w-4" />}
                             {(formData.pixTipo === 'CPF_CNPJ' || formData.pixTipo === 'ALEATORIA') && <Icon icon={faKey} className="h-4 w-4" />}
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
                    {loading ? 'Salvando Dados...' : 'Salvar Dados Bancários'}
                </button>
            </div>

        </form>
    </div>
  );
}
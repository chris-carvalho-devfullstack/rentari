// src/components/imoveis/FormularioImovel.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NovoImovelData, adicionarNovoImovel, atualizarImovel } from '@/services/ImovelService';
import { Imovel } from '@/types/imovel'; 

interface FormularioImovelProps {
    // Se presente, estamos no modo de edição (Update).
    initialData?: Imovel;
}

/**
 * @fileoverview Formulário universal para a criação e edição de imóveis.
 * Se initialData for fornecido, ele inicia no modo de edição.
 */
export default function FormularioImovel({ initialData }: FormularioImovelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Imóvel Existente' : 'Adicionar Novo Imóvel';

  // Inicializa o estado do formulário usando initialData (para edição) ou valores padrão (para criação)
  const [formData, setFormData] = useState<NovoImovelData>({
    titulo: initialData?.titulo || '',
    endereco: initialData?.endereco || '',
    cidade: initialData?.cidade || '',
    status: initialData?.status || 'VAGO', 
    valorAluguel: initialData?.valorAluguel || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData((prevData) => ({
      ...prevData,
      // Garante que o valor seja um número para valorAluguel
      [name]: (type === 'number' && name === 'valorAluguel') ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (formData.valorAluguel <= 0 || isNaN(formData.valorAluguel)) {
        setError('O valor do aluguel deve ser um número maior que zero.');
        setLoading(false);
        return;
      }

      let result: Imovel;
      
      if (isEditing && initialData) {
        // Modo de Edição: Chama a função de atualização
        result = await atualizarImovel(initialData.id, formData);
        console.log('Imóvel atualizado com sucesso:', result);
      } else {
        // Modo de Criação: Chama a função de adição
        result = await adicionarNovoImovel(formData);
        console.log('Imóvel adicionado com sucesso:', result);
      }
      
      // Redireciona para a lista de imóveis após o sucesso
      router.push('/imoveis');

    } catch (err) {
      console.error('Erro na operação de imóvel:', err);
      setError(`Falha ao ${isEditing ? 'atualizar' : 'adicionar'} o imóvel. Tente novamente mais tarde.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b pb-4">
        {formTitle}
      </h2>

      {error && (
        <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campos do Formulário... (Mantidos como na versão anterior) */}
        
        {/* Campo Título */}
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Imóvel</label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            value={formData.titulo}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
          />
        </div>

        {/* Campo Endereço */}
        <div>
          <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
          <input
            id="endereco"
            name="endereco"
            type="text"
            required
            value={formData.endereco}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
          />
        </div>

        {/* Campo Cidade/UF */}
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade e UF</label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            required
            value={formData.cidade}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
          />
        </div>
        
        {/* Campo Valor e Status (lado a lado) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Campo Valor Aluguel */}
            <div>
              <label htmlFor="valorAluguel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor do Aluguel (R$)</label>
              <input
                id="valorAluguel"
                name="valorAluguel"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.valorAluguel}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
              />
            </div>
            
            {/* Campo Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Inicial</label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
              >
                <option value="VAGO">VAGO (Pronto para anunciar)</option>
                <option value="ANUNCIADO">ANUNCIADO (Aguardando locação)</option>
                <option value="ALUGADO">ALUGADO (Já locado)</option>
              </select>
            </div>
        </div>


        {/* Botão de Submissão */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white !bg-rentou-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (isEditing ? 'Salvando...' : 'Adicionando...') : (isEditing ? 'Salvar Alterações' : 'Adicionar Imóvel')}
          </button>
        </div>
        
        {/* Botão de Cancelar */}
        <div className="text-center">
            <button
                type="button"
                onClick={() => router.push('/imoveis')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
            >
                Cancelar
            </button>
        </div>

      </form>
    </div>
  );
}
// src/app/(rentou)/imoveis/[id]/editar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FormularioImovel from '@/components/imoveis/FormularioImovel';
import { fetchImovelPorId } from '@/services/ImovelService';
import { Imovel } from '@/types/imovel';

/**
 * @fileoverview Página para editar um imóvel existente.
 * Esta rota atende ao novo padrão: /imoveis/[id]/editar
 */
export default function EditarImovelPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id; 
    
    const [initialData, setInitialData] = useState<Imovel | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Efeito para carregar os dados do imóvel a ser editado
    useEffect(() => {
        if (!id) {
            setError('ID do imóvel não encontrado.');
            setLoading(false);
            return;
        }

        const loadImovel = async () => {
            setLoading(true);
            try {
                // Força o ID para string para a função de serviço
                const data = await fetchImovelPorId(id as string); 
                setInitialData(data);
            } catch (err) {
                console.error('Erro ao buscar imóvel para edição:', err);
                setError(err instanceof Error ? err.message : 'Falha ao carregar os dados do imóvel para edição.');
            } finally {
                setLoading(false);
            }
        };

        loadImovel();
    }, [id]);

    if (loading) {
        return <div className="flex justify-center items-center h-48"><p className="text-gray-600 dark:text-gray-300 font-medium">Carregando dados para edição...</p></div>;
    }

    if (error || !initialData) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Erro:</strong>
                <span className="block sm:inline"> {error || `O imóvel com ID ${id} não pôde ser carregado para edição.`}</span>
                <Link href="/imoveis" className="ml-4 font-semibold hover:underline text-blue-700">Voltar para a lista</Link>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Link para voltar ao Hub de Gerenciamento do Imóvel */}
            <Link href={`/imoveis/${id}`} className="text-rentou-primary hover:underline font-medium text-sm">
                ← Voltar para Gerenciamento do Imóvel
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Editar: {initialData.titulo}</h1>
            <p className="text-gray-600 dark:text-gray-400">
                Altere as informações necessárias e salve para atualizar o registro do imóvel.
            </p>

            <FormularioImovel initialData={initialData} />
        </div>
    );
}
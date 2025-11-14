// src/app/(rentou)/imoveis/[id]/editar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next'; // Mantemos o import por hábito, mas não é usado em Client Components
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FormularioImovel from '@/components/imoveis/FormularioImovel';
import { fetchImovelPorId } from '@/services/ImovelService';
import { Imovel } from '@/types/imovel';

/**
 * @fileoverview Página de edição de um imóvel específico.
 * Usa o hook useParams do Next.js para obter o ID da rota dinâmica.
 */

// Define o componente da página de edição
export default function EditarImovelPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [imovel, setImovel] = useState<Imovel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('ID do imóvel não encontrado na rota.');
            setLoading(false);
            return;
        }

        const loadImovel = async () => {
            try {
                const data = await fetchImovelPorId(id as string);
                if (data) {
                    setImovel(data);
                } else {
                    setError('Imóvel não encontrado.');
                }
            } catch (err) {
                console.error('Erro ao buscar imóvel para edição:', err);
                setError('Falha ao carregar os dados do imóvel.');
            } finally {
                setLoading(false);
            }
        };

        loadImovel();
    }, [id]);
    
    // Conteúdo de Carregamento
    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <p className="text-gray-600 dark:text-gray-300 font-medium">Carregando dados para edição...</p>
            </div>
        );
    }
    
    // Conteúdo de Erro
    if (error || !imovel) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Erro:</strong>
                <span className="block sm:inline"> {error || 'O imóvel solicitado não pôde ser carregado.'}</span>
                <Link href="/imoveis" className="ml-4 font-semibold hover:underline text-blue-700">Voltar</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link href="/imoveis" className="text-rentou-primary hover:underline font-medium text-sm">
                ← Voltar para Lista de Imóveis
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Editar: {imovel.titulo}</h1>
            <p className="text-gray-600 dark:text-gray-400">
                Altere as informações necessárias e salve as modificações.
            </p>

            {/* Passa os dados do imóvel carregado para o formulário */}
            <FormularioImovel initialData={imovel} />
        </div>
    );
}
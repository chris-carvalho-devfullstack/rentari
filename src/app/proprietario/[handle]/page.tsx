// src/app/proprietario/[handle]/page.tsx
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAnunciosPublicos } from '@/hooks/useAnunciosPublicos'; 
import { AnuncioCard } from '@/components/anuncios/AnuncioCard';
import { Icon } from '@/components/ui/Icon';
import { faSpinner, faHome, faUserTie, faBuilding } from '@fortawesome/free-solid-svg-icons'; 

export const runtime = 'edge';

/**
 * @fileoverview Página Pública de Anúncios de um Proprietário específico (www.rentou.com.br/proprietario/[handle]).
 */
export default function ProprietarioAnunciosPage() {
    const params = useParams();
    const handle = Array.isArray(params.handle) ? params.handle[0] : params.handle;
    
    // Usa o hook com o handle do proprietário para filtrar
    const { anuncios, loading, error, proprietarioNome, proprietarioHandle } = useAnunciosPublicos(handle as string);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-zinc-900">
                <Icon icon={faSpinner} spin className="h-6 w-6 text-rentou-primary mr-3" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">Carregando anúncios do proprietário...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="text-center p-10 bg-red-100 text-red-700 rounded-lg m-8">
                <h1 className="text-xl font-bold">Erro ao carregar proprietário:</h1>
                <p className="mt-2">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            
            {/* Header / Perfil do Proprietário */}
            <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 py-8 mb-8">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
                    <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                        <Icon icon={faUserTie} className='w-6 h-6 text-rentou-primary' />
                        <p className="text-sm uppercase font-medium">Anunciado por:</p>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                        {proprietarioNome || 'Proprietário Rentou'}
                    </h1>
                     <p className="text-base text-gray-600 dark:text-gray-400">
                        <Icon icon={faHome} className='w-4 h-4 mr-2 inline-block' />
                        Veja todos os imóveis deste proprietário ({anuncios.length})
                    </p>
                    {proprietarioHandle && (
                        <p className="text-sm font-mono text-gray-400 dark:text-gray-500">@{proprietarioHandle}</p>
                    )}
                </div>
            </div>
            
            {/* CONTEÚDO PRINCIPAL (LISTAGEM) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {anuncios.length === 0 && (
                    <div className="text-center p-10 bg-white dark:bg-zinc-800 rounded-lg shadow">
                         <Icon icon={faBuilding} className="w-10 h-10 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Este proprietário não possui anúncios ativos no momento.</p>
                    </div>
                )}

                {/* GRID DE ANÚNCIOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {anuncios.map((imovel) => (
                        <AnuncioCard 
                            key={imovel.smartId} 
                            imovel={imovel} 
                            detailUrlPrefix="/anuncios" // Usamos a rota genérica para o detalhe
                        />
                    ))}
                </div>
            </div>
            
             <footer className="mt-12 text-center p-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-zinc-700">
                © {new Date().getFullYear()} Rentou. A gestão imobiliária inteligente.
            </footer>
        </div>
    );
}
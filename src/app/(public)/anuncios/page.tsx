// src/app/anuncios/page.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link'; 
import { useAnunciosPublicos } from '@/hooks/useAnunciosPublicos'; 
import { AnuncioCard } from '@/components/anuncios/AnuncioCard';
import { Icon } from '@/components/ui/Icon';
import { faSearch, faSpinner, faBuilding } from '@fortawesome/free-solid-svg-icons'; 

/**
 * @fileoverview Página Principal do Catálogo de Anúncios (www.rentou.com.br/anuncios).
 * Estilo Rightmove/Zillow (foco em busca e listagem).
 */
export default function AnunciosPage() {
    const { anuncios, loading, error } = useAnunciosPublicos();
    
    // Implementação mockada de filtro de busca para demonstrar a UI
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<'TODOS' | 'Residencial' | 'Comercial'>('TODOS');
    
    // Lógica para definir a URL de login com base no ambiente
    const loginUrl = process.env.NODE_ENV === 'development' 
        ? '/login'  // Em desenvolvimento (localhost), usa rota relativa
        : 'https://app.rentou.com.br/login'; // Em produção, força o subdomínio do App

    const filteredAnuncios = useMemo(() => {
        return anuncios.filter(anuncio => {
            const matchesSearch = anuncio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  anuncio.endereco.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  anuncio.endereco.bairro.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = filterCategory === 'TODOS' || anuncio.categoriaPrincipal === filterCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [anuncios, searchTerm, filterCategory]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-zinc-900">
                <Icon icon={faSpinner} spin className="h-6 w-6 text-rentou-primary mr-3" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">Carregando o catálogo de anúncios...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            
            {/* Navbar Minimalista */}
            <header className="sticky top-0 bg-white dark:bg-zinc-800 shadow z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-rentou-primary">Rentou Anúncios</h1>
                    
                    {/* Botão de Acesso Proprietário com Lógica de Ambiente */}
                    {/* Usamos a tag <a> para garantir a navegação externa correta em produção */}
                    <a 
                        href={loginUrl} 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-rentou-primary transition-colors cursor-pointer"
                    >
                        Acesso Proprietário
                    </a>
                </div>
            </header>
            
            {/* HERO SECTION / BARRA DE PESQUISA */}
            <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 py-6 mb-8">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        Imóveis para Locação no Brasil
                    </h2>
                    
                    {/* Barra de Pesquisa Estilo Rightmove */}
                    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 bg-gray-100 dark:bg-zinc-700 p-4 rounded-lg shadow-inner">
                        
                        {/* Input de Busca */}
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Buscar por Cidade, Bairro ou Smart ID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white rounded-lg focus:ring-rentou-primary focus:border-rentou-primary"
                            />
                            <Icon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        
                        {/* Filtro de Categoria */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as any)}
                            className="w-full md:w-56 px-4 py-3 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white rounded-lg focus:ring-rentou-primary focus:border-rentou-primary"
                        >
                            <option value="TODOS">Todas as Categorias</option>
                            <option value="Residencial">Residencial</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Rural">Rural</option>
                        </select>
                        
                    </div>
                </div>
            </div>
            
            {/* CONTEÚDO PRINCIPAL (LISTAGEM) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
                    {filteredAnuncios.length} {filteredAnuncios.length === 1 ? 'Anúncio Encontrado' : 'Anúncios Encontrados'}
                </h3>
                
                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">{error}</div>
                )}
                
                {filteredAnuncios.length === 0 && !error && (
                    <div className="text-center p-10 bg-white dark:bg-zinc-800 rounded-lg shadow">
                         <Icon icon={faBuilding} className="w-10 h-10 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Nenhum imóvel corresponde aos seus critérios de busca.</p>
                    </div>
                )}

                {/* GRID DE ANÚNCIOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAnuncios.map((imovel) => (
                        <AnuncioCard 
                            key={imovel.smartId} 
                            imovel={imovel} 
                            detailUrlPrefix="/anuncios"
                        />
                    ))}
                </div>
            </div>
            
            <footer className="mt-12 text-center p-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-zinc-700">
                © {new Date().getFullYear()} Rentou. Encontrando sua próxima locação.
            </footer>
        </div>
    );
}
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { listarCondominios } from '@/services/CondominioService';
import { Condominio } from '@/types/condominio';
import { CondominioCard } from '@/components/condominios/CondominioCard';
import { Icon } from '@/components/ui/Icon';
import { faBuilding, faPlus, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function CondominiosListPage() {
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await listarCondominios();
                setCondominios(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = condominios.filter(c => 
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.endereco.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.endereco.cidade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Icon icon={faSpinner} spin className="w-8 h-8 text-rentou-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Condomínios & Empreendimentos</h1>
                    <p className="text-gray-600 dark:text-gray-400">Gerencie o cadastro completo de edifícios e lançamentos.</p>
                </div>
                <Link href="/condominios/novo" className="px-4 py-2 bg-rentou-primary text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition flex items-center justify-center">
                    <Icon icon={faPlus} className="mr-2" /> Novo Condomínio
                </Link>
            </div>

            {/* Barra de Busca */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon icon={faSearch} className="text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Buscar por nome, bairro ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-rentou-primary outline-none shadow-sm"
                />
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(condo => (
                        <CondominioCard key={condo.id} condominio={condo} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                    <Icon icon={faBuilding} className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Nenhum condomínio encontrado.</p>
                </div>
            )}
        </div>
    );
}
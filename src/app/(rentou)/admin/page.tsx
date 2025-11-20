// src/app/(rentou)/admin/page.tsx
'use client';

import React from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { CacheInspector } from '@/components/admin/CacheInspector';
import { Icon } from '@/components/ui/Icon';
import { faChartLine, faCoins, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

// Dados Mockados para simular a visão futura (quando tivermos Analytics no banco)
const MOCK_STATS = [
    { label: 'Requisições Hoje', value: '1,240', change: '+12%', icon: faChartLine, color: 'text-blue-500' },
    { label: 'Taxa de Cache Hit', value: '94.5%', change: '+5%', icon: faShieldAlt, color: 'text-green-500' },
    { label: 'Custo Estimado (Mapbox)', value: 'R$ 0,00', change: '-100%', icon: faCoins, color: 'text-yellow-500' },
];

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();

    // Proteção básica de renderização (A proteção real deve ser no Middleware)
    if (user?.tipo !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
                <p className="text-gray-600">Esta área é restrita para administradores do sistema.</p>
                <button onClick={() => router.push('/dashboard')} className="mt-4 text-blue-600 hover:underline">Voltar ao Dashboard</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Super Admin <span className="text-sm font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2">Beta</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Controle de infraestrutura, cache e custos.</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOCK_STATS.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')}`}>
                                <Icon icon={stat.icon} className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{stat.change}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Ferramentas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Coluna 1: Inspetor de Cache */}
                <div className="space-y-6">
                    <CacheInspector />
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Estratégia de Cache Ativa</h4>
                        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                            <li><strong>Browser Cache:</strong> 20 dias (Navegação instantânea)</li>
                            <li><strong>Edge Cache (Vercel/CF):</strong> 20 dias (Proteção de API)</li>
                            <li><strong>Stale-While-Revalidate:</strong> 1 dia (Atualização silenciosa)</li>
                            <li><strong>API Mapbox:</strong> Chamada apenas em caso de MISS total.</li>
                        </ul>
                    </div>
                </div>

                {/* Coluna 2: Imóveis Populares (Mock por enquanto) */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Imóveis com Maior Carga de Requisições
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Smart ID</th>
                                    <th className="px-4 py-3">Visualizações</th>
                                    <th className="px-4 py-3">Cache Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Dados simulados - Futuramente conectar com Firestore */}
                                <tr className="border-b dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">RS0311...X9Y</td>
                                    <td className="px-4 py-3">1,042</td>
                                    <td className="px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">98% HIT</span></td>
                                </tr>
                                <tr className="border-b dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">CM0102...A2B</td>
                                    <td className="px-4 py-3">856</td>
                                    <td className="px-4 py-3"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">92% HIT</span></td>
                                </tr>
                                <tr className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">RU0500...K7L</td>
                                    <td className="px-4 py-3">120</td>
                                    <td className="px-4 py-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">MISS RECENTE</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 italic text-center">
                        *Dados de visualização simulados. Implementar contador no Firestore para dados reais.
                    </p>
                </div>
            </div>
        </div>
    );
}
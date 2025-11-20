// src/app/(inquilino)/meu-espaco/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { faHeart, faCalendarCheck, faFileContract, faSearch, faMapPin, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useRouter } from 'next/navigation';

// Função de cálculo de distância (mesma usada no PoiList)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
};

export default function TenantDashboard() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (!user) {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
            <header className="max-w-5xl mx-auto mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Olá, {user.nome?.split(' ')[0]} 👋</h1>
                    <p className="text-gray-600 dark:text-gray-400">Bem-vindo ao seu espaço exclusivo.</p>
                </div>
                <div className="flex space-x-4">
                     <Link href="/anuncios" className="px-5 py-2.5 bg-rentou-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-lg font-medium">
                        <Icon icon={faSearch} className="w-4 h-4 mr-2" /> Buscar Imóveis
                    </Link>
                    <button onClick={handleLogout} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center font-medium dark:bg-zinc-800 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700">
                        <Icon icon={faSignOutAlt} className="w-4 h-4 mr-2" /> Sair
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Card Favoritos */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-zinc-700">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                        <Icon icon={faHeart} className="w-6 h-6 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Meus Favoritos</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Acesse rapidamente os imóveis que você curtiu para revisar.</p>
                    <button className="text-rentou-primary text-sm font-semibold hover:underline">Ver lista de desejos →</button>
                </div>

                {/* Card Visitas */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-zinc-700">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                        <Icon icon={faCalendarCheck} className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Visitas Agendadas</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Gerencie suas próximas visitas aos imóveis e veja o histórico.</p>
                    <button className="text-rentou-primary text-sm font-semibold hover:underline">Ver agenda →</button>
                </div>

                {/* Card Propostas */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-zinc-700">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <Icon icon={faFileContract} className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Propostas & Contratos</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Acompanhe o status das suas propostas e documentos de locação.</p>
                    <button className="text-rentou-primary text-sm font-semibold hover:underline">Ver status →</button>
                </div>
            </div>
            
            {/* Seção de Pontos Importantes */}
            <div className="max-w-5xl mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-white dark:from-zinc-800 dark:to-zinc-800/50 border border-blue-100 dark:border-zinc-700 rounded-xl p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                <Icon icon={faMapPin} className="w-5 h-5 mr-2 text-rentou-primary" />
                                Seus Pontos de Interesse
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Estes endereços são usados para calcular a distância automaticamente nos mapas dos anúncios.
                            </p>
                        </div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                            {user.pontosImportantes?.length || 0} / 3
                        </div>
                    </div>
                    
                    {user.pontosImportantes && user.pontosImportantes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {user.pontosImportantes.map((pt, idx) => (
                                <div key={idx} className="bg-white dark:bg-zinc-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-600 hover:border-rentou-primary transition-colors group">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold block text-gray-800 dark:text-gray-200">{pt.nome}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate block mt-1">{pt.endereco}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-white/50 dark:bg-zinc-700/30 rounded-lg border border-dashed border-gray-300 dark:border-zinc-600">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Você ainda não salvou pontos importantes (ex: Trabalho, Casa da Mãe). <br/>
                                Navegue pelos anúncios e adicione pontos diretamente no mapa para vê-los aqui.
                            </p>
                            <Link href="/anuncios" className="inline-block mt-3 text-sm text-rentou-primary font-medium hover:underline">Ir para Anúncios</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
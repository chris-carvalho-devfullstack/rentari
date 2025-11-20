// src/components/admin/CacheInspector.tsx
'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { 
    faSearch, faCloud, faSync, faMapMarkerAlt, faCheck, faShieldAlt, 
    faTimes, faList // <-- Novos ícones adicionados
} from '@fortawesome/free-solid-svg-icons';
import { fetchImovelPorSmartId } from '@/services/ImovelService';
import { Imovel } from '@/types/imovel';

// Lista de tags para auditar
const POI_TAGS = ['school', 'bus_station', 'station', 'supermarket', 'hospital'];

interface CacheResult {
    tag: string;
    status: number;
    cfStatus: string;
    age: string;
    latency: string;
    itemCount: number | string;
    size: string;
    isSafeMiss?: boolean;
}

// --- NOVO COMPONENTE: MODAL DE RESULTADOS ---
const AuditResultsModal = ({ isOpen, onClose, results }: { isOpen: boolean, onClose: () => void, results: CacheResult[] }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-4xl w-full p-6 relative animate-in zoom-in-95 flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header do Modal */}
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-zinc-700 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <Icon icon={faList} className="w-5 h-5 mr-3 text-orange-500" />
                            Resultados da Auditoria Individual
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Análise detalhada de cache para as coordenadas fornecidas.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <Icon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabela de Resultados (Movida para cá) */}
                <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-zinc-700 mb-6">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-zinc-900 dark:text-gray-300 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Categoria (Tag)</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Age (s)</th>
                                <th className="px-4 py-3 text-center">Latência</th>
                                <th className="px-4 py-3 text-right">Resultado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-800">
                            {results.map((res) => (
                                <tr key={res.tag} className="border-b dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize border-l-4 border-transparent hover:border-rentou-primary">
                                        {res.tag.replace('_', ' ')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            !res.isSafeMiss ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {res.cfStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono text-blue-600 dark:text-blue-400">
                                        {res.age}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                                        {res.latency}ms
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                                        {res.isSafeMiss ? (
                                            <span className="text-orange-600 font-bold text-xs">API Poupada (MISS)</span>
                                        ) : (
                                            <><strong>{res.itemCount}</strong> <span className="text-xs opacity-50">({res.size} KB)</span></>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Nota de Auditoria (Movida para cá) */}
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-200 dark:border-blue-800/30 flex items-start mb-4">
                    <Icon icon={faShieldAlt} className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <div>
                        <p className='font-bold text-blue-700 dark:text-blue-400'>Modo Auditoria Segura Ativado</p>
                        <p>
                            Se a Cloudflare não tiver o cache (MISS), a API retorna <code>MISS (Safe)</code> e <strong>não consome a cota do Mapbox</strong>.
                            Se aparecer <code>HIT</code> e contagem de itens, significa que os dados reais estão cacheados.
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 font-medium text-sm transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- FIM NOVO COMPONENTE ---

export const CacheInspector = () => {
    // Estado para busca por Smart ID
    const [searchSmartId, setSearchSmartId] = useState('');
    const [foundImovel, setFoundImovel] = useState<Imovel | null>(null);

    // Estados de Coordenadas (Manual ou Automático)
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    
    const [results, setResults] = useState<CacheResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchingImovel, setSearchingImovel] = useState(false);
    
    // Estado para controle do Modal
    const [showModal, setShowModal] = useState(false);

    // 1. Função para Buscar o Imóvel e preencher coordenadas
    const handleSearchImovel = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchSmartId) return;

        setSearchingImovel(true);
        setFoundImovel(null);
        setResults([]); // Limpa resultados anteriores

        try {
            const imovel = await fetchImovelPorSmartId(searchSmartId.trim());
            
            if (imovel && imovel.latitude && imovel.longitude) {
                setFoundImovel(imovel);
                setLat(String(imovel.latitude));
                setLon(String(imovel.longitude));
            } else {
                alert('Imóvel não encontrado ou sem coordenadas cadastradas.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao buscar imóvel.');
        } finally {
            setSearchingImovel(false);
        }
    };

    // 2. Função de Auditoria (CUSTO ZERO)
    const inspectAll = async () => {
        if (!lat || !lon) {
            alert("Coordenadas necessárias. Busque um imóvel ou digite manualmente.");
            return;
        }

        setLoading(true);
        setResults([]);
        
        const promises = POI_TAGS.map(async (tag) => {
            const url = `/api/pois?lat=${lat}&lon=${lon}&tag=${tag}`;
            const startTime = performance.now();
            
            try {
                const res = await fetch(url, { 
                    headers: { 'x-audit-mode': '1' },
                    cache: 'no-store' // <-- ADICIONADO: Força ignorar cache do navegador
                });
                
                const endTime = performance.now();
                const data = await res.json();
                
                const isAuditMiss = data.audit === 'miss';
                
                const cfStatus = res.headers.get('cf-cache-status') || (isAuditMiss ? 'MISS (Safe)' : 'HIT (Cloudflare)');
                const age = res.headers.get('age') || (isAuditMiss ? '0' : '> 0');
                
                return {
                    tag,
                    status: res.status,
                    cfStatus,
                    age,
                    latency: (endTime - startTime).toFixed(0),
                    itemCount: Array.isArray(data) ? data.length : 'Audit',
                    size: (JSON.stringify(data).length / 1024).toFixed(2),
                    isSafeMiss: isAuditMiss
                };

            } catch (error) {
                return {
                    tag,
                    status: 500,
                    cfStatus: 'ERROR',
                    age: '-',
                    latency: '-',
                    itemCount: 0,
                    size: '0'
                };
            }
        });

        const finalResults = await Promise.all(promises);
        setResults(finalResults);
        setLoading(false);
        
        // Abre o modal automaticamente após finalizar a auditoria
        setShowModal(true);
    };

    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Icon icon={faCloud} className="w-5 h-5 mr-2 text-orange-500" />
                Auditoria de Cache (GeoJSON & POIs)
            </h3>

            {/* --- ÁREA DE BUSCA POR SMART ID --- */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">
                    Passo 1: Selecionar Imóvel
                </label>
                <form onSubmit={handleSearchImovel} className="flex gap-2">
                    <input 
                        type="text" 
                        value={searchSmartId}
                        onChange={(e) => setSearchSmartId(e.target.value.toUpperCase())}
                        className="flex-1 p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600 font-mono text-sm uppercase placeholder:normal-case"
                        placeholder="Digite o Smart ID (ex: RS1124...)"
                    />
                    <button 
                        type="submit"
                        disabled={searchingImovel || !searchSmartId}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center"
                    >
                        {searchingImovel ? <Icon icon={faSync} spin /> : <Icon icon={faSearch} />}
                        <span className="ml-2 hidden sm:inline">Buscar</span>
                    </button>
                </form>

                {foundImovel && (
                    <div className="mt-3 flex items-start space-x-2 text-sm text-blue-800 dark:text-blue-200 animate-in fade-in">
                        <Icon icon={faCheck} className="mt-1" />
                        <div>
                            <strong>{foundImovel.titulo}</strong>
                            <p className="text-xs opacity-80">{foundImovel.endereco.logradouro}, {foundImovel.endereco.bairro}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- ÁREA TÉCNICA (COORDENADAS + AÇÃO) --- */}
            <div className="flex flex-col sm:flex-row gap-4 mb-2 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 opacity-90">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                        <Icon icon={faMapMarkerAlt} className="mr-1 w-3 h-3" /> Latitude
                    </label>
                    <input 
                        type="text" 
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600 font-mono text-sm text-gray-600"
                        placeholder="-00.0000"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                         <Icon icon={faMapMarkerAlt} className="mr-1 w-3 h-3" /> Longitude
                    </label>
                    <input 
                        type="text" 
                        value={lon}
                        onChange={(e) => setLon(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600 font-mono text-sm text-gray-600"
                        placeholder="-00.0000"
                    />
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={inspectAll}
                        disabled={loading || !lat}
                        className="h-10 w-full sm:w-auto bg-orange-600 text-white px-6 rounded hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center shadow-md"
                    >
                        {loading ? <Icon icon={faSync} spin className="mr-2" /> : <Icon icon={faShieldAlt} className="mr-2" />}
                        {loading ? 'Auditando...' : 'Verificar (Safe Mode)'}
                    </button>
                </div>
            </div>

            {/* Componente Modal de Resultados */}
            <AuditResultsModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                results={results} 
            />
            
            {/* Se o modal estiver fechado e houver resultados, mostra um botão para reabrir */}
            {!showModal && results.length > 0 && !loading && (
                <button 
                    onClick={() => setShowModal(true)}
                    className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-orange-600 underline transition-colors"
                >
                    Ver resultados da última auditoria
                </button>
            )}

        </div>
    );
};
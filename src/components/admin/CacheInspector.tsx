'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { faSearch, faCloud, faSync, faMapMarkerAlt, faCheck } from '@fortawesome/free-solid-svg-icons';
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
}

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

    // 2. Função de Auditoria
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
                // fetch com 'no-cache' força o navegador a ir até o Cloudflare
                // (não usa o cache de disco do browser, testando o servidor real)
                const res = await fetch(url, { cache: 'no-cache' });
                
                const endTime = performance.now();
                const data = await res.json();
                
                const cfStatus = res.headers.get('cf-cache-status') || 'UNK';
                const age = res.headers.get('age') || '0';
                
                return {
                    tag,
                    status: res.status,
                    cfStatus,
                    age,
                    latency: (endTime - startTime).toFixed(0),
                    itemCount: Array.isArray(data) ? data.length : 'Erro',
                    size: (JSON.stringify(data).length / 1024).toFixed(2)
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
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 opacity-90">
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
                        {loading ? <Icon icon={faSync} spin className="mr-2" /> : <Icon icon={faSync} className="mr-2" />}
                        {loading ? 'Auditando...' : 'Verificar Cache'}
                    </button>
                </div>
            </div>

            {/* --- RESULTADOS --- */}
            {results.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-700">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-zinc-900 dark:text-gray-300">
                            <tr>
                                <th className="px-4 py-3">Categoria (Tag)</th>
                                <th className="px-4 py-3 text-center">Status CF</th>
                                <th className="px-4 py-3 text-center">Age (s)</th>
                                <th className="px-4 py-3 text-center">Latência</th>
                                <th className="px-4 py-3 text-right">Itens</th>
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
                                            res.cfStatus === 'HIT' ? 'bg-green-100 text-green-800' : 
                                            res.cfStatus === 'DYNAMIC' || res.cfStatus === 'MISS' ? 'bg-yellow-100 text-yellow-800' : 
                                            res.cfStatus === 'UNK' ? 'bg-gray-100 text-gray-600' :
                                            'bg-red-100 text-red-800'
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
                                        <strong>{res.itemCount}</strong> <span className="text-xs opacity-50">({res.size} KB)</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* --- NOTA SOBRE 'UNK' --- */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded border border-yellow-200 dark:border-yellow-800/30 flex items-start">
                <Icon icon={faCloud} className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" />
                <div>
                    <p className='font-bold text-yellow-700 dark:text-yellow-500'>Vê "UNK" (Unknown)?</p>
                    <p>
                        Isso é normal em <code>localhost</code> ou se os headers CORS não estiverem expondo <code>cf-cache-status</code>. 
                        <br/>
                        <strong>Dica Pro:</strong> Se a latência for baixa (ex: &lt; 100ms) e o status for 200, provavelmente é um <strong>HIT</strong> (cacheado), mesmo que o navegador não mostre o header.
                    </p>
                </div>
            </div>
        </div>
    );
};
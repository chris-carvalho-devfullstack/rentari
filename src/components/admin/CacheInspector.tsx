'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { faSearch, faCheckCircle, faExclamationCircle, faClock, faServer, faCloud } from '@fortawesome/free-solid-svg-icons';

export const CacheInspector = () => {
    const [url, setUrl] = useState('/api/pois?lat=-21.785&lon=-46.560&tag=school');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const inspectUrl = async () => {
        setLoading(true);
        setResult(null);
        const startTime = performance.now();

        try {
            const res = await fetch(url);
            const endTime = performance.now();
            
            // Coleta dados dos Headers
            const headers: Record<string, string> = {};
            res.headers.forEach((val, key) => { headers[key] = val });

            const data = await res.json();
            const count = Array.isArray(data) ? data.length : 'N/A';

            setResult({
                status: res.status,
                latency: (endTime - startTime).toFixed(0),
                // Cloudflare Header específico
                cfStatus: headers['cf-cache-status'] || 'UNK',
                cfRay: headers['cf-ray'] || '-',
                age: headers['age'] || '0',
                cacheControl: headers['cache-control'],
                itemCount: count,
                size: JSON.stringify(data).length
            });

        } catch (error) {
            console.error(error);
            setResult({ error: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Icon icon={faCloud} className="w-5 h-5 mr-2 text-orange-500" />
                Diagnóstico Cloudflare Cache
            </h3>

            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 p-2 border rounded dark:bg-zinc-900 dark:border-zinc-600 font-mono text-sm text-gray-700 dark:text-gray-200"
                    placeholder="/api/..."
                />
                <button 
                    onClick={inspectUrl}
                    disabled={loading}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors"
                >
                    {loading ? 'Testando...' : 'Inspecionar'}
                </button>
            </div>

            {result && !result.error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 dark:bg-zinc-700/50 rounded border border-gray-200 dark:border-zinc-600">
                        <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">CF Cache Status</span>
                        <span className={`font-bold text-lg ${result.cfStatus === 'HIT' ? 'text-green-600' : result.cfStatus === 'MISS' ? 'text-yellow-600' : 'text-gray-600'}`}>
                            {result.cfStatus}
                        </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-zinc-700/50 rounded border border-gray-200 dark:border-zinc-600">
                        <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">Idade (Age)</span>
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {result.age}s
                        </span>
                        <span className="text-xs text-gray-400"> / 20 dias</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-zinc-700/50 rounded border border-gray-200 dark:border-zinc-600">
                        <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">Latência</span>
                        <span className="font-bold text-lg text-gray-700 dark:text-gray-200">
                            {result.latency}ms
                        </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-zinc-700/50 rounded border border-gray-200 dark:border-zinc-600">
                        <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">Itens Retornados</span>
                        <span className="font-bold text-lg text-gray-700 dark:text-gray-200">
                            {result.itemCount}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">({(result.size / 1024).toFixed(2)} KB)</span>
                    </div>
                    
                    <div className="col-span-full p-3 bg-gray-100 dark:bg-zinc-900 rounded font-mono text-xs break-all border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300">
                        <div className="mb-1"><strong>Cache-Control:</strong> {result.cacheControl}</div>
                        <div><strong>CF-Ray:</strong> {result.cfRay}</div>
                    </div>
                </div>
            )}
            
            {result?.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-100 dark:border-red-800">
                    Erro ao inspecionar a URL. Verifique se o servidor está rodando.
                </div>
            )}
        </div>
    );
};
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// 1. CORREÇÃO: Importação nomeada (com chaves)
import { Icon } from '@/components/ui/Icon'; 
// 2. CORREÇÃO: Importamos os ícones específicos que vamos usar
import { faMapMarkerAlt, faDatabase, faServer, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface ServiceHealth {
  status: 'online' | 'error' | 'unknown';
  latency: number;
  message: string;
}

interface HealthReport {
  timestamp: string;
  services: {
    database: ServiceHealth;
    cep: ServiceHealth;
    sistema: { uptime: number };
  };
}

export default function SystemStatusPage() {
  const router = useRouter();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/health', { cache: 'no-store' });
      const data = await res.json();
      setReport(data);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Falha no health check", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const renderStatusBadge = (service: ServiceHealth) => {
    const isOnline = service.status === 'online';
    const isError = service.status === 'error';
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
        isOnline ? 'bg-green-100 text-green-700 border-green-200' : 
        isError ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : isError ? 'bg-red-500' : 'bg-gray-400'}`} />
        {isOnline ? 'Operacional' : isError ? 'Erro' : 'Verificando...'}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()} 
            className="text-sm text-gray-500 hover:text-gray-800 mb-2 flex items-center gap-2 transition-colors"
          >
            {/* CORREÇÃO: Uso do ícone importado */}
            <Icon icon={faArrowLeft} className="w-3 h-3" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="text-blue-600">⚡</span> Monitoramento de Sistema
          </h1>
          <p className="text-gray-500 text-sm">
            Status em tempo real dos microsserviços e integrações.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
                Última checagem: {lastCheck ? lastCheck.toLocaleTimeString() : '-'}
            </span>
            <button
                onClick={checkHealth}
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {loading ? 'Rodando Diagnóstico...' : 'Atualizar Agora'}
            </button>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: SERVIÇO DE CEP */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                 {/* CORREÇÃO: Uso do ícone importado */}
                <Icon icon={faMapMarkerAlt} className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <Icon icon={faMapMarkerAlt} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                {report && renderStatusBadge(report.services.cep)}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">API de Endereços (CEP)</h3>
            <p className="text-sm text-gray-500 mb-4">Integração ViaCEP + BrasilAPI</p>
            
            <div className="border-t border-gray-100 dark:border-zinc-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Latência</span>
                    <span className={`font-mono font-medium ${
                        (report?.services.cep.latency || 0) > 1000 ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                        {report?.services.cep.latency}ms
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mensagem</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={report?.services.cep.message}>
                        {report?.services.cep.message || '-'}
                    </span>
                </div>
            </div>
        </div>

        {/* CARD 2: BANCO DE DADOS */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Icon icon={faDatabase} className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <Icon icon={faDatabase} className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                {report && renderStatusBadge(report.services.database)}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Banco de Dados</h3>
            <p className="text-sm text-gray-500 mb-4">Conexão Firebase / Firestore</p>
            
            <div className="border-t border-gray-100 dark:border-zinc-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Latência</span>
                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                        {report?.services.database.latency}ms
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="text-gray-700 dark:text-gray-300">
                        {report?.services.database.message || '-'}
                    </span>
                </div>
            </div>
        </div>

         {/* CARD 3: SISTEMA GERAL */}
         <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Icon icon={faServer} className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <Icon icon={faServer} className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-700 border-green-200">
                    Online
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sistema (Core)</h3>
            <p className="text-sm text-gray-500 mb-4">Next.js App Runtime</p>
            
            <div className="border-t border-gray-100 dark:border-zinc-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Uptime (Processo)</span>
                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                        {report?.services.sistema.uptime ? Math.floor(report.services.sistema.uptime) + 's' : '-'}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ambiente</span>
                    <span className="text-gray-700 dark:text-gray-300 uppercase">
                        {process.env.NODE_ENV}
                    </span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
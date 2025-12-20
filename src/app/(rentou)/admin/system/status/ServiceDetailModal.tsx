'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { 
    faTimes, faCheckCircle, faExclamationTriangle, faServer, faDatabase, 
    faMapMarkerAlt, faHistory, faMicrochip, faGlobeAmericas,
    faNetworkWired, faLightbulb
} from '@fortawesome/free-solid-svg-icons';

interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  data: any;
}

export const ServiceDetailModal = ({ isOpen, onClose, serviceName, data }: ServiceDetailModalProps) => {
  if (!isOpen || !data) return null;

  // Configurações visuais por serviço
  const config = {
    cep: {
      title: 'API de Endereços (CEP)',
      icon: faMapMarkerAlt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-100 dark:border-blue-800',
      description: 'Microserviço de geolocalização e normalização de endereços. Utiliza estratégia de Proxy com Fallback (ViaCEP → BrasilAPI) para garantir alta disponibilidade.'
    },
    database: {
      title: 'Banco de Dados (Firebase)',
      icon: faDatabase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-100 dark:border-orange-800',
      description: 'Conexão persistente com o Firestore (NoSQL). Responsável por armazenar usuários, imóveis e transações financeiras com sincronização em tempo real.'
    },
    sistema: {
      title: 'Infraestrutura Edge (Core)',
      icon: faServer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-100 dark:border-purple-800',
      description: 'Runtime Serverless distribuído globalmente pela Cloudflare. O código roda no Data Center mais próximo do usuário para latência mínima.'
    }
  }[serviceName] || { 
      title: 'Serviço', 
      icon: faServer, 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-100', 
      borderColor: 'border-gray-200', 
      description: '' 
  };

  const isOnline = data.status === 'online';
  
  // Define a qualidade da latência
  const getLatencyQuality = (ms: number) => {
      if (ms < 200) return { label: 'Excelente', color: 'bg-green-500', text: 'text-green-600' };
      if (ms < 800) return { label: 'Aceitável', color: 'bg-yellow-500', text: 'text-yellow-600' };
      return { label: 'Lenta', color: 'bg-red-500', text: 'text-red-600' };
  };
  
  const latencyQuality = getLatencyQuality(data.latency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Visual */}
        <div className={`relative p-6 border-b ${config.borderColor} flex items-start gap-5`}>
            <div className={`p-4 rounded-xl ${config.bgColor} shadow-sm shrink-0`}>
                <Icon icon={config.icon} className={`w-8 h-8 ${config.color}`} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{config.title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                        title="Fechar"
                    >
                        <Icon icon={faTimes} className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                        isOnline 
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800' 
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800'
                    }`}>
                        <Icon icon={isOnline ? faCheckCircle : faExclamationTriangle} className="w-3 h-3" />
                        {isOnline ? 'OPERACIONAL' : 'FALHA / ERRO'}
                    </span>
                    
                    {serviceName === 'sistema' && data.meta?.region && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800">
                            <Icon icon={faGlobeAmericas} className="w-3 h-3" />
                            {data.meta.region}
                        </span>
                    )}
                </div>
            </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Descrição e Contexto */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sobre o Serviço</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-l-4 border-gray-200 dark:border-zinc-700 pl-4 italic">
                    {config.description}
                </p>
            </div>

            {/* Métricas de Performance */}
            <div className="bg-gray-50 dark:bg-zinc-700/30 rounded-xl p-5 border border-gray-100 dark:border-zinc-700">
                <div className="flex justify-between items-end mb-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Icon icon={faHistory} /> Tempo de Resposta
                    </h4>
                    <span className={`text-sm font-bold ${latencyQuality.text}`}>
                        {data.latency}ms ({latencyQuality.label})
                    </span>
                </div>
                
                <div className="h-3 bg-gray-200 dark:bg-zinc-600 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-[20%] w-0.5 bg-white/50 z-10" title="200ms (Meta)"></div>
                    <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-white/50 z-10" title="800ms (Limite)"></div>
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${latencyQuality.color}`} 
                        style={{ width: `${Math.min((data.latency / 1000) * 100, 100)}%` }}
                    ></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-right">
                    Medido a partir do Data Center {serviceName === 'sistema' ? (data.meta?.region || 'Atual') : 'de Origem'}
                </p>
            </div>

            {/* Detalhes Técnicos */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon icon={faMicrochip} /> Especificações Técnicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Campos Comuns */}
                    <div className="p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg group hover:border-blue-300 transition-colors">
                        <span className="block text-[10px] text-gray-400 uppercase">Status Message</span>
                        <span className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate block select-all" title={data.message}>
                            {data.message || '-'}
                        </span>
                    </div>

                    {/* Campos Específicos: CEP */}
                    {serviceName === 'cep' && (
                        <>
                            <div className="p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg">
                                <span className="block text-[10px] text-gray-400 uppercase">Provider Ativo</span>
                                <span className="font-medium text-sm text-blue-600 dark:text-blue-400">
                                    {data.meta?.provider || 'Auto-Detect'}
                                </span>
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg">
                                <span className="block text-[10px] text-gray-400 uppercase">Target Test</span>
                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                    CEP {data.meta?.target}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Campos Específicos: Database */}
                    {serviceName === 'database' && (
                        <>
                            <div className="p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg">
                                <span className="block text-[10px] text-gray-400 uppercase">Project ID</span>
                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400 select-all">
                                    {data.meta?.projectId}
                                </span>
                            </div>
                             <div className="p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg">
                                <span className="block text-[10px] text-gray-400 uppercase">SDK</span>
                                <span className="font-medium text-sm text-orange-600 dark:text-orange-400">
                                    {data.meta?.sdkVersion}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Campos Específicos: Sistema */}
                    {serviceName === 'sistema' && (
                        <>
                             <div className="p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg sm:col-span-2">
                                <span className="block text-[10px] text-gray-400 uppercase">Data Center (Colo)</span>
                                <span className="font-medium text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                    <Icon icon={faNetworkWired} />
                                    {data.meta?.datacenter || 'Unknown'}
                                </span>
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg">
                                <span className="block text-[10px] text-gray-400 uppercase">Environment</span>
                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                    {data.meta?.environment}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Dicas de Solução */}
            {!isOnline && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                    <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-2 flex items-center gap-2">
                        <Icon icon={faLightbulb} /> Ação Recomendada
                    </h4>
                    <ul className="text-sm text-red-600 dark:text-red-300 list-disc list-inside space-y-1">
                        <li>Verifique os logs da Cloudflare Dashboard para erros 500.</li>
                        {serviceName === 'cep' && <li>Confirme se o ViaCEP está online acessando viacep.com.br.</li>}
                        {serviceName === 'database' && <li>Verifique as Regras de Segurança do Firestore e a validade da API Key.</li>}
                        <li>Se o problema persistir, verifique a aba "Deployments" no GitHub.</li>
                    </ul>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-700 text-center shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors shadow-sm cursor-pointer"
          >
            Fechar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};
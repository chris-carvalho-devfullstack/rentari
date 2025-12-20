'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { faChartLine, faExclamationTriangle, faCheckCircle, faSync } from '@fortawesome/free-solid-svg-icons';

export const SystemStatusWidget = () => {
  const [status, setStatus] = useState<'online' | 'degraded' | 'error' | 'loading'>('loading');
  
  // Verifica o status ao carregar o componente
  useEffect(() => {
    const check = async () => {
      try {
        // Usa a mesma API leve que criamos
        const res = await fetch('/api/system/health', { next: { revalidate: 60 } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        // Se qualquer serviço estiver com erro, o status geral muda
        if (data.services.cep.status !== 'online' || data.services.database.status !== 'online') {
            setStatus('degraded');
        } else {
            setStatus('online');
        }
      } catch {
        setStatus('error');
      }
    };
    
    check();
    // Revalida a cada 2 minutos se o usuário ficar parado na dashboard
    const interval = setInterval(check, 120000);
    return () => clearInterval(interval);
  }, []);

  // Configuração Visual Baseada no Status
  const config = {
    loading: {
        color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200',
        icon: faSync, label: 'Verificando...', spin: true,
        indicator: 'bg-gray-400'
    },
    online: {
        color: 'text-green-600', bg: 'bg-white hover:bg-green-50', border: 'border-gray-200',
        icon: faCheckCircle, label: 'Operacional', spin: false,
        indicator: 'bg-green-500'
    },
    degraded: {
        color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200',
        icon: faExclamationTriangle, label: 'Instabilidade', spin: false,
        indicator: 'bg-yellow-500'
    },
    error: {
        color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
        icon: faExclamationTriangle, label: 'Sistema Offline', spin: false,
        indicator: 'bg-red-500'
    }
  }[status];

  return (
    <Link 
        href="/admin/system/status" 
        className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] group relative overflow-hidden ${config.bg} ${config.border}`}
    >
        <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${config.color}`}>
                Estado do Sistema
            </h3>
            <div className="mt-2 flex items-center space-x-2">
                <span className="flex h-3 w-3 relative">
                    {status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${config.indicator}`}></span>
                </span>
                <span className={`font-bold text-lg ${config.color}`}>
                    {config.label}
                </span>
            </div>
        </div>
        
        <div className="flex justify-between items-end mt-4">
            <p className="text-xs text-gray-400 group-hover:text-gray-600 dark:text-gray-500">
                {status === 'loading' ? 'Aguarde...' : 'Clique para diagnóstico.'}
            </p>
            <Icon icon={status === 'loading' ? faSync : faChartLine} spin={config.spin} className={`w-4 h-4 transition-colors ${config.color}`} />
        </div>
    </Link>
  );
};
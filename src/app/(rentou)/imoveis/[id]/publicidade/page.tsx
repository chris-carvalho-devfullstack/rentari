// src/app/(rentou)/imoveis/[id]/publicidade/page.tsx
'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { faGlobe, faCheckCircle, faPauseCircle, faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';

// ADICIONE ESTA LINHA PARA CORRIGIR O ERRO DE DEPLOY NA CLOUDFLARE
export const runtime = 'edge'; 

export default function PublicidadePage() {
    const [config, setConfig] = useState({
        status: 'ATIVO',
        mostrarEndereco: false,
    });

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuração de Publicidade</h1>
            
            {/* Status Global */}
            <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 className="font-semibold mb-4">Status do Anúncio</h3>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setConfig({...config, status: 'ATIVO'})}
                        className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center transition-all ${config.status === 'ATIVO' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <Icon icon={faCheckCircle} className="w-6 h-6 mb-2"/>
                        <span className="font-bold">Publicado</span>
                        <span className="text-xs mt-1">Visível no Portal Rentou</span>
                    </button>
                    <button 
                        onClick={() => setConfig({...config, status: 'PAUSADO'})}
                        className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center transition-all ${config.status === 'PAUSADO' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <Icon icon={faPauseCircle} className="w-6 h-6 mb-2"/>
                        <span className="font-bold">Pausado</span>
                        <span className="text-xs mt-1">Temporariamente oculto</span>
                    </button>
                </div>
            </div>

            {/* Privacidade */}
            <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 className="font-semibold mb-4 flex items-center">
                    <Icon icon={faGlobe} className="mr-2 text-blue-500"/> Privacidade de Localização
                </h3>
                
                <div className="space-y-3">
                    <div 
                        onClick={() => setConfig({...config, mostrarEndereco: false})}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${!config.mostrarEndereco ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'}`}
                    >
                         <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${!config.mostrarEndereco ? 'border-blue-500' : 'border-gray-400'}`}>
                                {!config.mostrarEndereco && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                            <div>
                                <span className="font-bold block text-sm">Apenas Bairro e Cidade</span>
                                <span className="text-xs text-gray-500">Recomendado para segurança. O mapa mostra um raio aproximado.</span>
                            </div>
                        </div>
                        <Icon icon={faEyeSlash} className="text-gray-400"/>
                    </div>
                    
                    <div 
                        onClick={() => setConfig({...config, mostrarEndereco: true})}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${config.mostrarEndereco ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'}`}
                    >
                         <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${config.mostrarEndereco ? 'border-blue-500' : 'border-gray-400'}`}>
                                {config.mostrarEndereco && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                            <div>
                                <span className="font-bold block text-sm">Endereço Completo</span>
                                <span className="text-xs text-gray-500">Rua e Número visíveis. Aumenta a confiança do inquilino.</span>
                            </div>
                        </div>
                        <Icon icon={faEye} className="text-gray-400"/>
                    </div>
                </div>
            </div>
            
            <button className="w-full py-3 bg-rentou-primary text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg transition-transform active:scale-95">
                Salvar Configurações
            </button>
        </div>
    );
}
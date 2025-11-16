// src/components/ui/StreetView.tsx
'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { faStreetView } from '@fortawesome/free-solid-svg-icons';

interface StreetViewProps {
    latitude: number;
    longitude: number;
    address: string;
}

/**
 * Componente Placeholder para integração do Google Maps Street View.
 * * NOTA: A integração real requer:
 * 1. Obter uma Google Maps API Key.
 * 2. Carregar a API JS do Google Maps (geralmente no layout/provider).
 * 3. Inicializar o Panorama no mount do componente usando as coordenadas.
 */
export const StreetView: React.FC<StreetViewProps> = ({ latitude, longitude, address }) => {
    
    // O iframe é a maneira mais simples de incorporar uma visão estática, mas 
    // a melhor prática é usar a API JavaScript do Google Maps para o panorama interativo.
    // Vamos fornecer um link de fácil acesso para o usuário abrir o Street View diretamente.
    
    const googleMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}&hl=pt-BR`;
    
    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Icon icon={faStreetView} className='w-6 h-6 mr-3 text-red-600' />
                Visão da Rua (Street View)
            </h2>
            
            <div className="relative w-full h-80 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden flex items-center justify-center">
                 <a 
                    href={googleMapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute inset-0 flex items-center justify-center text-center text-rentou-primary hover:bg-gray-200/50 dark:hover:bg-zinc-600/50 transition-colors"
                    title={`Abrir Street View para ${address}`}
                 >
                    <div className='space-y-2'>
                        <Icon icon={faStreetView} className='w-12 h-12 mx-auto text-red-600' />
                        <p className='font-bold'>Abrir Visão Interativa no Google Maps</p>
                        <p className='text-sm text-gray-500'>Endereço: {address}</p>
                    </div>
                </a>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Visualize a vizinhança da rua antes de agendar a visita.
            </p>
        </div>
    );
}
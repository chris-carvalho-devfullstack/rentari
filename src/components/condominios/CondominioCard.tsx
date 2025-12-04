'use client';

import React from 'react';
import Link from 'next/link';
import { Condominio } from '@/types/condominio';
import { Icon } from '@/components/ui/Icon';
import { faMapMarkerAlt, faBuilding, faSwimmingPool, faShieldAlt, faHardHat, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

interface CondominioCardProps {
    condominio: Condominio;
}

export const CondominioCard: React.FC<CondominioCardProps> = ({ condominio }) => {
    const photoUrl = condominio.fotos[0] || '/placeholder-condo.jpg';
    
    const getStatusBadge = () => {
        if (condominio.lancamento) {
            return (
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md">
                    <Icon icon={faHardHat} className="mr-1" /> LANÇAMENTO
                </span>
            );
        }
        return (
            <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md">
                PRONTO
            </span>
        );
    };

    return (
        <Link href={`/condominios/${condominio.id}`} className="group block bg-white dark:bg-zinc-800 rounded-xl shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <div className="relative h-48 w-full overflow-hidden">
                <img 
                    src={photoUrl} 
                    alt={condominio.nome} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    // Fallback simples
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Sem+Foto')}
                />
                {getStatusBadge()}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                    <h3 className="text-white font-bold text-lg truncate shadow-black drop-shadow-md">{condominio.nome}</h3>
                    <p className="text-gray-200 text-xs flex items-center truncate">
                        <Icon icon={faMapMarkerAlt} className="mr-1 text-rentou-primary" />
                        {condominio.endereco.bairro}, {condominio.endereco.cidade}
                    </p>
                </div>
            </div>
            
            <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-700 pb-3">
                    <span className="flex items-center"><Icon icon={faBuilding} className="mr-2 text-gray-400"/> {condominio.numeroTorres} Torres</span>
                    <span className="flex items-center"><Icon icon={faCalendarAlt} className="mr-2 text-gray-400"/> {condominio.anoConstrucao}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {condominio.infraestrutura.piscinaAdulto && (
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded uppercase">Piscina</span>
                    )}
                    {condominio.infraestrutura.academia && (
                        <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded uppercase">Academia</span>
                    )}
                    {condominio.tipoPortaria === 'HUMANA_24H' && (
                        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold rounded uppercase">Portaria 24h</span>
                    )}
                </div>
            </div>
        </Link>
    );
};
// src/components/anuncios/AnuncioCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Imovel } from '@/types/imovel';
import { Icon } from '@/components/ui/Icon';
import { faBed, faShower, faCar, faRulerCombined, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

interface AnuncioCardProps {
    imovel: Imovel;
    // URL base para o detalhe (pode ser '/anuncios' ou '/proprietario/[handle]')
    detailUrlPrefix: string; 
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);


/**
 * Card de exibição de imóvel para o portal de anúncios público (Inspirado em Rightmove).
 */
export const AnuncioCard: React.FC<AnuncioCardProps> = ({ imovel, detailUrlPrefix }) => {
    
    const photoUrl = imovel.fotos[0] || 'https://via.placeholder.com/800x600?text=Foto+em+breve';
    const totalDormitorios = imovel.quartos + imovel.suites;
    const totalBanheiros = imovel.banheiros + imovel.suites + imovel.lavabos + imovel.banheirosServico;
    
    // Calcula o valor total mensal (Aluguel + Cond. Incluso + IPTU Incluso)
    let valorTotalMensal = imovel.valorAluguel;
    if (imovel.custoCondominioIncluso) valorTotalMensal += imovel.valorCondominio;
    if (imovel.custoIPTUIncluso) valorTotalMensal += imovel.valorIPTU;
    

    return (
        <Link href={`${detailUrlPrefix}/${imovel.smartId}`} className="group block h-full bg-white dark:bg-zinc-800 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-zinc-700">
            
            {/* 1. Imagem de Destaque */}
            <div className="relative w-full h-48 overflow-hidden">
                <img
                    src={photoUrl}
                    alt={`Foto de ${imovel.titulo}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    // Fallback para caso não consiga usar o Next/Image
                    style={{ minHeight: '192px', objectFit: 'cover' }}
                />
                
                {/* Preço de Destaque (Estilo Rightmove - Fundo escuro/claro no canto) */}
                 <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-md font-bold text-lg shadow-md">
                    {formatCurrency(valorTotalMensal)}
                </div>
            </div>

            {/* 2. Detalhes (Texto) */}
            <div className="p-4 space-y-2">
                
                {/* Título e Endereço */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-rentou-primary transition-colors line-clamp-2">
                    {imovel.titulo}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Icon icon={faMapMarkerAlt} className='w-4 h-4 mr-2 text-red-500' />
                    {imovel.endereco.bairro}, {imovel.endereco.cidade} - {imovel.endereco.estado}
                </p>

                {/* Características Principais (Pílulas) */}
                <div className="flex space-x-3 text-sm text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-zinc-700">
                    <span className='flex items-center space-x-1'>
                        <Icon icon={faBed} className='w-4 h-4 text-rentou-primary' />
                        <span className='font-medium'>{totalDormitorios}</span>
                    </span>
                    <span className='flex items-center space-x-1'>
                        <Icon icon={faShower} className='w-4 h-4 text-rentou-primary' />
                        <span className='font-medium'>{totalBanheiros}</span>
                    </span>
                    <span className='flex items-center space-x-1'>
                        <Icon icon={faCar} className='w-4 h-4 text-rentou-primary' />
                        <span className='font-medium'>{imovel.vagasGaragem}</span>
                    </span>
                    <span className='flex items-center space-x-1'>
                        <Icon icon={faRulerCombined} className='w-4 h-4 text-rentou-primary' />
                        <span className='font-medium'>{imovel.areaUtil}m²</span>
                    </span>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 line-clamp-3">
                    {imovel.descricaoLonga.slice(0, 100)}...
                </p>

            </div>
        </Link>
    );
};
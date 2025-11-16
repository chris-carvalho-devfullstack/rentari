// src/components/anuncios/PoiList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchNearbyPois, PoiResult } from '@/services/GeocodingService';
import { Icon } from '@/components/ui/Icon';
import { faBus, faTrainSubway, faShoppingCart, faClinicMedical, faSchool, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface PoiListProps {
    latitude: number;
    longitude: number;
}

// Mapeamento de botões de filtro para ícones e tags da Overpass API
const poiFilters = [
    { name: 'Estações', tag: 'railway_station', icon: faTrainSubway, color: 'text-indigo-600' },
    { name: 'Ônibus', tag: 'bus_stop', icon: faBus, color: 'text-green-600' },
    { name: 'Escolas', tag: 'school', icon: faSchool, color: 'text-yellow-600' },
    { name: 'Supermercados', tag: 'supermarket', icon: faShoppingCart, color: 'text-blue-600' },
    { name: 'Farmácias', tag: 'pharmacy', icon: faClinicMedical, color: 'text-red-600' },
];

/**
 * Componente que exibe a lista de Pontos de Interesse (POIs) próximos ao imóvel.
 */
export const PoiList: React.FC<PoiListProps> = ({ latitude, longitude }) => {
    const [selectedTag, setSelectedTag] = useState<string>('school');
    const [pois, setPois] = useState<PoiResult[]>([]);
    const [loadingPois, setLoadingPois] = useState(false);

    // Usa useCallback para otimizar a função de carregamento
    const loadPois = useCallback(async (tag: string) => {
        if (!latitude || !longitude || !tag) return;
        
        setLoadingPois(true);
        try {
            const results = await fetchNearbyPois(latitude, longitude, tag);
            setPois(results);
        } catch (error) {
            console.error("Erro ao carregar POIs:", error);
            setPois([]);
        } finally {
            setLoadingPois(false);
        }
    }, [latitude, longitude]); // Depende apenas de lat/lng

    useEffect(() => {
        // Chama loadPois quando o componente monta ou selectedTag/coordenadas mudam
        loadPois(selectedTag);
    }, [selectedTag, loadPois]);


    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Pontos de Interesse Próximos
            </h3>
            
            {/* Filtros de Categoria */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-zinc-700 pb-3">
                {poiFilters.map(filter => (
                    <button
                        key={filter.tag}
                        onClick={() => setSelectedTag(filter.tag)}
                        className={`flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                            selectedTag === filter.tag
                                ? `bg-rentou-primary text-white shadow-md`
                                : 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        <Icon icon={filter.icon} className={`w-4 h-4 mr-2 ${selectedTag !== filter.tag ? filter.color : 'text-white'}`} />
                        {filter.name}
                    </button>
                ))}
            </div>

            {/* Resultados */}
            <div className="space-y-3 min-h-[150px]">
                {loadingPois ? (
                    <div className="flex items-center justify-center p-4">
                        <Icon icon={faSpinner} spin className='w-5 h-5 text-rentou-primary mr-2' />
                        Buscando locais próximos...
                    </div>
                ) : pois.length > 0 ? (
                    pois.map((poi, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{poi.name}</p>
                                <p className="text-xs text-gray-500">{poi.type.toUpperCase()}</p>
                            </div>
                            <span className="text-sm font-bold text-rentou-primary">
                                {poi.distanceKm} km
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 p-4">Nenhum local encontrado em um raio de 1.5km.</p>
                )}
            </div>
            
            {/* Opção Adicionar Local (Igual ao Rightmove) */}
            <button className="flex items-center mt-4 text-rentou-primary hover:underline text-sm font-medium">
                <Icon icon={faPlus} className='w-4 h-4 mr-2' />
                Adicionar um local importante (Para Rotas)
            </button>
        </div>
    );
};
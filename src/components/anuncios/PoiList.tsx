// src/components/anuncios/PoiList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchNearbyPois, PoiResult } from '@/services/GeocodingService';
import { Icon } from '@/components/ui/Icon';
// Adicionado faHospital, faShoppingBag, faMapPin
import { faBus, faTrainSubway, faShoppingCart, faClinicMedical, faSchool, faPlus, faSpinner, faMapPin, faHospital, faShoppingBag } from '@fortawesome/free-solid-svg-icons';

interface PoiListProps {
    latitude: number;
    longitude: number;
}

// Mapeamento de botões de filtro para ícones e tags da Overpass API (ATUALIZADO)
const poiFilters = [
    { name: 'Escolas', tag: 'school', icon: faSchool, color: 'text-yellow-600' },
    { name: 'Supermercados', tag: 'supermarket', icon: faShoppingCart, color: 'text-blue-600' },
    { name: 'Farmácias', tag: 'pharmacy', icon: faClinicMedical, color: 'text-red-600' },
    { name: 'Hospitais', tag: 'hospital', icon: faHospital, color: 'text-pink-600' }, // NOVO
    { name: 'Shopping/Lojas', tag: 'shopping_mall', icon: faShoppingBag, color: 'text-purple-600' }, // NOVO
    { name: 'Estações', tag: 'railway_station', icon: faTrainSubway, color: 'text-indigo-600' },
    { name: 'Ônibus', tag: 'bus_stop', icon: faBus, color: 'text-green-600' },
];

// Opções de distância em metros
const distanceOptions = [
    { label: '500 m', value: 500 },
    { label: '1 km', value: 1000 },
    { label: '2 km (Padrão)', value: 2000 },
    { label: '5 km', value: 5000 },
];

/**
 * Componente que exibe a lista de Pontos de Interesse (POIs) próximos ao imóvel.
 */
export const PoiList: React.FC<PoiListProps> = ({ latitude, longitude }) => {
    const [selectedTag, setSelectedTag] = useState<string>('school');
    const [distance, setDistance] = useState<number>(2000); // NOVO: Distância em metros (padrão 2km)
    const [pois, setPois] = useState<PoiResult[]>([]);
    const [loadingPois, setLoadingPois] = useState(false);

    // Usa useCallback para otimizar a função de carregamento
    const loadPois = useCallback(async (tag: string, dist: number) => {
        if (!latitude || !longitude || !tag) return;
        
        setLoadingPois(true);
        try {
            // Passa a distância para o serviço
            const results = await fetchNearbyPois(latitude, longitude, tag, dist); 
            setPois(results);
        } catch (error) {
            console.error("Erro ao carregar POIs:", error);
            setPois([]);
        } finally {
            setLoadingPois(false);
        }
    }, [latitude, longitude]); 

    useEffect(() => {
        // Chama loadPois quando o componente monta ou selectedTag/coordenadas/distance mudam
        loadPois(selectedTag, distance);
    }, [selectedTag, distance, loadPois]); // NOVO: Adicionado distance à dependência
    
    // Handler para o botão de Rotas
    const handleAddRoute = () => {
        alert("Funcionalidade de Rotas: Este botão acionaria a abertura do Google Maps (ou similar) com o endereço do imóvel como origem/destino para que o usuário possa adicionar um ponto de interesse manualmente e calcular a rota.");
    };


    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Pontos de Interesse Próximos
            </h3>
            
            {/* CONTROLES E RAIO (TOPO, ALINHADO À ESQUERDA) */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                 
                 {/* 1. SELETOR DE RAIO ESTILIZADO (Far Left - alinhado ao print) */}
                 <div className="flex items-center space-x-2 flex-shrink-0">
                     <label htmlFor="distance-select" className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        RAIO DE BUSCA:
                     </label>
                     <select
                        id="distance-select"
                        value={distance}
                        onChange={(e) => setDistance(parseInt(e.target.value))}
                        // Estilização moderna como um botão/pill
                        className="px-3 py-1 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white rounded-lg shadow-sm text-sm font-semibold focus:ring-rentou-primary focus:border-rentou-primary"
                    >
                        {distanceOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                 </div>
            </div>


            {/* FILTROS DE CATEGORIA (Abaixo do Raio de Busca) */}
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
                    <p className="text-center text-gray-500 p-4">Nenhum local de "{selectedTag.replace('_', ' ')}" encontrado em um raio de {distance / 1000}km.</p>
                )}
            </div>
            
            {/* Opção Adicionar Local (FUNCIONAL/INTERATIVA) */}
            <button 
                onClick={handleAddRoute}
                className="flex items-center mt-4 text-rentou-primary hover:underline text-sm font-medium"
            >
                <Icon icon={faPlus} className='w-4 h-4 mr-2' />
                Adicionar um local importante (Para Rotas)
            </button>
        </div>
    );
};
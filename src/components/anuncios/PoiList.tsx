// src/components/anuncios/PoiList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchNearbyPois, PoiResult } from '@/services/GeocodingService';
import { Icon } from '@/components/ui/Icon';
import { 
    faBus, faTrainSubway, faShoppingCart, faClinicMedical, faSchool, faPlus, faSpinner, 
    faMapPin, faHospital, faShoppingBag, faUniversity, faBusSimple, faPlaneArrival,
    faUtensils, faChurch, faBuildingShield, 
    faMask, // <-- CORRIGIDO
    faFilm, faMusic, faBeer, 
    faChevronDown, faChevronUp,
    IconDefinition // <-- Importado explicitamente
} from '@fortawesome/free-solid-svg-icons'; 

interface PoiListProps {
    latitude: number;
    longitude: number;
    onClickPoi: (poi: PoiResult | null) => void; 
    onPoisFetched: (pois: PoiResult[]) => void; 
}

// CORRIGIDO: Definição da interface PoiFilter
interface PoiFilter {
    name: string;
    tag: string;
    icon: IconDefinition; 
    color: string;
}

// Mapeamento de botões de filtro (Mantido)
const poiFilters: PoiFilter[] = [
    { name: 'Todos', tag: 'TODOS', icon: faMapPin, color: 'text-rentou-primary' }, 
    { name: 'Restaurantes', tag: 'restaurant', icon: faUtensils, color: 'text-orange-500' }, 
    { name: 'Supermercados', tag: 'supermarket', icon: faShoppingCart, color: 'text-blue-600' },
    { name: 'Farmácias', tag: 'pharmacy', icon: faClinicMedical, color: 'text-red-600' },
    { name: 'Hospitais', tag: 'hospital', icon: faHospital, color: 'text-pink-600' },
    { name: 'Escolas', tag: 'school', icon: faSchool, color: 'text-yellow-600' },
    { name: 'Universidade', tag: 'university', icon: faUniversity, color: 'text-indigo-600' }, 
    { name: 'Shopping/Lojas', tag: 'shopping_mall', icon: faShoppingBag, color: 'text-purple-600' },
    { name: 'Cinema', tag: 'cinema', icon: faFilm, color: 'text-gray-700' }, 
    { name: 'Teatro', tag: 'theatre', icon: faMask, color: 'text-red-800' },
    { name: 'Pubs', tag: 'pub', icon: faBeer, color: 'text-amber-700' },
    { name: 'Clubes', tag: 'nightclub', icon: faMusic, color: 'text-cyan-500' }, 
    { name: 'Polícia', tag: 'police', icon: faBuildingShield, color: 'text-blue-800' }, 
    { name: 'Igrejas', tag: 'church', icon: faChurch, color: 'text-yellow-700' }, 
    { name: 'Rodoviária', tag: 'bus_station', icon: faBusSimple, color: 'text-orange-600' }, 
    { name: 'Aeroporto', tag: 'airport', icon: faPlaneArrival, color: 'text-teal-600' }, 
    { name: 'Estações', tag: 'railway_station', icon: faTrainSubway, color: 'text-indigo-600' },
    { name: 'Ônibus', tag: 'bus_stop', icon: faBus, color: 'text-green-600' },
];

const distanceOptions = [
    { label: '500 m', value: 500 },
    { label: '1 km', value: 1000 },
    { label: '2 km (Padrão)', value: 2000 },
    { label: '5 km', value: 5000 },
];

// Função auxiliar para obter o ícone de uma tag
const getIconForTag = (tag: string): IconDefinition => {
    return poiFilters.find(f => f.tag === tag)?.icon || faMapPin;
}


export const PoiList: React.FC<PoiListProps> = ({ latitude, longitude, onClickPoi, onPoisFetched }) => {
    
    const [selectedTag, setSelectedTag] = useState<string>('TODOS'); 
    const [distance, setDistance] = useState<number>(2000); 
    const [pois, setPois] = useState<PoiResult[]>([]);
    const [loadingPois, setLoadingPois] = useState(true); 
    const [isExpanded, setIsExpanded] = useState(false); 
    const [progress, setProgress] = useState(0); 

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const loadPois = useCallback(async (lat: number, lon: number, tag: string, dist: number) => {
        setLoadingPois(true);
        setIsExpanded(false);
        setProgress(0);
        
        let simulatedProgress = 0;
        const progressInterval = setInterval(() => {
            simulatedProgress = Math.min(simulatedProgress + 5, 90);
            setProgress(simulatedProgress);
        }, 150);

        try {
            const results = await fetchNearbyPois(lat, lon, tag, dist); 
            
            clearInterval(progressInterval);
            setProgress(100); 
            
            await delay(200); 
            
            setPois(results);
            onPoisFetched(results); 
        } catch (error) {
            clearInterval(progressInterval);
            console.error("Erro ao carregar POIs:", error);
            setProgress(0);
            setPois([]);
            onPoisFetched([]);
        } finally {
            setLoadingPois(false);
        }
    }, [onPoisFetched]); 

    useEffect(() => {
        if (latitude && longitude) {
            loadPois(latitude, longitude, selectedTag, distance);
        }
    }, [selectedTag, distance, latitude, longitude, loadPois]); 
    
    
    const handleAddRoute = () => {
        alert("Funcionalidade de Rotas: Este botão acionaria a abertura do Google Maps (ou similar) com o endereço do imóvel como origem/destino para que o usuário possa adicionar um ponto de interesse manualmente e calcular a rota.");
    };

    const handlePoiClick = (poi: PoiResult) => {
        onClickPoi(poi);
    };

    // Define quais itens da lista serão mostrados
    const itemsToShow = isExpanded ? pois : pois.slice(0, 5);
    
    // Calcula o ângulo para o radial-gradient (simulando um círculo de progresso)
    const angle = (progress / 100) * 360;
    const progressStyle = {
        background: `conic-gradient(#1D4ED8 ${angle}deg, #e5e7eb ${angle}deg)`,
    };


    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Pontos de Interesse Próximos
            </h3>
            
            {/* CONTROLES E RAIO (TOPO) */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                 <div className="flex items-center space-x-2 flex-shrink-0">
                     <label htmlFor="distance-select" className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        RAIO DE BUSCA:
                     </label>
                     <select
                        id="distance-select"
                        value={distance}
                        onChange={(e) => setDistance(parseInt(e.target.value))}
                        className="px-3 py-1 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white rounded-lg shadow-sm text-sm font-semibold focus:ring-rentou-primary focus:border-rentou-primary"
                    >
                        {distanceOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                 </div>
            </div>

            {/* FILTROS DE CATEGORIA */}
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
                        disabled={loadingPois}
                    >
                        <Icon icon={filter.icon} className={`w-4 h-4 mr-2 ${selectedTag !== filter.tag ? filter.color : 'text-white'}`} />
                        {filter.name}
                    </button>
                ))}
            </div>

            {/* Resultados (COM FEEDBACK DE CARREGAMENTO) */}
            <div className="space-y-3 min-h-[150px]">
                {loadingPois && progress < 100 ? (
                    <div className="flex items-center justify-center p-4">
                        <div 
                            style={progressStyle} 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                        >
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-rentou-primary text-xs font-bold">
                                {progress}%
                            </div>
                        </div>
                        <p className='ml-3 text-gray-600 dark:text-gray-300'>Buscando locais...</p>
                    </div>
                ) : pois.length > 0 ? (
                    itemsToShow.map((poi, index) => {
                        const icon = getIconForTag(poi.tag); 
                        return (
                            <button 
                                key={index} 
                                onClick={() => handlePoiClick(poi)} 
                                className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg border-2 border-transparent hover:border-rentou-primary transition-all cursor-pointer"
                            >
                                <div className='flex items-center space-x-3'>
                                    <Icon icon={icon} className='w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0' />
                                    <div>
                                        <p className="font-semibold text-left text-gray-800 dark:text-gray-200">{poi.name}</p>
                                        <p className="text-xs text-left text-gray-500">{poi.type.toUpperCase()}</p> 
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-rentou-primary">
                                    {poi.distanceKm} km
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <p className="text-center text-gray-500 p-4">Nenhum local de "{poiFilters.find(f => f.tag === selectedTag)?.name || selectedTag}" encontrado em um raio de {distance / 1000}km.</p>
                )}
            </div>
            
            {/* Botão de Expandir/Recolher */}
            {pois.length > 5 && (
                <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="w-full mt-2 px-4 py-2 text-sm font-semibold text-rentou-primary bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center justify-center"
                >
                    {isExpanded ? (
                        <>
                            Ver menos <Icon icon={faChevronUp} className="w-3 h-3 ml-2" />
                        </>
                    ) : (
                        <>
                            Ver mais {pois.length - 5} {pois.length - 5 === 1 ? 'local' : 'locais'} 
                            <Icon icon={faChevronDown} className="w-3 h-3 ml-2" />
                        </>
                    )}
                </button>
            )}
            
            {/* Opção Adicionar Local */}
            <button 
                onClick={handleAddRoute}
                className="flex items-center mt-4 text-rentou-primary hover:underline text-sm font-medium"
            >
                <Icon icon={faPlus} className='w-4 h-4 mr-2' />
                Adicionar um local importante (Para Rotas)
            </button>
        </div>
    );
}
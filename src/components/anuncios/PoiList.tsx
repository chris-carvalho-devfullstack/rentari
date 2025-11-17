// src/components/anuncios/PoiList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchNearbyPois, PoiResult } from '@/services/GeocodingService';
import { Icon } from '@/components/ui/Icon';
import { 
    faBus, faTrainSubway, faShoppingCart, faClinicMedical, faSchool, faPlus, faSpinner, 
    faMapPin, faHospital, faShoppingBag, faUniversity, faBusSimple, faPlaneArrival, IconDefinition 
} from '@fortawesome/free-solid-svg-icons'; 

interface PoiListProps {
    latitude: number;
    longitude: number;
    onClickPoi: (poi: PoiResult | null) => void; 
    onPoisFetched: (pois: PoiResult[]) => void; 
}

// Mapeamento de botões de filtro
interface PoiFilter {
    name: string;
    tag: string;
    icon: IconDefinition; 
    color: string;
}

const poiFilters: PoiFilter[] = [
    { name: 'Todos', tag: 'TODOS', icon: faMapPin, color: 'text-rentou-primary' }, 
    { name: 'Escolas', tag: 'school', icon: faSchool, color: 'text-yellow-600' },
    { name: 'Universidade', tag: 'university', icon: faUniversity, color: 'text-indigo-600' }, 
    { name: 'Supermercados', tag: 'supermarket', icon: faShoppingCart, color: 'text-blue-600' },
    { name: 'Farmácias', tag: 'pharmacy', icon: faClinicMedical, color: 'text-red-600' },
    { name: 'Hospitais', tag: 'hospital', icon: faHospital, color: 'text-pink-600' },
    { name: 'Shopping/Lojas', tag: 'shopping_mall', icon: faShoppingBag, color: 'text-purple-600' },
    { name: 'Rodoviária', tag: 'bus_station', icon: faBusSimple, color: 'text-orange-600' }, 
    { name: 'Aeroporto', tag: 'airport', icon: faPlaneArrival, color: 'text-teal-600' }, 
    { name: 'Estações', tag: 'railway_station', icon: faTrainSubway, color: 'text-indigo-600' },
    { name: 'Ônibus', tag: 'bus_stop', icon: faBus, color: 'text-green-600' },
];

// Opções de distância
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

    // ============ CORREÇÃO DO LOOP INFINITO ============

    // 1. A função 'loadPois' é memoizada.
    // Ela SÓ depende de 'onPoisFetched', que é estável (memoizada no pai).
    // Portanto, 'loadPois' é criada APENAS UMA VEZ.
    const loadPois = useCallback(async (lat: number, lon: number, tag: string, dist: number) => {
        setLoadingPois(true); // Esta é a Linha 64 do erro
        try {
            const results = await fetchNearbyPois(lat, lon, tag, dist); 
            setPois(results);
            onPoisFetched(results); 
        } catch (error) {
            console.error("Erro ao carregar POIs:", error);
            setPois([]);
            onPoisFetched([]);
        } finally {
            setLoadingPois(false);
        }
    }, [onPoisFetched]); // 'onPoisFetched' é estável

    // 2. O 'useEffect' principal.
    // Ele agora depende APENAS dos dados que disparam uma nova busca.
    // 'loadPois' é estável (do useCallback acima).
    // 'onClickPoi' foi removido das dependências.
    useEffect(() => {
        if (latitude && longitude) {
            loadPois(latitude, longitude, selectedTag, distance);
            // A chamada 'onClickPoi(null)' foi removida daqui,
            // pois 'onPoisFetched' já faz 'setActivePoi(null)' no componente pai.
        }
    }, [selectedTag, distance, latitude, longitude, loadPois]); 
    // ============ FIM DA CORREÇÃO ============

    
    const handleAddRoute = () => {
        alert("Funcionalidade de Rotas: Este botão acionaria a abertura do Google Maps (ou similar) com o endereço do imóvel como origem/destino para que o usuário possa adicionar um ponto de interesse manualmente e calcular a rota.");
    };

    // Esta função não precisa de useCallback pois é chamada diretamente pelo evento onClick
    const handlePoiClick = (poi: PoiResult) => {
        onClickPoi(poi);
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
                    >
                        <Icon icon={filter.icon} className={`w-4 h-4 mr-2 ${selectedTag !== filter.tag ? filter.color : 'text-white'}`} />
                        {filter.name}
                    </button>
                ))}
            </div>

            {/* Resultados (AGORA CLICÁVEIS E COM ÍCONES) */}
            <div className="space-y-3 min-h-[150px]">
                {loadingPois ? (
                    <div className="flex items-center justify-center p-4">
                        <Icon icon={faSpinner} spin className='w-5 h-5 text-rentou-primary mr-2' />
                        Buscando locais próximos...
                    </div>
                ) : pois.length > 0 ? (
                    pois.map((poi, index) => {
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
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PoiResult } from '@/services/GeocodingService';
import { Icon } from '@/components/ui/Icon';
import { 
    faShoppingCart, faClinicMedical, faSchool, faPlus, 
    faMapPin, faHospital, faShoppingBag, faUniversity, faBusSimple, faPlaneArrival,
    faUtensils, faChurch, faBuildingShield, faMask, faFilm, faMusic, faBeer, 
    faChevronDown, faChevronUp, faTrainSubway, faBus, faSpinner, // <--- ADICIONADO AQUI
    IconDefinition 
} from '@fortawesome/free-solid-svg-icons'; 

interface PoiListProps {
    latitude: number;
    longitude: number;
    onClickPoi: (poi: PoiResult | null) => void; 
    onPoisFetched: (pois: PoiResult[]) => void; 
}

interface PoiFilter {
    name: string;
    tag: string;
    icon: IconDefinition; 
    color: string;
}

const poiFilters: PoiFilter[] = [
    { name: 'Todos', tag: 'TODOS', icon: faMapPin, color: 'text-rentou-primary' }, 
    { name: 'Escolas', tag: 'school', icon: faSchool, color: 'text-yellow-600' },
    { name: 'Mercados', tag: 'supermarket', icon: faShoppingCart, color: 'text-blue-600' },
    { name: 'Farmácias', tag: 'pharmacy', icon: faClinicMedical, color: 'text-red-600' },
    { name: 'Hospitais', tag: 'hospital', icon: faHospital, color: 'text-pink-600' },
    { name: 'Restaurantes', tag: 'restaurant', icon: faUtensils, color: 'text-orange-500' }, 
    { name: 'Transporte', tag: 'bus_station', icon: faBusSimple, color: 'text-indigo-600' },
    { name: 'Lazer', tag: 'park', icon: faMask, color: 'text-green-600' },
];

// Função auxiliar para ícone
const getIconForTag = (tag: string): IconDefinition => {
    const filter = poiFilters.find(f => f.tag === tag);
    // Fallback simples baseado no início da string se não achar exato
    if (filter) return filter.icon;
    if (tag === 'university') return faUniversity;
    if (tag === 'cinema') return faFilm;
    if (tag === 'nightclub') return faMusic;
    if (tag === 'pub') return faBeer;
    if (tag === 'church') return faChurch;
    if (tag === 'police') return faBuildingShield;
    return faMapPin;
}

export const PoiList: React.FC<PoiListProps> = ({ latitude, longitude, onClickPoi, onPoisFetched }) => {
    
    const [selectedTag, setSelectedTag] = useState<string>('TODOS'); 
    const [masterPois, setMasterPois] = useState<PoiResult[]>([]); // Armazena TUDO
    const [loading, setLoading] = useState(false); 
    const [isExpanded, setIsExpanded] = useState(false); 

    // 1. SINGLE FETCH: Busca tudo apenas quando Lat/Lon mudam
    useEffect(() => {
        if (!latitude || !longitude) return;

        const fetchAllPois = async () => {
            setLoading(true);
            try {
                // Chama a API sem tag específica (Backend entende como 'TODOS' e cacheia)
                const res = await fetch(`/api/pois?lat=${latitude}&lon=${longitude}&tag=TODOS`);
                
                if (!res.ok) throw new Error('Falha ao buscar POIs');
                
                const data = await res.json();
                
                if (Array.isArray(data)) {
                    setMasterPois(data);
                    onPoisFetched(data); // Manda tudo para o mapa pintar os marcadores
                }
            } catch (error) {
                console.error("Erro ao buscar POIs:", error);
                setMasterPois([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllPois();
    }, [latitude, longitude, onPoisFetched]);

    // 2. FILTRAGEM LOCAL (Instantânea com useMemo)
    const displayedPois = useMemo(() => {
        if (selectedTag === 'TODOS') return masterPois;
        // Filtra o array que já está na memória
        return masterPois.filter(poi => poi.tag === selectedTag);
    }, [masterPois, selectedTag]);

    const itemsToShow = isExpanded ? displayedPois : displayedPois.slice(0, 5);

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                O que tem por perto (Raio ~5km)
            </h3>
            
            {/* FILTROS DE CATEGORIA (Ação Instantânea) */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-zinc-700 pb-3">
                {poiFilters.map(filter => (
                    <button
                        key={filter.tag}
                        onClick={() => {
                            setSelectedTag(filter.tag);
                            setIsExpanded(false); // Reseta expansão ao trocar filtro
                        }}
                        disabled={loading}
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

            {/* Lista de Resultados */}
            {/* Lista de Resultados */}
<div className="space-y-3 min-h-[100px]">
    {loading ? (
        <div className="flex items-center justify-center p-6 text-gray-500">
            <Icon icon={faSpinner} spin className="mr-2" /> Carregando locais...
        </div>
    ) : displayedPois.length > 0 ? (
        itemsToShow.map((poi, index) => {
            // --- A LINHA QUE FALTAVA ESTÁ AQUI ---
            const icon = getIconForTag(poi.tag); 
            // -------------------------------------

            return (
                <button 
                    key={`${poi.name}-${index}`} 
                    onClick={() => onClickPoi(poi)} 
                    className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg border-2 border-transparent hover:border-rentou-primary transition-all cursor-pointer text-left"
                >
                    <div className='flex items-center space-x-3 overflow-hidden'>
                        {/* Agora a variável 'icon' existe e o erro sumirá */}
                        <Icon icon={icon} className='w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0' />
                        <div className="truncate">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{poi.name}</p>
                            <p className="text-xs text-gray-500 truncate">{poi.address}</p> 
                        </div>
                    </div>
                    <span className="text-sm font-bold text-rentou-primary whitespace-nowrap ml-2">
                        {poi.distanceKm} km
                    </span>
                </button>
            );
        })
    ) : (
        <p className="text-center text-gray-500 p-4">
            Nenhum local encontrado nesta categoria.
        </p>
    )}
</div>
            
            {/* Botão Ver Mais */}
            {displayedPois.length > 5 && (
                <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="w-full mt-2 px-4 py-2 text-sm font-semibold text-rentou-primary bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center justify-center"
                >
                    {isExpanded ? (
                        <>Ver menos <Icon icon={faChevronUp} className="w-3 h-3 ml-2" /></>
                    ) : (
                        <>Ver mais {displayedPois.length - 5} locais <Icon icon={faChevronDown} className="w-3 h-3 ml-2" /></>
                    )}
                </button>
            )}
            
            <div className="mt-4">
                <button onClick={() => alert('Funcionalidade futura: Abrir rota no Google Maps')} className="flex items-center text-rentou-primary hover:underline text-sm font-medium">
                    <Icon icon={faPlus} className='w-4 h-4 mr-2' />
                    Adicionar um local importante (Rotas)
                </button>
            </div>
        </div>
    );
}
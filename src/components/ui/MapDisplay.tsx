// src/components/ui/MapDisplay.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
// Importa componentes do React-Leaflet e a biblioteca Leaflet
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Icon } from '@/components/ui/Icon';
import { faMapMarkerAlt, faSchool, faShoppingCart, faClinicMedical, faHospital, faShoppingBag, faTrainSubway, faBus, faHome, faBed, faShower, faCar, faDollarSign, faUniversity, faBusSimple, faPlaneArrival, IconDefinition } from '@fortawesome/free-solid-svg-icons'; 
import { PoiResult } from '@/services/GeocodingService'; 

// Componente auxiliar para forçar o mapa a centralizar no marcador
const ChangeView: React.FC<{ center: L.LatLngExpression, zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom, { animate: true }); 
  return null;
}

// Mapeamento de tags para ícones FA (ajustado para novos ícones)
const poiIconMapping: { [key: string]: IconDefinition } = {
    'school': faSchool,
    'university': faUniversity, 
    'supermarket': faShoppingCart,
    'pharmacy': faClinicMedical,
    'hospital': faHospital,
    'shopping_mall': faShoppingBag,
    'bus_station': faBusSimple, 
    'airport': faPlaneArrival, 
    'railway_station': faTrainSubway,
    'bus_stop': faBus,
    'TODOS': faMapMarkerAlt,
};

// Função de formatação de moeda para ser usada no popup
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);


interface MapDisplayProps {
    latitude: number;
    longitude: number;
    titulo: string;
    bairro: string; 
    pois: PoiResult[]; 
    activePoi: PoiResult | null; 
    // NOVO: Props detalhadas do imóvel para o Popup
    valorAluguel: number;
    quartos: number;
    banheiros: number;
    vagasGaragem: number;
}

/**
 * Componente funcional para exibir um mapa com o pin do imóvel e destaque de área.
 */
export const MapDisplay: React.FC<MapDisplayProps> = ({ 
    latitude, longitude, titulo, bairro, pois = [], activePoi,
    valorAluguel, quartos, banheiros, vagasGaragem
}) => {
    
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); 
    }, []);

    // Calcula a posição do centro (Imóvel ou POI Ativo)
    const centerLat = activePoi ? activePoi.latitude : latitude;
    const centerLon = activePoi ? activePoi.longitude : longitude;
    const centerPosition: L.LatLngExpression = [centerLat, centerLon];
    const radiusMeters = 500; 
    const currentZoom = activePoi ? 16 : 14; 

    // Ícone customizado para o IMÓVEL (AZUL)
    const imovelMarkerIcon = useMemo(() => {
        if (!isClient) return null; 

        const markerHtmlStyles = `
            background-color: #1D4ED8; /* rentou-primary */
            width: 2.5rem; /* Aumentado */
            height: 2.5rem; /* Aumentado */
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 4px solid #FFFFFF; /* Borda mais grossa */
            font-size: 1.5rem;
            box-shadow: 0 0 8px rgba(0,0,0,0.5); /* Sombra mais forte */
        `;
        
        // Usamos faHome para o imóvel
        const iconSvgPath = faHome.icon[4] as string; 
        
        return L.divIcon({
            className: "custom-imovel-icon",
            html: `<div style="${markerHtmlStyles}"><svg class="svg-inline--fa fa-home text-white" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="home" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" style="width: 1.5rem; height: 1.5rem;"><path fill="currentColor" d="${iconSvgPath}"></path></svg></div>`,
            iconSize: [40, 40], // Ajustado
            iconAnchor: [20, 40], // Ajustado
        });
    }, [isClient]);

    // Ícone customizado para POIs (CINZA ou VERMELHO se ativo)
    const createPoiIcon = useCallback((tag: string, isActive: boolean = false): L.DivIcon | null => {
        if (!isClient) return null;
        
        const poiIconDef = poiIconMapping[tag] || faMapMarkerAlt;
        const iconPath = poiIconDef.icon[4] as string;

        const bgColor = isActive ? '#DC2626' : '#6B7280'; // Vermelho para ativo
        const size = isActive ? '2rem' : '1.75rem';
        const borderWidth = isActive ? '3px' : '2px';
        const shadow = isActive ? '0 0 10px rgba(220, 38, 38, 0.7)' : '0 0 3px rgba(0,0,0,0.5)';
        
        const markerHtmlStyles = `
            background-color: ${bgColor}; 
            width: ${size};
            height: ${size};
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: ${borderWidth} solid #FFFFFF;
            font-size: 1rem;
            box-shadow: ${shadow};
        `;
        
        return L.divIcon({
            className: `custom-poi-icon ${tag} ${isActive ? 'active' : ''}`,
            html: `<div style="${markerHtmlStyles}"><svg class="svg-inline--fa text-white" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="${poiIconDef.iconName}" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" style="width: 1.25rem; height: 1.25rem;"><path fill="currentColor" d="${iconPath}"></path></svg></div>`,
            iconSize: [isActive ? 32 : 28, isActive ? 32 : 28],
            iconAnchor: [isActive ? 16 : 14, isActive ? 32 : 28], 
        });
    }, [isClient]);


    if (!isClient || !imovelMarkerIcon) {
         return <div className='w-full h-96 rounded-xl bg-gray-100 dark:bg-zinc-700/50' aria-hidden="true" />;
    }

    return (
        <div className='w-full h-96 rounded-xl shadow-lg'>
             <MapContainer 
                key={`${centerLat}-${centerLon}-${activePoi?.name}`} 
                center={centerPosition} 
                zoom={currentZoom} 
                scrollWheelZoom={true} 
                className="w-full h-full rounded-xl"
            >
                <ChangeView center={centerPosition} zoom={currentZoom} />
                
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* 1. Marcador do Imóvel (Sempre presente com POPUP MELHORADO) */}
                <Marker position={[latitude, longitude]} icon={imovelMarkerIcon}>
                    <Popup>
                        <div className='flex flex-col space-y-2 p-2'>
                            <h3 className='font-bold text-rentou-primary text-lg border-b pb-1'>{titulo}</h3>
                            <div className='flex items-center text-sm font-semibold text-green-600'>
                                <Icon icon={faDollarSign} className='w-4 h-4 mr-2' />
                                Aluguel: {formatCurrency(valorAluguel)}
                            </div>
                            <div className='grid grid-cols-2 gap-2 text-xs text-gray-700'>
                                <div className='flex items-center'>
                                    <Icon icon={faBed} className='w-4 h-4 mr-2 text-red-500' />
                                    {quartos} Qtos.
                                </div>
                                <div className='flex items-center'>
                                    <Icon icon={faShower} className='w-4 h-4 mr-2 text-blue-500' />
                                    {banheiros} Banh.
                                </div>
                                <div className='flex items-center'>
                                    <Icon icon={faCar} className='w-4 h-4 mr-2 text-gray-500' />
                                    {vagasGaragem} Vagas
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
                
                {/* 2. Círculo de Bairro (para a localização do Imóvel) */}
                <Circle 
                    center={[latitude, longitude]} 
                    pathOptions={{ color: '#1D4ED8', fillColor: '#1D4ED8', fillOpacity: 0.1, weight: 2 }} 
                    radius={radiusMeters} 
                >
                    <Popup>Área aproximada do bairro: {bairro}</Popup>
                </Circle>
                
                {/* 3. Marcadores de POIs (incluindo o ativo) */}
                {/* Renderizamos todos os POIs recebidos. O destaque (activePoi) é feito via ícone. */}
                {pois.map((poi, index) => {
                    const isActive = activePoi?.name === poi.name; 
                    const poiIcon = createPoiIcon(poi.tag, isActive);
                    
                    return poiIcon ? (
                        <Marker 
                            key={`poi-${poi.name}-${index}`} 
                            position={[poi.latitude, poi.longitude]} 
                            icon={poiIcon}
                        >
                            <Popup>
                                <div className='font-bold text-gray-800 text-base'>{poi.name}</div>
                                <div className='text-sm text-gray-600 mt-1'>Categoria: {poi.type}</div>
                                <div className='text-xs text-gray-500'>{poi.distanceKm} km do Imóvel</div>
                            </Popup>
                        </Marker>
                    ) : null;
                })}
                
            </MapContainer>
        </div>
    );
};
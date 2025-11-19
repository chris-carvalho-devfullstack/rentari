// src/components/ui/MapDisplay.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Icon } from '@/components/ui/Icon';
// Importação de Ícones (Removendo faExternalLinkAlt)
import { faMapMarkerAlt, faSchool, faShoppingCart, faClinicMedical, faHospital, faShoppingBag, faTrainSubway, faBus, faHome, faBed, faShower, faCar, faDollarSign, faUniversity, faBusSimple, faPlaneArrival, faUtensils, faChurch, faBuildingShield, faMask, faFilm, faMusic, faBeer, IconDefinition, faStreetView } from '@fortawesome/free-solid-svg-icons'; 
import { PoiResult } from '@/services/GeocodingService'; 

// Componente auxiliar para forçar o mapa a centralizar e ajustar o zoom no marcador
const ChangeView: React.FC<{ center: L.LatLngExpression, zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  // setView é usado para centralizar e dar o zoom correto
  map.setView(center, zoom, { animate: true, duration: 0.5 }); 
  return null;
}

// ... (Mapeamento de ícones e formatCurrency mantidos) ...
const poiIconMapping: { [key: string]: IconDefinition } = {
    'school': faSchool, 'university': faUniversity, 'supermarket': faShoppingCart, 'pharmacy': faClinicMedical, 
    'hospital': faHospital, 'shopping_mall': faShoppingBag, 'bus_station': faBusSimple, 'airport': faPlaneArrival, 
    'railway_station': faTrainSubway, 'bus_stop': faBus, 'restaurant': faUtensils, 'church': faChurch, 
    'police': faBuildingShield, 'theatre': faMask, 'cinema': faFilm, 'nightclub': faMusic, 'pub': faBeer,
    'TODOS': faMapMarkerAlt,
};

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
    valorAluguel: number;
    quartos: number;
    banheiros: number;
    vagasGaragem: number;
    bairroGeoJson: any | null; 
    fullAddressString: string; 
    onStreetViewClick: (url: string) => void; // <-- NOVO PROP
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ 
    latitude, longitude, titulo, bairro, pois = [], activePoi,
    valorAluguel, quartos, banheiros, vagasGaragem, bairroGeoJson,
    fullAddressString,
    onStreetViewClick // <-- NOVO PROP
}) => {
    
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); 
    }, []);

    // Calcula a posição do centro (Imóvel ou POI Ativo)
    const centerLat = activePoi ? activePoi.latitude : latitude;
    const centerLon = activePoi ? activePoi.longitude : longitude;
    const centerPosition: L.LatLngExpression = [centerLat, centerLon];
    const initialZoom = 14; 
    const currentZoom = activePoi ? 16 : initialZoom; 

    // Ícone customizado para o IMÓVEL (AZUL)
    const imovelMarkerIcon = useMemo(() => {
        if (!isClient) return null; 
        const markerHtmlStyles = `
            background-color: #1D4ED8; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; 
            justify-content: center; border-radius: 50%; border: 4px solid #FFFFFF; font-size: 1.5rem; 
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
        `;
        const iconSvgPath = faHome.icon[4] as string; 
        return L.divIcon({
            className: "custom-imovel-icon",
            html: `<div style="${markerHtmlStyles}"><svg class="svg-inline--fa fa-home text-white" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="home" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" style="width: 1.5rem; height: 1.5rem;"><path fill="currentColor" d="${iconSvgPath}"></path></svg></div>`,
            iconSize: [40, 40], iconAnchor: [20, 40],
        });
    }, [isClient]);

    // Ícone customizado para POIs
    const createPoiIcon = useCallback((tag: string, isActive: boolean = false): L.DivIcon | null => {
        if (!isClient) return null;
        const poiIconDef = poiIconMapping[tag] || faMapMarkerAlt;
        const iconPath = poiIconDef.icon[4] as string;

        const bgColor = isActive ? '#DC2626' : '#6B7280';
        const size = isActive ? '2rem' : '1.75rem';
        const borderWidth = isActive ? '3px' : '2px';
        const shadow = isActive ? '0 0 10px rgba(220, 38, 38, 0.7)' : '0 0 3px rgba(0,0,0,0.5)';
        
        const markerHtmlStyles = `
            background-color: ${bgColor}; width: ${size}; height: ${size}; display: flex; align-items: center; 
            justify-content: center; border-radius: 50%; border: ${borderWidth} solid #FFFFFF; font-size: 1rem; 
            box-shadow: ${shadow};
        `;
        
        return L.divIcon({
            className: `custom-poi-icon ${tag} ${isActive ? 'active' : ''}`,
            html: `<div style="${markerHtmlStyles}"><svg class="svg-inline--fa text-white" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="${poiIconDef.iconName}" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" style="width: 1.25rem; height: 1.25rem;"><path fill="currentColor" d="${iconPath}"></path></svg></div>`,
            iconSize: [isActive ? 32 : 28, isActive ? 32 : 28],
            iconAnchor: [isActive ? 16 : 14, isActive ? 32 : 28], 
        });
    }, [isClient]);

    // Estilo para o polígono GeoJSON (o limite do bairro)
    const geoJsonStyle = {
        color: '#1D4ED8', weight: 3, opacity: 0.8, 
        fillColor: '#1D4ED8', fillOpacity: 0.15,     
    };

    // URL para abrir o Street View (usando coordenadas para maior precisão)
    // CORREÇÃO: MOVIDO PARA CIMA (ANTES DO IF)
    const streetViewLink = useMemo(() => {
        // Formato para embed Street View (cbp para orientação padrão)
        return `http://maps.google.com/maps?layer=c&cbll=${latitude},${longitude}&cbp=12,20,0,0,0&hl=pt-BR&output=svembed`;
    }, [latitude, longitude]);

    if (!isClient || !imovelMarkerIcon) {
         return <div className='w-full h-96 rounded-xl bg-gray-100 dark:bg-zinc-700/50' aria-hidden="true" />;
    }
    
    return (
        <div className='w-full h-96 rounded-xl shadow-lg relative'>
             <MapContainer 
                // Zoom inicial é o initialZoom. O ChangeView fará o ajuste fino.
                zoom={initialZoom} 
                scrollWheelZoom={true} 
                className="w-full h-full rounded-xl"
                // Defina o centro inicial aqui (mesmo que o ChangeView o substitua)
                center={[latitude, longitude]} 
            >
                {/* Componente para forçar o foco no POI/Imóvel */}
                <ChangeView center={centerPosition} zoom={currentZoom} />
                
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* GeoJSON do Bairro - Garantindo que data seja um GeoJSON válido */}
                {bairroGeoJson && (
                    <GeoJSON 
                        data={bairroGeoJson} 
                        style={() => geoJsonStyle}
                        onEachFeature={(feature, layer) => {
                            layer.bindPopup(`**Bairro:** ${bairro}`);
                            // Opcional: ajustar o mapa para a área do polígono,
                            // mas vamos confiar no ChangeView para o foco primário.
                        }}
                    />
                )}
                
                {/* Marcador do Imóvel (Sempre presente) */}
                <Marker position={[latitude, longitude]} icon={imovelMarkerIcon}>
                    <Popup>
                        <div className='flex flex-col space-y-2 p-2'>
                            <h3 className='font-bold text-rentou-primary text-lg border-b pb-1'>{titulo}</h3>
                            <div className='flex items-center text-sm font-semibold text-green-600'>
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
                
                {/* Marcadores de POIs (incluindo o ativo) */}
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
            
            {/* BOTÃO DE AÇÃO (Posicionado Absolutamente) - AJUSTADO PARA bottom-6 */}
            <div className="absolute bottom-6 right-4 z-[400]">
                
                 {/* Botão Street View com Tooltip (title) */}
                <button
                    type="button"
                    onClick={() => onStreetViewClick(streetViewLink)}
                    className="flex items-center px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg shadow-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border border-gray-200 dark:border-zinc-700 font-semibold text-gray-700 dark:text-gray-300"
                    title="Ver a Visão da Rua (Street View) em modo interativo" // <-- Tooltip adicionado
                >
                    <Icon icon={faStreetView} className="w-5 h-5 mr-2 text-red-600" />
                    Street View
                </button>
                
            </div>
            {/* FIM: BOTÕES DE AÇÃO */}

        </div>
    );
};
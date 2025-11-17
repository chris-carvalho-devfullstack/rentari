// src/components/ui/MapDisplay.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
// Adicionado useMapEvents para garantir que a centralização funcione
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, useMapEvents } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Icon } from '@/components/ui/Icon';
// ... (imports de ícones) ...
import { faMapMarkerAlt, faSchool, faShoppingCart, faClinicMedical, faHospital, faShoppingBag, faTrainSubway, faBus, faHome, faBed, faShower, faCar, faDollarSign, faUniversity, faBusSimple, faPlaneArrival, faUtensils, faChurch, faBuildingShield, faMask, faFilm, faMusic, faBeer, IconDefinition } from '@fortawesome/free-solid-svg-icons'; 
import { PoiResult } from '@/services/GeocodingService'; 

// Componente auxiliar para forçar o mapa a centralizar e ajustar o zoom no marcador
const ChangeView: React.FC<{ center: L.LatLngExpression, zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  // setView agora é usado para centralizar e dar o zoom correto
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
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ 
    latitude, longitude, titulo, bairro, pois = [], activePoi,
    valorAluguel, quartos, banheiros, vagasGaragem, bairroGeoJson 
}) => {
    
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); 
    }, []);

    // Calcula a posição do centro (Imóvel ou POI Ativo)
    const centerLat = activePoi ? activePoi.latitude : latitude;
    const centerLon = activePoi ? activePoi.longitude : longitude;
    const centerPosition: L.LatLngExpression = [centerLat, centerLon];
    const currentZoom = activePoi ? 16 : 14; 

    // Ícone customizado para o IMÓVEL (AZUL)
    const imovelMarkerIcon = useMemo(() => {
        if (!isClient) return null; 
        const markerHtmlStyles = `
            background-color: #1D4ED8; /* rentou-primary */
            width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center;
            border-radius: 50%; border: 4px solid #FFFFFF; font-size: 1.5rem; box-shadow: 0 0 8px rgba(0,0,0,0.5);
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

        const bgColor = isActive ? '#DC2626' : '#6B7280'; // Vermelho para ativo
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


    if (!isClient || !imovelMarkerIcon) {
         return <div className='w-full h-96 rounded-xl bg-gray-100 dark:bg-zinc-700/50' aria-hidden="true" />;
    }

    // Estilo para o polígono GeoJSON (o limite do bairro)
    const geoJsonStyle = {
        color: '#1D4ED8',      
        weight: 3,             
        opacity: 0.8,          
        fillColor: '#1D4ED8',  
        fillOpacity: 0.15,     
    };

    return (
        <div className='w-full h-96 rounded-xl shadow-lg'>
             <MapContainer 
                // A chave força a remontagem e o foco quando o centro muda (POI ativo)
                key={`${centerLat}-${centerLon}-${activePoi?.name}`} 
                center={centerPosition} 
                zoom={currentZoom} 
                scrollWheelZoom={true} 
                className="w-full h-full rounded-xl"
                // Zoom inicial fixo para o GeoJSON não dar erro no primeiro load
                // Se GeoJSON estiver presente, ele será ajustado logo abaixo.
                // Se não, o ChangeView usa a posição inicial.
                zoom={14} 
            >
                {/* Componente para forçar o foco no POI/Imóvel */}
                <ChangeView center={centerPosition} zoom={currentZoom} />
                
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* NOVO: Desenho do GeoJSON do Bairro */}
                {bairroGeoJson && (
                    <GeoJSON 
                        // O GeoJSON precisa ser um objeto FeatureCollection ou Feature
                        data={bairroGeoJson.type === 'Feature' ? bairroGeoJson : { type: 'Feature', geometry: bairroGeoJson }}
                        style={() => geoJsonStyle}
                        onEachFeature={(feature, layer) => {
                            layer.bindPopup(`**Bairro:** ${bairro}`);
                            
                            // Opcional: Ajustar o zoom do mapa aos limites do bairro
                            // if (layer.getBounds) {
                            //     const map = layer.get
                            //     map.fitBounds(layer.getBounds());
                            // }
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
        </div>
    );
};
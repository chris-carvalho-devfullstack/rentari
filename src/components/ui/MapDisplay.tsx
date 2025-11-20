'use client';

import React, { useState, useMemo } from 'react'; 
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Importante: CSS do Mapbox
import { PoiResult } from '@/services/GeocodingService';
import { Icon } from '@/components/ui/Icon';
import { faMapMarkerAlt, faHome, faStreetView } from '@fortawesome/free-solid-svg-icons'; 

// Token público (seguro para expor no front)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapDisplayProps {
    latitude: number;
    longitude: number;
    titulo: string;
    bairro?: string; 
    pois: PoiResult[]; 
    activePoi: PoiResult | null; 
    // Props extras mantidas para compatibilidade, mesmo que não usadas diretamente no mapa visual
    valorAluguel?: number;
    quartos?: number;
    banheiros?: number;
    vagasGaragem?: number;
    bairroGeoJson?: any | null; 
    fullAddressString?: string; 
    onStreetViewClick: (url: string) => void;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ 
    latitude, longitude, titulo, pois = [], activePoi, onStreetViewClick
}) => {
    const [popupInfo, setPopupInfo] = useState<PoiResult | null>(null);

    // Gera link do Street View (Google) pois o Mapbox não tem nativo com a mesma qualidade
    const streetViewLink = useMemo(() => {
        return `http://maps.google.com/maps?layer=c&cbll=${latitude},${longitude}&cbp=12,20,0,0,0&hl=pt-BR&output=svembed`;
    }, [latitude, longitude]);

    return (
        <div className='w-full h-96 rounded-xl shadow-lg relative overflow-hidden bg-gray-100 dark:bg-zinc-800'>
            <Map
                initialViewState={{
                    longitude: longitude,
                    latitude: latitude,
                    zoom: 15,
                    bearing: 0,
                    pitch: 0
                }}
                style={{ width: '100%', height: '100%' }}
                // Estilo oficial do Mapbox (requer token válido)
                mapStyle="mapbox://styles/mapbox/streets-v12" 
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                {/* Controles de Navegação Padrão */}
                <NavigationControl position="top-right" />
                <GeolocateControl position="top-right" />

                {/* --- MARCADOR DO IMÓVEL (DESTAQUE) --- */}
                <Marker 
                    longitude={longitude} 
                    latitude={latitude} 
                    anchor="bottom"
                    color="#1D4ED8" // Cor primária Rentou
                >
                    {/* Ícone Customizado Puro CSS/SVG via FontAwesome */}
                    <div className="flex flex-col items-center">
                        <div className="bg-rentou-primary text-white p-2 rounded-full border-2 border-white shadow-lg transform hover:scale-110 transition-transform">
                            <Icon icon={faHome} className="w-5 h-5" />
                        </div>
                        {/* Seta do pino */}
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rentou-primary -mt-1"></div>
                    </div>
                </Marker>

                {/* --- MARCADORES DOS POIS --- */}
                {pois.map((poi, index) => {
                    const isActive = activePoi?.name === poi.name;
                    return (
                        <Marker
                            key={`poi-${index}`}
                            longitude={poi.longitude}
                            latitude={poi.latitude}
                            anchor="bottom"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setPopupInfo(poi); // Abre popup ao clicar
                            }}
                        >
                            <div 
                                className={`cursor-pointer transition-all duration-300 ${isActive ? 'z-50 scale-125' : 'z-10 hover:scale-110 opacity-80 hover:opacity-100'}`}
                            >
                                <Icon 
                                    icon={faMapMarkerAlt} 
                                    className={`w-6 h-6 drop-shadow-md ${isActive ? 'text-red-600' : 'text-gray-600'}`} 
                                />
                            </div>
                        </Marker>
                    )
                })}

                {/* --- POPUP INFORMATIVO (POI) --- */}
                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.longitude}
                        latitude={popupInfo.latitude}
                        onClose={() => setPopupInfo(null)}
                        className="text-black" // Garante texto legível
                    >
                        <div className="p-1 max-w-[200px]">
                            <strong className="block text-sm font-bold mb-1 text-gray-900">{popupInfo.name}</strong>
                            <p className="text-xs text-gray-600">{popupInfo.tag.toUpperCase()}</p>
                            <p className="text-xs font-mono mt-1 font-medium text-rentou-primary">{popupInfo.distanceKm} km</p>
                        </div>
                    </Popup>
                )}
            </Map>
            
            {/* BOTÃO STREET VIEW (Mantido sobre o mapa) */}
            <div className="absolute bottom-6 left-4 z-10">
                <button
                    type="button"
                    onClick={() => onStreetViewClick(streetViewLink)}
                    className="flex items-center px-3 py-2 bg-white rounded-lg shadow-xl hover:bg-gray-50 transition-colors border border-gray-200 font-semibold text-gray-700 text-sm"
                >
                    <Icon icon={faStreetView} className="w-4 h-4 mr-2 text-red-600" />
                    Street View
                </button>
            </div>
        </div>
    );
};
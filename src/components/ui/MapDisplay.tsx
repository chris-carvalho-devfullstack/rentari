// src/components/ui/MapDisplay.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Importa useState e useEffect
// Importa componentes do React-Leaflet e a biblioteca Leaflet
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Icon } from '@/components/ui/Icon';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

// Componente auxiliar para forçar o mapa a centralizar no marcador
const ChangeView: React.FC<{ center: L.LatLngExpression }> = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom(), { animate: true }); 
  return null;
}


interface MapDisplayProps {
    latitude: number;
    longitude: number;
    titulo: string;
    bairro: string; 
}

/**
 * Componente funcional para exibir um mapa com o pin do imóvel e destaque de área.
 */
export const MapDisplay: React.FC<MapDisplayProps> = ({ latitude, longitude, titulo, bairro }) => {
    
    // NOVO: Estado para rastrear se o componente está montado no cliente
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Define como true após a montagem no cliente (garantindo o ambiente DOM)
        setIsClient(true); 
    }, []);

    const position: L.LatLngExpression = [latitude, longitude];
    const radiusMeters = 500; 

    // Lógica do ícone dentro de useMemo para evitar o erro de SSR
    const customMarkerIcon = useMemo(() => {
        // Retorna um placeholder se não estiver no cliente (L é undefined)
        if (!isClient) return null; 

        const markerHtmlStyles = `
            background-color: #1D4ED8; /* rentou-primary */
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transform: rotate(45deg);
            border: 3px solid #FFFFFF;
        `;
        
        return L.divIcon({
            className: "custom-icon",
            html: `<div style="${markerHtmlStyles}"><svg class="svg-inline--fa fa-map-marker-alt fa-w-12 text-white" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-marker-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width: 1.25rem; height: 1.25rem; transform: rotate(-45deg);"><path fill="currentColor" d="M172.268 501.67C26.471 279.703 0 248.406 0 192C0 85.961 85.961 0 192 0s192 85.961 192 192c0 56.406-26.471 87.703-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32], 
        });
    }, [isClient]); 

    // Retorna um placeholder no servidor ou antes da hidratação para evitar o erro
    if (!isClient || !customMarkerIcon) {
         return <div className='w-full h-96 rounded-xl bg-gray-100 dark:bg-zinc-700/50' aria-hidden="true" />;
    }

    return (
        <div className='w-full h-96 rounded-xl shadow-lg'>
             <MapContainer 
                key={`${latitude}-${longitude}`} 
                center={position} 
                zoom={14} 
                scrollWheelZoom={true} 
                className="w-full h-full rounded-xl"
            >
                <ChangeView center={position} />
                
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Destaque da Área (Círculo do Bairro) */}
                <Circle 
                    center={position} 
                    pathOptions={{ color: '#1D4ED8', fillColor: '#1D4ED8', fillOpacity: 0.1, weight: 2 }} // Cores Rentou Primary
                    radius={radiusMeters} 
                >
                     <Popup>
                        Área aproximada do bairro: {bairro}
                    </Popup>
                </Circle>
                
                {/* Marcador do Imóvel */}
                <Marker position={position} icon={customMarkerIcon}>
                    <Popup>
                        <span className='font-bold text-rentou-primary'>{titulo}</span><br/>
                        Endereço exato.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};
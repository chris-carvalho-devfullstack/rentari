'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { fetchCoordinatesByAddress } from '@/services/GeocodingService';
import { Icon } from '@/components/ui/Icon';
import { 
    faSchool, faBus, faShoppingCart, faSubway, faHospital, faMapPin, 
    faPlus, faLock, faSpinner, faMapMarkerAlt, faChevronDown, faChevronUp,
    faStar, faSignInAlt, faTrash
} from '@fortawesome/free-solid-svg-icons'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Definição da interface PoiResult localmente ou importada se estiver em outro lugar
export interface PoiResult {
  name: string;
  type: string;
  tag: string;
  address: string;
  distanceKm: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
}

interface PoiListProps {
    latitude: number;
    longitude: number;
    onClickPoi: (lat: number, lng: number) => void; // Ajustado para corresponder à assinatura usada no código
    onPoisFetched: (pois: PoiResult[]) => void; 
}

// Configuração das Categorias
const PUBLIC_FILTERS = [
    { name: 'Escolas', tag: 'school', icon: faSchool, color: 'text-yellow-600' },
    { name: 'Ônibus', tag: 'bus_station', icon: faBus, color: 'text-indigo-600' },
];

const PROTECTED_FILTERS = [
    { name: 'Metrô', tag: 'station', icon: faSubway, color: 'text-purple-600' }, 
    { name: 'Supermercados', tag: 'supermarket', icon: faShoppingCart, color: 'text-blue-600' },
    { name: 'Hospitais', tag: 'hospital', icon: faHospital, color: 'text-red-600' },
];

const getIconForTag = (tag: string) => {
    if (tag === 'school') return faSchool;
    if (tag === 'bus_station') return faBus;
    if (tag === 'station') return faSubway;
    if (tag === 'supermarket') return faShoppingCart;
    if (tag === 'hospital') return faHospital;
    if (tag === 'custom') return faMapPin;
    return faMapMarkerAlt;
}

export const PoiList: React.FC<PoiListProps> = ({ latitude, longitude, onClickPoi, onPoisFetched }) => {
    const { isAuthenticated, user, updateUser } = useAuthStore();
    const router = useRouter();

    const [activeTag, setActiveTag] = useState<string>('school'); 
    const [allPoisCache, setAllPoisCache] = useState<PoiResult[]>([]); // Cache local de TODOS os POIs vindos da API
    const [pois, setPois] = useState<PoiResult[]>([]); // POIs filtrados exibidos atualmente
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    // Estados VIP
    const [isAddingPoint, setIsAddingPoint] = useState(false);
    const [newPointName, setNewPointName] = useState('');
    const [newPointAddress, setNewPointAddress] = useState('');
    const [addingLoading, setAddingLoading] = useState(false);

    // --- Busca POIs da API (Requisição Única) ---
    const fetchAllPois = useCallback(async () => {
        if (!latitude || !longitude) return;

        setLoading(true);
        try {
            // A API agora retorna TODOS os POIs de uma vez (Batching)
            // Não passamos mais 'tag' na URL.
            const res = await fetch(`/api/pois?lat=${latitude}&lon=${longitude}`);
            
            if (!res.ok) throw new Error('Erro na busca');
            
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setAllPoisCache(data); // Salva tudo no cache local

                // Filtra inicial (Escolas)
                const initialFilter = data.filter((p: any) => p.tag === 'school');
                setPois(initialFilter);
                onPoisFetched(initialFilter); 
            }
        } catch (error) {
            console.error("Erro ao buscar POIs:", error);
            setPois([]);
            onPoisFetched([]);
        } finally {
            setLoading(false);
        }
    }, [latitude, longitude, onPoisFetched]);

    // Efeito Inicial: Busca tudo uma única vez
    useEffect(() => {
        fetchAllPois();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latitude, longitude]); // Recarrega se mudar de imóvel

    const handleFilterClick = (tag: string, isProtected: boolean) => {
        setActiveTag(tag);
        setIsExpanded(false);

        if (isProtected && !isAuthenticated) {
            setAccessDenied(true);
            setPois([]); 
            onPoisFetched([]); 
            return;
        }

        setAccessDenied(false);

        // Filtra LOCALMENTE do cache em vez de chamar a API novamente
        const filtered = allPoisCache.filter(p => p.tag === tag);
        setPois(filtered);
        onPoisFetched(filtered);
    };

    // --- LÓGICA VIP ---
    const userPoints = user?.pontosImportantes || [];
    const canAddMore = userPoints.length < 6; 

    const getDistanceToSavedPoint = (ptLat: number, ptLon: number) => {
        const R = 6371; 
        const dLat = (ptLat - latitude) * Math.PI / 180;
        const dLon = (ptLon - longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(ptLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(1);
    };

    const handleAddPoint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAddingLoading(true);

        try {
            const coords = await fetchCoordinatesByAddress({ 
                logradouro: newPointAddress, cidade: '', estado: '', pais: 'Brasil', cep: '', bairro: '', numero: '' 
            });

            if (!coords) {
                alert("Endereço não encontrado.");
                setAddingLoading(false);
                return;
            }

            const newPoint = {
                id: Date.now().toString(),
                nome: newPointName,
                endereco: newPointAddress,
                latitude: coords.latitude,
                longitude: coords.longitude
            };

            const updatedPoints = [...userPoints, newPoint];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await updateUser({ pontosImportantes: updatedPoints } as any);
            
            setIsAddingPoint(false);
            setNewPointName('');
            setNewPointAddress('');
            
            // Foca no novo ponto
            const customPoi: PoiResult = {
                name: newPoint.nome,
                address: newPoint.endereco,
                latitude: newPoint.latitude,
                longitude: newPoint.longitude,
                type: 'custom',
                tag: 'custom',
                distanceKm: getDistanceToSavedPoint(newPoint.latitude, newPoint.longitude),
                distanceMeters: parseFloat(getDistanceToSavedPoint(newPoint.latitude, newPoint.longitude)) * 1000
            };
            
            // Ajuste na chamada do onClickPoi para passar lat/lng separados
            onClickPoi(customPoi.latitude, customPoi.longitude);
            onPoisFetched([customPoi]); 

        } catch (err) {
            console.error(err);
            alert("Erro ao salvar ponto.");
        } finally {
            setAddingLoading(false);
        }
    };

    const handleDeletePoint = async (idToDelete: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || !confirm("Deseja remover este ponto importante?")) return;

        const updatedPoints = userPoints.filter(p => p.id !== idToDelete);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateUser({ pontosImportantes: updatedPoints } as any);
    };

    const handleSavedPointClick = (pt: any) => {
        const customPoi: PoiResult = {
            name: pt.nome,
            type: 'custom',
            tag: 'custom',
            distanceKm: getDistanceToSavedPoint(pt.latitude, pt.longitude),
            distanceMeters: parseFloat(getDistanceToSavedPoint(pt.latitude, pt.longitude)) * 1000,
            latitude: pt.latitude,
            longitude: pt.longitude,
            address: pt.endereco
        };
        // Ajuste na chamada do onClickPoi para passar lat/lng separados
        onClickPoi(customPoi.latitude, customPoi.longitude);
        onPoisFetched([customPoi]); 
    };

    // Paginação local simples
    const itemsToShow = isExpanded ? pois : pois.slice(0, 5);

    return (
        <div className="mt-8 space-y-6">
            {/* Título */}
            <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Pontos de Interesse próximo <span className="text-xs font-normal text-gray-500">(Raio máx. 2km)</span>
                </h3>

                <div className="flex flex-wrap gap-2">
                    {PUBLIC_FILTERS.map(f => (
                        <button
                            key={f.tag}
                            onClick={() => handleFilterClick(f.tag, false)}
                            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ${
                                activeTag === f.tag && !accessDenied
                                ? 'bg-rentou-primary text-white ring-2 ring-offset-1 ring-rentou-primary' 
                                : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Icon icon={f.icon} className={`w-4 h-4 mr-2 ${activeTag === f.tag && !accessDenied ? 'text-white' : f.color}`} />
                            {f.name}
                        </button>
                    ))}

                    {PROTECTED_FILTERS.map(f => (
                        <button
                            key={f.tag}
                            onClick={() => handleFilterClick(f.tag, true)}
                            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm border ${
                                activeTag === f.tag 
                                ? 'bg-rentou-primary text-white ring-2 ring-offset-1 ring-rentou-primary border-transparent' 
                                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-600 text-gray-500 dark:text-gray-400 hover:border-blue-300'
                            }`}
                        >
                            {isAuthenticated ? (
                                <Icon icon={f.icon} className={`w-4 h-4 mr-2 ${activeTag === f.tag ? 'text-white' : f.color}`} />
                            ) : (
                                <Icon icon={faLock} className="w-3 h-3 mr-2 text-gray-400" />
                            )}
                            {f.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Área de Resultados da Lista */}
            <div className="min-h-[100px]">
                
                {loading && (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                        <Icon icon={faSpinner} spin className="w-6 h-6 mb-2 text-rentou-primary" /> 
                        <span className="text-sm">Buscando locais...</span>
                    </div>
                )}

                {!loading && accessDenied && (
                    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <Icon icon={faLock} className="w-8 h-8 text-blue-400 mb-3" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Conteúdo Exclusivo</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center max-w-xs">
                            Faça login gratuitamente para ver Metrô, Supermercados e Hospitais próximos.
                        </p>
                        <Link 
                            href="/login" 
                            className="flex items-center px-6 py-2 bg-rentou-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <Icon icon={faSignInAlt} className="w-4 h-4 mr-2" />
                            Fazer Login Agora
                        </Link>
                    </div>
                )}

                {!loading && !accessDenied && pois.length > 0 && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-2 border border-gray-100 dark:border-zinc-700">
                        {itemsToShow.map((poi, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => onClickPoi(poi.latitude, poi.longitude)}
                                className="w-full flex justify-between items-center p-3 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-all group text-left"
                            >
                                <div className="flex items-center overflow-hidden">
                                    <div className="bg-white dark:bg-zinc-600 p-2 rounded-full shadow-sm mr-3 group-hover:scale-110 transition-transform">
                                        <Icon icon={getIconForTag(poi.tag || activeTag)} className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                                    </div>
                                    <div className="truncate">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{poi.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{poi.address || 'Endereço não informado'}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-rentou-primary bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded ml-2 whitespace-nowrap">
                                    {poi.distanceKm} km
                                </span>
                            </button>
                        ))}
                        
                        {pois.length > 5 && (
                            <button
                                onClick={() => setIsExpanded(prev => !prev)}
                                className="w-full mt-2 py-2 text-xs font-semibold text-rentou-primary hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition-colors flex items-center justify-center"
                            >
                                {isExpanded ? (
                                    <>Ver menos <Icon icon={faChevronUp} className="w-3 h-3 ml-1" /></>
                                ) : (
                                    <>Ver mais {pois.length - 5} locais <Icon icon={faChevronDown} className="w-3 h-3 ml-1" /></>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {!loading && !accessDenied && pois.length === 0 && activeTag && (
                    <div className="text-center p-8 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-gray-300 dark:border-zinc-600">
                        <p className="text-sm text-gray-500">Nenhum local encontrado nesta categoria num raio de 2km.</p>
                    </div>
                )}
            </div>

            {/* --- SEÇÃO VIP: PONTOS IMPORTANTES --- */}
            <div className="pt-6 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <Icon icon={faStar} className="w-4 h-4 mr-2 text-rentou-secondary" /> 
                        Seus Pontos Importantes (VIP)
                    </h4>
                </div>

                {!isAuthenticated ? (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Calcule distâncias personalizadas</p>
                            <p className="text-xs text-gray-400 italic mt-1">Ex: Trabalho, Casa dos Pais, Academia...</p>
                        </div>
                        <Link 
                            href="/login"
                            className="flex items-center px-4 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm text-xs font-bold text-rentou-primary hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
                        >
                            <Icon icon={faSignInAlt} className="w-3 h-3 mr-2" />
                            Entrar para Adicionar
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {userPoints.map(pt => (
                            <div 
                                key={pt.id} 
                                onClick={() => handleSavedPointClick(pt)}
                                className="flex justify-between items-center p-3 bg-white dark:bg-zinc-800 border border-yellow-200 dark:border-yellow-900/30 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center overflow-hidden">
                                    <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-full mr-3 flex-shrink-0">
                                        <Icon icon={faStar} className="w-3 h-3 text-yellow-600" />
                                    </div>
                                    <div className="truncate mr-2">
                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{pt.nome}</p>
                                        <p className="text-xs text-gray-500 truncate">{pt.endereco}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    <span className="text-sm font-bold text-rentou-primary">
                                        {getDistanceToSavedPoint(pt.latitude, pt.longitude)} km
                                    </span>
                                    <button 
                                        onClick={(e) => handleDeletePoint(pt.id, e)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                                        title="Excluir ponto"
                                    >
                                        <Icon icon={faTrash} className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!isAddingPoint ? (
                            canAddMore && (
                                <button 
                                    onClick={() => setIsAddingPoint(true)}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg text-sm text-gray-500 hover:text-rentou-primary hover:border-rentou-primary hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center"
                                >
                                    <Icon icon={faPlus} className="w-3 h-3 mr-2" /> Adicionar ponto (Restam {6 - userPoints.length})
                                </button>
                            )
                        ) : (
                            <form onSubmit={handleAddPoint} className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-lg animate-in fade-in slide-in-from-top-2">
                                <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Novo Ponto Importante</h5>
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="Nome (ex: Trabalho)" 
                                        value={newPointName}
                                        onChange={e => setNewPointName(e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-transparent dark:text-white focus:ring-rentou-primary focus:border-rentou-primary"
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Endereço completo" 
                                        value={newPointAddress}
                                        onChange={e => setNewPointAddress(e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-transparent dark:text-white focus:ring-rentou-primary focus:border-rentou-primary"
                                        required
                                    />
                                    <div className="flex justify-end space-x-2 pt-2">
                                        <button type="button" onClick={() => setIsAddingPoint(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                        <button 
                                            type="submit" 
                                            disabled={addingLoading}
                                            className="px-4 py-1.5 text-xs font-medium bg-rentou-primary text-white rounded hover:bg-blue-700 flex items-center shadow-sm"
                                        >
                                            {addingLoading && <Icon icon={faSpinner} spin className="mr-2" />}
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
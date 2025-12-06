// src/components/anuncios/AnuncioDetalheClient.tsx
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Imovel } from '@/types/imovel'; 
import { PoiResult } from '@/services/GeocodingService'; 
import { Icon } from '@/components/ui/Icon';
import { ImageLightbox } from '@/components/anuncios/ImageLightbox'; 
import { PoiList } from '@/components/anuncios/PoiList'; 

import { 
    faChevronLeft, faSpinner, faMapMarkerAlt, faDollarSign, faBed, faShower, faCar, faRulerCombined, 
    faCalendarAlt, faHome, faUserTie, faPhone, faEnvelope, faVideo, faGlobe, faSquare, faTag,
    faBuilding, faStreetView, faTimes // <-- Adicionado faStreetView e faTimes para o modal
} from '@fortawesome/free-solid-svg-icons';

// Carregamento Dinâmico do Mapa (MapDisplay)
const DynamicMapDisplay = dynamic(() => 
    import('@/components/ui/MapDisplay').then((mod) => mod.MapDisplay),
    { 
        ssr: false,
        loading: () => <div className="h-96 w-full flex items-center justify-center bg-gray-200 dark:bg-zinc-700 rounded-xl"><Icon icon={faSpinner} spin className='w-6 h-6 text-rentou-primary'/> Carregando Mapa...</div>
    }
);

// Componente utilitário para formatação de moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);


// --- Componente Auxiliar para Contato/Agente (Painel Lateral) ---
interface AgentPanelProps {
    proprietarioHandle: string;
    proprietarioNome: string;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ proprietarioHandle, proprietarioNome }) => (
    <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-xl space-y-4 border border-gray-200 dark:border-zinc-700 sticky top-4">
        <div className="flex items-center space-x-3 border-b pb-3">
            <Icon icon={faUserTie} className='w-8 h-8 text-rentou-primary flex-shrink-0' />
            <div>
                <p className="text-sm text-gray-500 uppercase font-medium">Anunciado por</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{proprietarioNome}</h3>
            </div>
        </div>
        
        <button className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 transition-colors">
            <Icon icon={faPhone} className='w-4 h-4 mr-2' />
            Ligar para o Proprietário
        </button>
        
        <button className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-semibold bg-rentou-primary hover:bg-blue-700 transition-colors">
             <Icon icon={faEnvelope} className='w-4 h-4 mr-2' />
            Solicitar Detalhes
        </button>
        
        <Link 
            href={`/proprietario/${proprietarioHandle}`} 
            className="block text-center text-sm font-medium text-rentou-primary hover:underline pt-2"
        >
            Ver mais imóveis deste proprietário
        </Link>
    </div>
);

// FUNÇÃO AUXILIAR PARA CONVERTER URL DO YOUTUBE PARA FORMATO EMBED
const getEmbedUrl = (link: string | undefined): string | null => {
    if (!link) return null;
    const watchMatch = link.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    const shortMatch = link.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    if (link.includes('youtube.com/embed/')) {
        return link.split('?')[0];
    }
    return null;
};

// --- Componente Modal Street View (CORRIGIDO: Garante z-index superior ao mapa e cursor) ---
const StreetViewModal: React.FC<{ isOpen: boolean; onClose: () => void; url: string; }> = ({ isOpen, onClose, url }) => {
    if (!isOpen || !url) return null;
    
    // Overlay de fundo (z-index 999 para garantir que fique acima do Leaflet map)
    return (
        <div
            className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4" // <-- Z-index alto corrigido
            onClick={onClose}
        >
            {/* Botão de Fechar no canto do modal, com z-index ainda maior */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 text-white bg-black/50 hover:bg-black/70 rounded-full z-[1000] transition-colors flex items-center cursor-pointer" // <-- Cursor Pointer e texto Sair do Street View
                aria-label="Sair do Street View"
                title="Sair do Street View"
            >
                <Icon icon={faTimes} className="w-6 h-6 mr-2" />
                Sair do Street View
            </button>
            
            <div 
                className="relative w-full max-w-5xl h-full max-h-[90vh] bg-white dark:bg-zinc-800 rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Impede que o clique no modal feche o modal
            >
                <div className='flex items-center justify-between bg-gray-900 dark:bg-zinc-900 p-3'>
                    <h2 className='text-white text-lg font-semibold flex items-center'>
                        <Icon icon={faStreetView} className="w-5 h-5 mr-2 text-red-600" />
                        Google Street View Interativo
                    </h2>
                </div>
                {/* IFRAME DO STREET VIEW: O iframe precisa de w-full h-full para preencher o container */}
                <iframe
                    src={url}
                    title="Google Street View do Imóvel"
                    className="w-full h-full"
                    allowFullScreen={true}
                ></iframe>
            </div>
        </div>
    );
};
// --- Fim Componente Modal Street View ---

// DEFINIÇÃO DAS PROPS RECEBIDAS DO SERVIDOR
interface AnuncioDetalheClientProps {
    imovel: Imovel;
    bairroGeoJson: any;
}

export default function AnuncioDetalheClient({ imovel, bairroGeoJson }: AnuncioDetalheClientProps) {
    // ESTADOS INTERATIVOS (MANTIDOS DO ORIGINAL)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    const [activePoi, setActivePoi] = useState<PoiResult | null>(null);
    const [pois, setPois] = useState<PoiResult[]>([]);
    
    // --- NOVO ESTADO PARA O MODAL STREET VIEW ---
    const [isStreetViewModalOpen, setIsStreetViewModalOpen] = useState(false);
    const [streetViewUrl, setStreetViewUrl] = useState('');
    // ------------------------------------------

    const MOCK_VIRTUAL_TOUR_URL = 'https://example.com/360-tour-mock'; 
    const proprietarioHandle = imovel?.proprietarioId ? imovel.proprietarioId.slice(0, 8) : 'agente-rentou';
    const proprietarioNome = "Butters John Bee - Lettings"; 
    
    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
        if (!imovel) return;
        const totalImages = imovel.fotos.length;
        if (totalImages === 0) return;

        setCurrentImageIndex(prevIndex => {
            if (direction === 'next') {
                return (prevIndex + 1) % totalImages;
            } else {
                return (prevIndex - 1 + totalImages) % totalImages;
            }
        });
    }, [imovel]);

    // ============ POI Handler Functions (Memoized para quebrar o loop) ============
    
    const handlePoiClick = useCallback((poi: PoiResult | null) => {
        // Esta função de clique também é responsável por focar o mapa (via activePoi)
        if (activePoi && poi && activePoi.name === poi.name) {
             setActivePoi(null);
        } else {
            setActivePoi(poi);
        }
    }, [activePoi]); 

    const handlePoisFetched = useCallback((newPois: PoiResult[]) => {
        setPois(newPois);
        setActivePoi(null); // Limpa o destaque do mapa
    }, []);
    // ============ FIM DOS HANDLERS ============

    // ============ STREET VIEW HANDLERS ============
    const handleStreetViewOpen = useCallback((url: string) => {
        setStreetViewUrl(url);
        setIsStreetViewModalOpen(true);
    }, []);
    
    const handleStreetViewClose = useCallback(() => {
        setIsStreetViewModalOpen(false);
        setStreetViewUrl('');
    }, []);
    // ============ FIM HANDLERS ============

    // Cálculos de exibição (Mantidos)
    const totalDormitorios = imovel.quartos + imovel.suites;
    const totalBanheiros = imovel.banheiros + imovel.suites + imovel.lavabos + imovel.banheirosServico;
    const isTotalPackage = imovel.custoCondominioIncluso || imovel.custoIPTUIncluso;
    
    const valorAluguelBase = imovel.valorAluguel;
    const valorCondominio = imovel.custoCondominioIncluso ? imovel.valorCondominio : 0;
    const valorIPTU = imovel.custoIPTUIncluso ? imovel.valorIPTU : 0;
    const totalMonthlyValue = valorAluguelBase + valorCondominio + valorIPTU;

    const finalEmbedUrl = getEmbedUrl(imovel.linkVideoTour);
    
    const hasRealVideo = !!finalEmbedUrl; 
    const hasVirtualTour = imovel.visitaVirtual360; 

    const renderCharacteristic = (icon: any, label: string, value: string | number) => (
         <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Icon icon={icon} className='w-5 h-5 text-rentou-primary flex-shrink-0' />
            <div>
                <span className='font-semibold'>{value}</span>
                <span className='text-sm text-gray-500 dark:text-gray-400 ml-1'>{label}</span>
            </div>
        </div>
    );

    const fullAddressString = `${imovel.endereco.logradouro}, ${imovel.endereco.numero}${imovel.endereco.complemento ? ' - ' + imovel.endereco.complemento : ''}, ${imovel.endereco.bairro}, ${imovel.endereco.cidade} - ${imovel.endereco.estado} (${imovel.endereco.cep})`;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-gray-50 dark:bg-zinc-900">
            
            <Link href="/anuncios" className="text-rentou-primary hover:underline font-medium text-sm flex items-center space-x-2">
                <Icon icon={faChevronLeft} className='w-3 h-3' />
                <span>Voltar para o Catálogo</span>
            </Link>
            
            <ImageLightbox 
                images={imovel.fotos}
                currentIndex={currentImageIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                onNavigate={navigateLightbox}
            />
            
            {/* MODAL STREET VIEW: Renderizado aqui para sobrepor tudo (Z-999) */}
            <StreetViewModal 
                isOpen={isStreetViewModalOpen}
                onClose={handleStreetViewClose}
                url={streetViewUrl}
            />
            
            {/* Layout Principal: 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Coluna Esquerda (2/3): Conteúdo Principal */}
                <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-xl space-y-4 border border-gray-200 dark:border-zinc-700">
                        
                        {/* 1. Título e Preço */}
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{imovel.titulo}</h1>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mb-4">
                            <Icon icon={faMapMarkerAlt} className='w-4 h-4 mr-1' />
                            {imovel.endereco.cidade} - {imovel.endereco.estado} / Cód.: {imovel.smartId}
                        </p>
                        
                        <div className='flex flex-col sm:flex-row items-start sm:items-end justify-between border-b pb-4 border-gray-100 dark:border-zinc-700'>
                            <div>
                                <p className="text-4xl font-extrabold text-green-600 dark:text-green-400"> 
                                    <span>{formatCurrency(totalMonthlyValue)}</span>
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {isTotalPackage ? 'Valor mensal total (taxas inclusas)' : 'Valor do Aluguel Base'}
                                </p>
                            </div>
                        </div>
                        
                        {/* 2. Destaques Estruturais (Key Info) */}
                        <div className="flex flex-wrap gap-6 pt-2">
                            {renderCharacteristic(faBed, 'Dormitórios', totalDormitorios)}
                            {renderCharacteristic(faShower, 'Banheiros', totalBanheiros)}
                            {renderCharacteristic(faRulerCombined, 'Área Útil (m²)', imovel.areaUtil)}
                            {renderCharacteristic(faCar, 'Vagas', imovel.vagasGaragem)}
                            {renderCharacteristic(faSquare, 'Área Total (m²)', imovel.areaTotal)}
                        </div>
                        
                        {/* 3. Galeria de Imagens (Com Lightbox Trigger) */}
                        {imovel.fotos.length > 0 && (
                            <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-4">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Galeria de Fotos</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {imovel.fotos.slice(0, 7).map((url, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => openLightbox(index)}
                                            className="relative w-full h-24 md:h-32 group cursor-pointer overflow-hidden rounded-lg shadow-md"
                                        >
                                            <img
                                                src={url}
                                                alt={`Foto ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            {index === 6 && imovel.fotos.length > 7 && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xl font-bold">
                                                    +{imovel.fotos.length - 7}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* 4. Descrição Completa */}
                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Descrição do Imóvel</h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {imovel.descricaoLonga || 'Nenhuma descrição detalhada fornecida para este anúncio.'}
                            </p>
                            
                            <div className="pt-3 border-t border-gray-100 dark:border-zinc-700">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-2 flex items-center space-x-2">
                                     <Icon icon={faMapMarkerAlt} className='w-4 h-4 mr-2 text-red-500' />
                                     <span>Localização Exata (Para Contrato)</span>
                                </h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {fullAddressString}
                                </p>
                            </div>
                        </div>
                        
                        {/* 5. Visita Virtual e Vídeo */}
                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Mídia Interativa</h2>
                            
                            {(hasRealVideo || hasVirtualTour) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {hasVirtualTour && (
                                        <div className="space-y-2">
                                            <h3 className='text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center'>
                                                <Icon icon={faVideo} className='w-5 h-5 mr-2 text-green-500' />
                                                Visita Virtual 360°
                                            </h3>
                                            <a href={MOCK_VIRTUAL_TOUR_URL} target="_blank" rel="noopener noreferrer" className="block w-full h-48 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden flex items-center justify-center text-rentou-primary hover:bg-gray-200 dark:hover:bg-zinc-600 border-4 border-dashed border-rentou-primary/50">
                                                <div className='text-center'>
                                                     <Icon icon={faGlobe} className='w-10 h-10 mb-2' />
                                                     <span className='font-semibold'>Clique para o Tour Virtual (Mock)</span>
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                    {hasRealVideo && (
                                        <div className="space-y-2">
                                            <h3 className='text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center'>
                                                <Icon icon={faVideo} className='w-5 h-5 mr-2 text-red-600' />
                                                Vídeo do Imóvel
                                            </h3>
                                            <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-lg">
                                                <iframe
                                                    className="absolute top-0 left-0 w-full h-full"
                                                    src={finalEmbedUrl!}
                                                    title="Vídeo do Imóvel"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-100 dark:bg-zinc-700 rounded-lg text-center">
                                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                                        Este imóvel não possui link de vídeo ou visita virtual 360º cadastrado.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 6. Informações de Locação e Financeiras Detalhadas */}
                         <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Informações de Locação</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                                <div className='space-y-3'>
                                    <div className='font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-1'>Detalhes Gerais</div>
                                    <p><Icon icon={faTag} className='w-4 h-4 mr-2 text-blue-500' /> Categoria Principal: <span className='font-medium'>{imovel.categoriaPrincipal}</span></p>
                                    <p><Icon icon={faHome} className='w-4 h-4 mr-2 text-blue-500' /> Tipo Detalhado: <span className='font-medium'>{imovel.tipoDetalhado}</span></p>
                                    <p><Icon icon={faCalendarAlt} className='w-4 h-4 mr-2 text-red-500' /> Disponível a partir de: <span className='font-medium'>{new Date(imovel.dataDisponibilidade).toLocaleDateString('pt-BR', { dateStyle: 'medium' })}</span></p>
                                </div>
                                <div className='space-y-3'>
                                    <div className='font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-1'>Estrutura Interna</div>
                                    <p><Icon icon={faBed} className='w-4 h-4 mr-2 text-red-500' /> Suítes: <span className='font-medium'>{imovel.suites}</span></p>
                                    <p><Icon icon={faShower} className='w-4 h-4 mr-2 text-blue-500' /> Lavabos: <span className='font-medium'>{imovel.lavabos}</span></p>
                                    <p><Icon icon={faBuilding} className='w-4 h-4 mr-2 text-green-500' /> Andar: <span className='font-medium'>{imovel.andar ? imovel.andar : 'Térreo/Único'}</span></p>
                                    <p><Icon icon={faTag} className='w-4 h-4 mr-2 text-gray-500' /> Animais: <span className='font-medium'>{imovel.aceitaAnimais ? 'Permitido' : 'Não Permitido'}</span></p>
                                </div>
                                <div className='space-y-3'>
                                    <div className='font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-1'>Encargos</div>
                                    <p><Icon icon={faDollarSign} className='w-4 h-4 mr-2 text-yellow-500' /> Condomínio: <span className='font-medium'>{imovel.responsavelCondominio}</span></p>
                                    <p><Icon icon={faDollarSign} className='w-4 h-4 mr-2 text-yellow-500' /> IPTU: <span className='font-medium'>{imovel.responsavelIPTU}</span></p>
                                    <p><Icon icon={faRulerCombined} className='w-4 h-4 mr-2 text-gray-500' /> Finalidades: <span className='font-medium'>{imovel.finalidades.join(', ')}</span></p>
                                </div>
                            </div>
                            {imovel.caracteristicas.length > 0 && (
                                <div className='pt-4'>
                                    <h3 className='font-bold text-gray-800 dark:text-gray-200 mb-2'>Comodidades:</h3>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {imovel.caracteristicas.map(c => (
                                            <span key={c} className='px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded-full font-medium'>{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 7. Seção de Mapa (Real) */}
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Localização Exata</h2>
                        <DynamicMapDisplay 
                            latitude={imovel.latitude as number}
                            longitude={imovel.longitude as number}
                            titulo={imovel.titulo}
                            bairro={imovel.endereco.bairro}
                            pois={pois} 
                            activePoi={activePoi} 
                            valorAluguel={totalMonthlyValue}
                            quartos={totalDormitorios}
                            banheiros={totalBanheiros}
                            vagasGaragem={imovel.vagasGaragem}
                            bairroGeoJson={bairroGeoJson}
                            fullAddressString={fullAddressString}
                            onStreetViewClick={handleStreetViewOpen}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                            {bairroGeoJson ? (
                                <>O polígono desenhado representa a área do bairro **{imovel.endereco.bairro}** (dados OpenStreetMap).</>
                            ) : (
                                 <>A localização exata do imóvel é exibida. Limites do bairro não estão disponíveis.</>
                            )}
                        </p>
                    </div>
                    
                    {/* 8. PONTOS DE INTERESSE (POIs) */}
                     <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                        <PoiList
                            latitude={imovel.latitude as number}
                            longitude={imovel.longitude as number}
                            onClickPoi={handlePoiClick} 
                            onPoisFetched={handlePoisFetched} 
                        />
                    </div>
                </div>
                
                {/* Coluna Direita (1/3): Contato e Agente */}
                <div className="lg:col-span-1">
                    <AgentPanel 
                        proprietarioHandle={proprietarioHandle}
                        proprietarioNome={proprietarioNome}
                    />
                </div>
            </div>

            <footer className="mt-12 text-center p-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-zinc-700">
                Anúncio sob o Cód. {imovel.smartId}. Disclaimer: A Rentou não se responsabiliza por erros na descrição.
            </footer>
        </div>
    );
}
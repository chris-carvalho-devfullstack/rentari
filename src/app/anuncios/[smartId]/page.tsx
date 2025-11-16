// src/app/anuncios/[smartId]/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchImovelPorSmartId } from '@/services/ImovelService'; 
import { fetchCoordinatesByAddress } from '@/services/GeocodingService'; 
import { Imovel } from '@/types/imovel'; 
import { Icon } from '@/components/ui/Icon';
import { ImageLightbox } from '@/components/anuncios/ImageLightbox'; 
import { StreetView } from '@/components/ui/StreetView'; 
import { PoiList } from '@/components/anuncios/PoiList'; // Importa PoiList

import { 
    faChevronLeft, faSpinner, faMapMarkerAlt, faDollarSign, faBed, faShower, faCar, faRulerCombined, 
    faCalendarAlt, faHome, faUserTie, faPhone, faEnvelope, faVideo, faGlobe, faSquare, faTag,
    faBuilding, faMountain
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

    // 1. Tenta extrair o ID de uma URL completa (watch?v=)
    const watchMatch = link.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
        // Retorna o formato embed limpo
        return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // 2. Tenta extrair o ID de uma URL curta (youtu.be/)
    const shortMatch = link.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    
    // 3. Se já for um embed, retorna a URL original (mas remove query params desnecessários)
    if (link.includes('youtube.com/embed/')) {
        return link.split('?')[0];
    }

    return null;
};
// FIM FUNÇÃO AUXILIAR

export default function AnuncioDetalhePublicoPage() {
    const params = useParams();
    const smartId = Array.isArray(params.smartId) ? params.smartId[0] : params.smartId; 
    
    const [imovel, setImovel] = useState<Imovel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    const MOCK_VIRTUAL_TOUR_URL = 'https://example.com/360-tour-mock'; 
    const SAFE_MOCK_VIDEO_ID = 'Gv459g2-K70'; // Video de demonstração seguro
    const MOCK_EMBED_URL = `https://www.youtube.com/embed/${SAFE_MOCK_VIDEO_ID}`;

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


    useEffect(() => {
        if (!smartId) {
            setError('ID do anúncio não encontrado.');
            setLoading(false);
            return;
        }

        const loadImovel = async () => {
            setLoading(true);
            try {
                const data = await fetchImovelPorSmartId(smartId as string);
                
                if (!data || data.status !== 'ANUNCIADO') {
                    throw new Error('Anúncio não encontrado ou indisponível.');
                }
                
                let { latitude, longitude } = data;

                // --- LÓGICA DE GEOCODING: Chamado apenas se as coordenadas estiverem ausentes ---
                const hasValidCoords = (latitude && longitude && (latitude !== 0 || longitude !== 0));

                if (!hasValidCoords) {
                    const coords = await fetchCoordinatesByAddress(data.endereco);
                    if (coords) {
                        latitude = coords.latitude;
                        longitude = coords.longitude;
                    } else {
                        // Fallback de Geocoding
                        latitude = -23.55052;
                        longitude = -46.633307;
                    }
                }
                // --- FIM LÓGICA DE GEOCODING ---

                setImovel({ ...data, latitude, longitude }); 
            } catch (err: any) {
                console.error('Erro ao buscar anúncio:', err);
                setError(err.message || 'Falha ao carregar os dados do anúncio.'); 
            } finally {
                setLoading(false);
            }
        };

        loadImovel();
    }, [smartId]);
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-48 bg-gray-50 dark:bg-zinc-900">
                <Icon icon={faSpinner} spin className="h-6 w-6 text-rentou-primary mr-3" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">Carregando detalhes do anúncio...</p>
            </div>
        );
    }
    
    // Verifica se os dados estão completos após o fetch (incluindo as coordenadas)
    if (error || !imovel || !imovel.latitude || !imovel.longitude) {
         return (
            <div className="text-center p-10 bg-red-100 text-red-700 rounded-lg m-8">
                <strong className="font-bold">Erro:</strong>
                <span className="block sm:inline"> {error || 'O anúncio solicitado não pôde ser carregado ou as coordenadas do mapa estão ausentes.'}</span>
                <Link href="/anuncios" className="ml-4 font-semibold hover:underline text-blue-700">Voltar para o Catálogo</Link>
            </div>
        );
    }
    
    const totalDormitorios = imovel.quartos + imovel.suites;
    const totalBanheiros = imovel.banheiros + imovel.suites + imovel.lavabos + imovel.banheirosServico;
    const isTotalPackage = imovel.custoCondominioIncluso || imovel.custoIPTUIncluso;
    
    const valorAluguelBase = imovel.valorAluguel;
    const valorCondominio = imovel.custoCondominioIncluso ? imovel.valorCondominio : 0;
    const valorIPTU = imovel.custoIPTUIncluso ? imovel.valorIPTU : 0;
    const totalMonthlyValue = valorAluguelBase + valorCondominio + valorIPTU;

    // Converte o link do imóvel para o formato embed. Se for inválido, cai no null.
    const finalEmbedUrl = getEmbedUrl(imovel.linkVideoTour);
    
    const hasRealVideo = !!finalEmbedUrl; // Tem um link de vídeo válido
    const hasVirtualTour = imovel.visitaVirtual360; // Tem visita virtual marcada
    const hasAnyMedia = hasRealVideo || hasVirtualTour;


    // Função auxiliar para renderizar características
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
            
            {/* === Lightbox Modal === */}
            <ImageLightbox 
                images={imovel.fotos}
                currentIndex={currentImageIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                onNavigate={navigateLightbox}
            />
            
            {/* Layout Principal: 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Coluna Esquerda (2/3): Conteúdo Principal */}
                <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-xl space-y-4 border border-gray-200 dark:border-zinc-700">
                        
                        {/* 1. Título e Preço */}
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{imovel.titulo}</h1>
                        
                        {/* Localização e Código (abaixo do título, alinhado à esquerda) */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mb-4">
                            <Icon icon={faMapMarkerAlt} className='w-4 h-4 mr-1' />
                            {imovel.endereco.cidade} - {imovel.endereco.estado} / Cód.: {imovel.smartId}
                        </p>
                        
                        <div className='flex flex-col sm:flex-row items-start sm:items-end justify-between border-b pb-4 border-gray-100 dark:border-zinc-700'>
                            <div>
                                <p className="text-4xl font-extrabold text-green-600 dark:text-green-400"> {/* CORREÇÃO: Fonte aumentada para 4xl */}
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
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                        
                        {/* 4. Descrição Completa (CORRIGIDO: Adiciona Endereço) */}
                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Descrição do Imóvel</h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {imovel.descricaoLonga || 'Nenhuma descrição detalhada fornecida para este anúncio.'}
                            </p>
                            
                            {/* NOVO: ENDEREÇO COMPLETO NO FINAL DA DESCRIÇÃO */}
                            <div className="pt-3 border-t border-gray-100 dark:border-zinc-700">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-2 flex items-center space-x-2">
                                     <Icon icon={faMapMarkerAlt} className='w-4 h-4 text-red-500' />
                                     <span>Localização Exata (Para Contrato)</span>
                                </h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {imovel.endereco.logradouro}, {imovel.endereco.numero}
                                    {imovel.endereco.complemento && `, ${imovel.endereco.complemento}`}
                                    , {imovel.endereco.bairro}
                                    , {imovel.endereco.cidade} - {imovel.endereco.estado} ({imovel.endereco.cep})
                                </p>
                            </div>
                        </div>
                        {/* FIM: DESCRIÇÃO CORRIGIDA */}
                        
                        {/* 5. Visita Virtual e Vídeo (LÓGICA CONDICIONAL) */}
                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Mídia Interativa</h2>
                            
                            {hasAnyMedia ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* Visita Virtual 360 */}
                                    {hasVirtualTour && (
                                        <div className="space-y-2">
                                            <h3 className='text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center'>
                                                <Icon icon={faVideo} className='w-5 h-5 mr-2 text-green-500' />
                                                Visita Virtual 360°
                                            </h3>
                                            {/* Mock da Visita Virtual */}
                                            <a href={MOCK_VIRTUAL_TOUR_URL} target="_blank" rel="noopener noreferrer" className="block w-full h-48 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden flex items-center justify-center text-rentou-primary hover:bg-gray-200 dark:hover:bg-zinc-600 border-4 border-dashed border-rentou-primary/50">
                                                <div className='text-center'>
                                                     <Icon icon={faGlobe} className='w-10 h-10 mb-2' />
                                                     <span className='font-semibold'>Clique para o Tour Virtual (Mock)</span>
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                    
                                    {/* Vídeo do Imóvel (YouTube) */}
                                    {hasRealVideo && (
                                        <div className="space-y-2">
                                            <h3 className='text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center'>
                                                <Icon icon={faVideo} className='w-5 h-5 mr-2 text-red-600' />
                                                Vídeo do Imóvel
                                            </h3>
                                            {/* Embed Responsivo */}
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
                        {/* FIM: LÓGICA CONDICIONAL */}


                        {/* 6. Informações de Locação e Financeiras Detalhadas */}
                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Informações de Locação</h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                                
                                {/* Coluna 1: Tipo e Status */}
                                <div className='space-y-3'>
                                    <div className='font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-1'>Detalhes Gerais</div>
                                    <p><Icon icon={faTag} className='w-4 h-4 mr-2 text-blue-500' /> Categoria Principal: <span className='font-medium'>{imovel.categoriaPrincipal}</span></p>
                                    <p><Icon icon={faHome} className='w-4 h-4 mr-2 text-blue-500' /> Tipo Detalhado: <span className='font-medium'>{imovel.tipoDetalhado}</span></p>
                                    <p><Icon icon={faCalendarAlt} className='w-4 h-4 mr-2 text-red-500' /> Disponível a partir de: <span className='font-medium'>{new Date(imovel.dataDisponibilidade).toLocaleDateString('pt-BR', { dateStyle: 'medium' })}</span></p>
                                </div>

                                {/* Coluna 2: Estrutura */}
                                <div className='space-y-3'>
                                    <div className='font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-1'>Estrutura Interna</div>
                                    <p><Icon icon={faBed} className='w-4 h-4 mr-2 text-red-500' /> Suítes: <span className='font-medium'>{imovel.suites}</span></p>
                                    <p><Icon icon={faShower} className='w-4 h-4 mr-2 text-blue-500' /> Lavabos: <span className='font-medium'>{imovel.lavabos}</span></p>
                                    <p><Icon icon={faBuilding} className='w-4 h-4 mr-2 text-green-500' /> Andar: <span className='font-medium'>{imovel.andar ? imovel.andar : 'Térreo/Único'}</span></p>
                                    <p><Icon icon={faTag} className='w-4 h-4 mr-2 text-gray-500' /> Animais: <span className='font-medium'>{imovel.aceitaAnimais ? 'Permitido' : 'Não Permitido'}</span></p>
                                </div>

                                {/* Coluna 3: Responsabilidades */}
                                <div className='space-y-3'>
                                    <div className='font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-1'>Encargos</div>
                                    <p><Icon icon={faDollarSign} className='w-4 h-4 mr-2 text-yellow-500' /> Condomínio: <span className='font-medium'>{imovel.responsavelCondominio}</span></p>
                                    <p><Icon icon={faDollarSign} className='w-4 h-4 mr-2 text-yellow-500' /> IPTU: <span className='font-medium'>{imovel.responsavelIPTU}</span></p>
                                    <p><Icon icon={faRulerCombined} className='w-4 h-4 mr-2 text-gray-500' /> Finalidades: <span className='font-medium'>{imovel.finalidades.join(', ')}</span></p>
                                </div>
                            </div>
                            
                            {/* Características Adicionais */}
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
                        {/* Renderiza o mapa com as coordenadas (obtidas por geocoding ou mock) */}
                        <DynamicMapDisplay 
                            latitude={imovel.latitude as number}
                            longitude={imovel.longitude as number}
                            titulo={imovel.titulo}
                            bairro={imovel.endereco.bairro} 
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                            O círculo indica a área aproximada do bairro **{imovel.endereco.bairro}**.
                        </p>
                    </div>
                    
                    {/* 9. PONTOS DE INTERESSE (POIs) - MOVIDO PARA CÁ */}
                     <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                        <PoiList
                            latitude={imovel.latitude as number}
                            longitude={imovel.longitude as number}
                        />
                    </div>

                    {/* 8. Street View (MOVIDO PARA BAIXO, MAIS DISCRETO) */}
                    <StreetView
                        latitude={imovel.latitude as number}
                        longitude={imovel.longitude as number}
                        address={fullAddressString}
                    />

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
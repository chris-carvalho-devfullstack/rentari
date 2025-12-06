// src/components/anuncios/AnuncioDetalheClient.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Imovel } from '@/types/imovel'; 
import { PoiResult } from '@/services/GeocodingService'; 
import { PoiList } from '@/components/anuncios/PoiList'; 
import { ImageLightbox } from '@/components/anuncios/ImageLightbox'; 

// Ícones Modernos (Lucide React)
import { 
  MapPin, Bed, Bath, Square, Heart, Share2, Wifi, Lock, User, Phone, MessageCircle, 
  ChevronRight, Building, Check, Car, AlertCircle, Sparkles, Loader2, Map as MapIcon, 
  Camera, X, Info, Sun, ShieldCheck, FileText, Hammer, LayoutDashboard, Tag, Calendar, DollarSign
} from 'lucide-react';

// Mantemos o FontAwesome apenas se necessário para componentes legados internos
import { Icon } from '@/components/ui/Icon';
import { faStreetView } from '@fortawesome/free-solid-svg-icons';

// Carregamento Dinâmico do Mapa (MapDisplay)
const DynamicMapDisplay = dynamic(() => 
    import('@/components/ui/MapDisplay').then((mod) => mod.MapDisplay),
    { 
        ssr: false,
        loading: () => <div className="h-96 w-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400"><Loader2 className="w-8 h-8 animate-spin"/></div>
    }
);

// --- UTILITÁRIOS ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatEnum = (value: string | undefined) => {
    if (!value) return '-';
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const getEmbedUrl = (link: string | undefined): string | null => {
    if (!link) return null;
    const watchMatch = link.match(/[?&]v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = link.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    if (link.includes('youtube.com/embed/')) return link.split('?')[0];
    return null;
};

// Helper para determinar o selo de finalidade
const getFinalidadeBadge = (finalidades: string[]) => {
    const isVenda = finalidades.some(f => f.includes('Venda'));
    const isLocacao = finalidades.some(f => f.includes('Locação'));

    if (isVenda && isLocacao) return { label: 'Venda e Locação', color: 'bg-purple-100 text-purple-800' };
    if (isVenda) return { label: 'Venda', color: 'bg-blue-100 text-blue-800' };
    if (isLocacao) return { label: 'Locação', color: 'bg-green-100 text-green-800' };
    return { label: finalidades[0] || 'Imóvel', color: 'bg-gray-100 text-gray-800' };
};

// --- MODAL STREET VIEW ---
const StreetViewModal = ({ isOpen, onClose, url }: { isOpen: boolean; onClose: () => void; url: string; }) => {
    if (!isOpen || !url) return null;
    return (
        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50">
                <X className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-5xl h-[80vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                <div className='flex items-center justify-between bg-zinc-900/50 p-4 absolute top-0 w-full z-10 pointer-events-none'>
                    <h2 className='text-white text-sm font-semibold flex items-center gap-2 pointer-events-auto'>
                        <Icon icon={faStreetView} className="text-blue-500" /> Street View
                    </h2>
                </div>
                <iframe src={url} title="Street View" className="w-full h-full" allowFullScreen={true}></iframe>
            </div>
        </div>
    );
};

// --- PROPS ---
interface AnuncioDetalheClientProps {
    imovel: Imovel;
    bairroGeoJson: any;
    outrosImoveis?: Imovel[];
}

export default function AnuncioDetalheClient({ imovel, bairroGeoJson, outrosImoveis = [] }: AnuncioDetalheClientProps) {
    const user = null; // Placeholder para auth
    
    // States Visuais
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activePoi, setActivePoi] = useState<PoiResult | null>(null);
    const [pois, setPois] = useState<PoiResult[]>([]);
    const [isStreetViewModalOpen, setIsStreetViewModalOpen] = useState(false);
    const [streetViewUrl, setStreetViewUrl] = useState('');

    // States de Funcionalidades
    const [note, setNote] = useState("");
    const [isNoteSaving, setIsNoteSaving] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [broadbandData, setBroadbandData] = useState<any>(null);
    const [loadingBroadband, setLoadingBroadband] = useState(false);
    
    // States IA
    const [aiHighlights, setAiHighlights] = useState("");
    const [loadingAiHighlights, setLoadingAiHighlights] = useState(false);
    const [aiNeighborhood, setAiNeighborhood] = useState("");
    const [loadingNeighborhood, setLoadingNeighborhood] = useState(false);
    const [showNeighborhoodModal, setShowNeighborhoodModal] = useState(false);

    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; 

    // --- EFEITOS ---
    useEffect(() => {
        const localFav = localStorage.getItem(`fav_${imovel.id}`);
        if(localFav) setIsFavorite(true);
        const localNote = localStorage.getItem(`note_${imovel.id}`);
        if(localNote) setNote(localNote);
    }, [imovel.id]);

    useEffect(() => {
        if(imovel.endereco.cep) {
            setLoadingBroadband(true);
            const timer = setTimeout(() => {
                setBroadbandData({
                    avgSpeed: "600Mb",
                    technology: "Fibra Óptica",
                    providers: ["Vivo", "Claro", "Oi", "Local"],
                    bestFor: ["Streaming 4K", "Home Office", "Jogos"],
                    available: true
                });
                setLoadingBroadband(false);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [imovel.endereco.cep]);

    // --- HANDLERS ---
    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
        const total = imovel.fotos.length;
        if (total === 0) return;
        setCurrentImageIndex(prev => direction === 'next' ? (prev + 1) % total : (prev - 1 + total) % total);
    }, [imovel.fotos.length]);

    const handlePoiClick = useCallback((poi: PoiResult | null) => {
        if (activePoi && poi && activePoi.name === poi.name) setActivePoi(null);
        else setActivePoi(poi);
    }, [activePoi]);

    const handleStreetViewOpen = useCallback((url: string) => {
        setStreetViewUrl(url);
        setIsStreetViewModalOpen(true);
    }, []);

    const handleSaveNote = async () => {
        setIsNoteSaving(true);
        await new Promise(r => setTimeout(r, 600));
        localStorage.setItem(`note_${imovel.id}`, note);
        setIsNoteSaving(false);
        alert("Nota salva localmente!");
    };

    const toggleFavorite = () => {
        const newState = !isFavorite;
        setIsFavorite(newState);
        if(newState) localStorage.setItem(`fav_${imovel.id}`, "true");
        else localStorage.removeItem(`fav_${imovel.id}`);
    };

    // --- IA ---
    const callGemini = async (prompt: string) => {
        if (!GEMINI_API_KEY) return "Configuração de IA pendente.";
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível gerar.";
        } catch (e) {
            console.error("Gemini Error", e);
            return "Erro de conexão com IA.";
        }
    };

    const generateAIHighlights = async () => {
        if (aiHighlights) return;
        setLoadingAiHighlights(true);
        const prompt = `Atue como um corretor. Analise: ${imovel.titulo}, ${imovel.quartos} quartos, ${imovel.endereco.bairro}. Descrição: "${imovel.descricaoLonga}". Liste 3 destaques e 1 frase sobre perfil ideal.`;
        const text = await callGemini(prompt);
        setAiHighlights(text);
        setLoadingAiHighlights(false);
    };

    const generateNeighborhoodGuide = async () => {
        setShowNeighborhoodModal(true);
        if (aiNeighborhood) return;
        setLoadingNeighborhood(true);
        const prompt = `Guia local. Fale sobre ${imovel.endereco.bairro} em ${imovel.endereco.cidade}. Vibe e segurança. Max 80 palavras.`;
        const text = await callGemini(prompt);
        setAiNeighborhood(text);
        setLoadingNeighborhood(false);
    };

    // --- CÁLCULOS E DADOS ---
    const totalDormitorios = imovel.quartos + imovel.suites;
    const totalBanheiros = imovel.banheiros + imovel.suites + imovel.lavabos + imovel.banheirosServico;
    const valorTotalMensal = imovel.valorAluguel + (imovel.custoCondominioIncluso ? imovel.valorCondominio : 0) + (imovel.custoIPTUIncluso ? imovel.valorIPTU : 0);
    const isTotalPackage = imovel.custoCondominioIncluso || imovel.custoIPTUIncluso;
    
    const proprietarioNome = "Butters John Bee"; // Mock (Falta trazer do backend)
    const proprietarioHandle = imovel.proprietarioId || "agente";
    const finalidadeBadge = getFinalidadeBadge(imovel.finalidades);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
            
            <ImageLightbox 
                images={imovel.fotos} 
                currentIndex={currentImageIndex} 
                isOpen={isLightboxOpen} 
                onClose={() => setIsLightboxOpen(false)} 
                onNavigate={navigateLightbox} 
            />
            
            <StreetViewModal 
                isOpen={isStreetViewModalOpen} 
                onClose={() => setIsStreetViewModalOpen(false)} 
                url={streetViewUrl} 
            />

            {/* HEADER MOBILE */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 md:hidden">
                <div className="px-4 h-14 flex items-center">
                    <Link href="/anuncios" className="text-gray-600 flex items-center gap-2 text-sm font-medium">
                        <ChevronRight className="w-4 h-4 rotate-180"/> Voltar
                    </Link>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                
                {/* 1. BREADCRUMB */}
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/anuncios" className="hover:text-indigo-600 transition">Imóveis</Link> 
                    <ChevronRight className="w-4 h-4"/> 
                    <span>{imovel.endereco.cidade}</span>
                    <ChevronRight className="w-4 h-4"/>
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{imovel.titulo}</span>
                </div>

                {/* 2. GALERIA GRID */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-8 h-[350px] md:h-[500px] rounded-2xl overflow-hidden shadow-sm">
                    {imovel.fotos && imovel.fotos.length > 0 ? (
                        <>
                            <div className="col-span-1 md:col-span-2 row-span-2 relative group cursor-pointer" onClick={() => openLightbox(0)}>
                                <img src={imovel.fotos[0]} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="Principal" />
                                <div className="absolute top-4 left-4 z-20">
                                    <span className={`${finalidadeBadge.color} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm`}>
                                        {finalidadeBadge.label}
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md flex items-center gap-2">
                                    <Camera className="w-3 h-3" /> 1/{imovel.fotos.length}
                                </div>
                            </div>
                            {imovel.fotos.slice(1, 4).map((url, idx) => (
                                <div key={idx} className="hidden md:block col-span-1 row-span-1 relative group cursor-pointer overflow-hidden" onClick={() => openLightbox(idx + 1)}>
                                    <img src={url} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt={`Foto ${idx + 2}`} />
                                </div>
                            ))}
                            {imovel.fotos.length > 4 && (
                                <div className="hidden md:flex col-span-1 row-span-1 bg-gray-100 items-center justify-center cursor-pointer hover:bg-gray-200 transition text-gray-500 font-medium text-sm" onClick={() => openLightbox(4)}>
                                    Ver todas as {imovel.fotos.length} fotos
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="col-span-full h-full bg-gray-200 flex items-center justify-center text-gray-400">Sem fotos disponíveis</div>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- COLUNA ESQUERDA --- */}
                    <article className="lg:col-span-2 space-y-8">
                        
                        {/* CABEÇALHO */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md uppercase">{imovel.categoriaPrincipal}</span>
                                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md uppercase">{imovel.status}</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">{imovel.titulo}</h1>
                                    <div className="flex flex-wrap items-center gap-3 text-gray-500 mb-4">
                                        <div className="flex items-center text-sm">
                                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                            {imovel.endereco.bairro}, {imovel.endereco.cidade}
                                        </div>
                                        <button onClick={generateNeighborhoodGuide} className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full hover:bg-purple-100 transition border border-purple-100">
                                            <Sparkles className="w-3 h-3" /> Guia do Bairro IA
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={toggleFavorite} className={`p-2 rounded-full border transition ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500'}`}>
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </button>
                                    <button className="p-2 rounded-full border bg-white border-gray-200 text-gray-400 hover:text-indigo-900">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-gray-100 py-6 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg"><Square className="w-5 h-5 text-indigo-600" /></div>
                                    <div><span className="font-bold text-gray-900 block">{imovel.areaUtil}</span><span className="text-gray-500 text-xs uppercase">m² Útil</span></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg"><Bed className="w-5 h-5 text-indigo-600" /></div>
                                    <div><span className="font-bold text-gray-900 block">{totalDormitorios}</span><span className="text-gray-500 text-xs uppercase">Quartos</span></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg"><Bath className="w-5 h-5 text-indigo-600" /></div>
                                    <div><span className="font-bold text-gray-900 block">{totalBanheiros}</span><span className="text-gray-500 text-xs uppercase">Banheiros</span></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg"><Car className="w-5 h-5 text-indigo-600" /></div>
                                    <div><span className="font-bold text-gray-900 block">{imovel.vagasGaragem}</span><span className="text-gray-500 text-xs uppercase">Vagas</span></div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold mb-3 text-gray-900">Sobre o Imóvel</h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{imovel.descricaoLonga || "Descrição não informada."}</p>

                                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 mt-8 relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-indigo-600" /> Destaques Inteligentes (IA)
                                        </h3>
                                        {!aiHighlights && !loadingAiHighlights && (
                                            <button onClick={generateAIHighlights} className="bg-white text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm border border-indigo-100 hover:shadow-md transition">
                                                Gerar Análise
                                            </button>
                                        )}
                                    </div>
                                    
                                    {loadingAiHighlights && <div className="flex items-center gap-2 text-indigo-600 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin"/> Analisando dados...</div>}
                                    {aiHighlights && <div className="prose prose-sm text-gray-700 animate-in fade-in leading-relaxed whitespace-pre-line">{aiHighlights}</div>}
                                </div>
                            </div>
                        </section>

                        {/* --- NOVA SEÇÃO: INFORMAÇÕES DE LOCAÇÃO (TABELA DETALHADA) --- */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600"/> Informações de Locação
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Coluna 1: Geral */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 text-sm uppercase tracking-wide">Detalhes Gerais</h4>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="block text-gray-500 text-xs">Categoria Principal</span>
                                            <span className="font-medium text-gray-900">{imovel.categoriaPrincipal}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 text-xs">Tipo Detalhado</span>
                                            <span className="font-medium text-gray-900">{imovel.tipoDetalhado}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 text-xs">Disponível a partir de</span>
                                            <span className="font-medium text-gray-900 flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-gray-400"/>
                                                {new Date(imovel.dataDisponibilidade).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna 2: Estrutura */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 text-sm uppercase tracking-wide">Estrutura Interna</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Suítes</span>
                                            <span className="font-medium text-gray-900">{imovel.suites}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Lavabos</span>
                                            <span className="font-medium text-gray-900">{imovel.lavabos}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Andar</span>
                                            <span className="font-medium text-gray-900">{imovel.andar || 'Térreo'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Animais</span>
                                            <span className={`font-medium px-2 py-0.5 rounded text-xs ${imovel.aceitaAnimais ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {imovel.aceitaAnimais ? 'Permitido' : 'Não Permitido'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna 3: Encargos */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 text-sm uppercase tracking-wide">Encargos</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Condomínio</span>
                                            <span className="font-medium text-gray-900">{imovel.custoCondominioIncluso ? 'Incluso' : formatCurrency(imovel.valorCondominio)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">IPTU (Mensal)</span>
                                            <span className="font-medium text-gray-900">{imovel.custoIPTUIncluso ? 'Incluso' : formatCurrency(imovel.valorIPTU)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 text-xs mb-1">Finalidades</span>
                                            <div className="flex flex-wrap gap-1">
                                                {imovel.finalidades.map(f => (
                                                    <span key={f} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* --- NOVA SEÇÃO: CONDOMÍNIO RICO --- */}
                        {imovel.condominio?.possuiCondominio && (
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Header do Condomínio com Imagem de Fundo (Placeholder ou Real) */}
                                <div className="h-40 bg-gradient-to-r from-gray-800 to-gray-900 relative flex items-end p-6">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                                    <div className="relative z-10 w-full flex justify-between items-end">
                                        <div>
                                            <div className="text-white/80 text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <Building className="w-3 h-3"/> Condomínio Fechado
                                            </div>
                                            <h3 className="text-2xl font-bold text-white leading-none">
                                                {imovel.condominio.nomeCondominio || "Residencial"}
                                            </h3>
                                        </div>
                                        <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm transition">
                                            Ver detalhes
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-3 text-sm">Infraestrutura e Lazer</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {imovel.condominio.portaria24h && (
                                                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 border border-green-100">
                                                        <ShieldCheck className="w-3 h-3"/> Portaria 24h
                                                    </span>
                                                )}
                                                {imovel.condominio.areaLazer && (
                                                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 border border-blue-100">
                                                        <Icon icon={faStreetView} className="w-3 h-3"/> Lazer Completo
                                                    </span>
                                                )}
                                                {imovel.infraestruturaCondominio?.length > 0 ? (
                                                    imovel.infraestruturaCondominio.map((item, idx) => (
                                                        <span key={idx} className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200">{item}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Detalhes não informados.</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                            <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
                                                Outros neste condomínio
                                                <span className="text-xs font-normal text-indigo-600 cursor-pointer hover:underline">Ver todos</span>
                                            </h4>
                                            {/* Lista Simulada/Filtrada de Imóveis no mesmo condomínio */}
                                            <div className="space-y-3">
                                                {outrosImoveis
                                                    .filter(i => i.condominio?.nomeCondominio === imovel.condominio.nomeCondominio)
                                                    .slice(0, 2)
                                                    .map(vizinho => (
                                                    <Link href={`/anuncios/${vizinho.smartId}`} key={vizinho.id} className="flex items-center gap-3 group">
                                                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                            {vizinho.fotos[0] && <img src={vizinho.fotos[0]} className="w-full h-full object-cover" alt="" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">{vizinho.titulo}</p>
                                                            <p className="text-xs text-gray-500">{formatCurrency(vizinho.valorAluguel)} • {vizinho.quartos} qtos</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600"/>
                                                    </Link>
                                                ))}
                                                {outrosImoveis.filter(i => i.condominio?.nomeCondominio === imovel.condominio.nomeCondominio).length === 0 && (
                                                    <p className="text-xs text-gray-400 italic">Nenhum outro imóvel disponível neste condomínio no momento.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Detalhes Técnicos (Acabamento e Posição) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Hammer className="w-5 h-5 text-indigo-600"/>
                                    Acabamentos
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Ano</span>
                                        <span className="font-medium">{imovel.anoConstrucao || "-"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Piso Sala</span>
                                        <span className="font-medium">{formatEnum(imovel.acabamentos?.pisoSala)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Piso Quartos</span>
                                        <span className="font-medium">{formatEnum(imovel.acabamentos?.pisoQuartos)}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sun className="w-5 h-5 text-yellow-500"/>
                                    Posição e Luz
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Sol</span>
                                        <span className="font-medium">{formatEnum(imovel.dadosExternos?.posicaoSolar)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Posição</span>
                                        <span className="font-medium">{formatEnum(imovel.dadosExternos?.posicaoImovel)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Vista</span>
                                        <span className="font-medium">{formatEnum(imovel.dadosExternos?.vista)}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Comodidades Gerais */}
                        {imovel.caracteristicas.length > 0 && (
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <LayoutDashboard className="w-5 h-5 text-indigo-600"/> Comodidades do Imóvel
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {imovel.caracteristicas.map(c => (
                                        <span key={c} className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                                            <Check className="w-3 h-3 text-green-600"/> {c}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* MAPA */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <h2 className="text-lg font-bold mb-4 text-gray-900">Localização</h2>
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                <DynamicMapDisplay 
                                    latitude={imovel.latitude as number}
                                    longitude={imovel.longitude as number}
                                    titulo={imovel.titulo}
                                    bairro={imovel.endereco.bairro}
                                    pois={pois} 
                                    activePoi={activePoi} 
                                    valorAluguel={valorTotalMensal}
                                    quartos={totalDormitorios}
                                    banheiros={totalBanheiros}
                                    vagasGaragem={imovel.vagasGaragem}
                                    bairroGeoJson={bairroGeoJson}
                                    fullAddressString={`${imovel.endereco.logradouro}, ${imovel.endereco.numero} - ${imovel.endereco.bairro}`}
                                    onStreetViewClick={handleStreetViewOpen}
                                />
                            </div>
                            <div className="mt-6">
                                <PoiList
                                    latitude={imovel.latitude as number}
                                    longitude={imovel.longitude as number}
                                    onClickPoi={handlePoiClick} 
                                    onPoisFetched={(newPois) => { setPois(newPois); setActivePoi(null); }} 
                                />
                            </div>
                        </section>

                        {/* GRID DE UTILITÁRIOS (Internet e Notas) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Verificador de Banda Larga (Mock) */}
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wifi className="w-5 h-5 text-gray-700" />
                                    <h3 className="font-bold text-gray-900">Internet na Região</h3>
                                </div>
                                {loadingBroadband ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        <div className="h-8 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                ) : broadbandData ? (
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Média Estimada</div>
                                        <div className="text-3xl font-bold text-indigo-900 mb-2">{broadbandData.avgSpeed}</div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {broadbandData.bestFor.map((t: string) => (
                                                <span key={t} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-medium">{t}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500">Provedores: {broadbandData.providers.join(', ')}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Verificação indisponível.</p>
                                )}
                            </section>

                            {/* Bloco de Notas Privadas */}
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400"/> Minhas Notas
                                    </h3>
                                </div>
                                <textarea
                                    className="w-full border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 transition"
                                    placeholder="Escreva anotações privadas..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                                <div className="mt-2 flex justify-end">
                                    <button 
                                        onClick={handleSaveNote}
                                        disabled={isNoteSaving}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                    >
                                        {isNoteSaving ? 'Salvando...' : 'Salvar Nota'}
                                    </button>
                                </div>
                            </section>
                        </div>

                    </article>

                    {/* --- COLUNA DIREITA (SIDEBAR) --- */}
                    <aside className="lg:col-span-1 space-y-6">
                        
                        {/* CARD DE VALOR E CONTATO */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
                            <div className="mb-6">
                                <span className="text-gray-500 text-sm font-medium block">
                                    {isTotalPackage ? 'Valor Mensal (Pacote)' : 'Valor do Aluguel Base'}
                                </span>
                                <div className="text-3xl font-extrabold text-indigo-900 mt-1">{formatCurrency(valorTotalMensal)}</div>
                                
                                {/* NOTA SOBRE TAXAS */}
                                <div className={`text-xs mt-2 px-2 py-1 rounded font-medium ${isTotalPackage ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {isTotalPackage 
                                        ? '✅ Taxas de Condomínio e IPTU inclusas no valor acima.' 
                                        : '⚠️ Condomínio e IPTU cobrados à parte (veja abaixo).'}
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex justify-between">
                                        <span>Condomínio</span>
                                        <span className="font-medium">{imovel.custoCondominioIncluso ? 'Incluso' : formatCurrency(imovel.valorCondominio)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>IPTU</span>
                                        <span className="font-medium">{imovel.custoIPTUIncluso ? 'Incluso' : formatCurrency(imovel.valorIPTU)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-200 mt-2">
                                        <span>Cód.</span><span>{imovel.smartId}</span>
                                    </div>
                                </div>
                            </div>

                            {/* INFO DO ANUNCIANTE */}
                            <div className="flex items-center gap-3 mb-6 border-t border-gray-100 pt-6">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">
                                    {proprietarioNome.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{proprietarioNome}</div>
                                    <div className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">Anunciante Verificado</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-green-100 shadow-lg">
                                    <MessageCircle className="w-5 h-5" /> Enviar Mensagem
                                </button>
                                <button className="w-full border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
                                    <Phone className="w-5 h-5" /> Ver Telefone
                                </button>
                            </div>
                        </div>

                        {/* LISTA: OUTROS IMÓVEIS DO ANUNCIANTE */}
                        {outrosImoveis && outrosImoveis.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Mais deste anunciante</h3>
                                <div className="space-y-4">
                                    {outrosImoveis.slice(0, 3).map(item => (
                                        <Link href={`/anuncios/${item.smartId}`} key={item.id} className="flex gap-3 group hover:bg-gray-50 p-2 rounded-lg -mx-2 transition">
                                            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.fotos[0] ? (
                                                    <img src={item.fotos[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={item.titulo} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Info className="w-6 h-6"/></div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 line-clamp-2 leading-snug">{item.titulo}</h4>
                                                <p className="text-indigo-900 font-bold text-xs mt-1">
                                                    {formatCurrency(item.valorAluguel + (item.custoCondominioIncluso ? item.valorCondominio : 0))}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">{item.endereco.bairro}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Link href={`/proprietario/${proprietarioHandle}`} className="block w-full mt-6 text-center text-indigo-600 text-sm font-bold hover:bg-indigo-50 py-2 rounded-lg transition">
                                    Ver todos os imóveis
                                </Link>
                            </div>
                        )}
                    </aside>
                </div>

                {/* FOOTER DO ANÚNCIO */}
                <footer className="mt-16 border-t border-gray-200 pt-8 pb-4 text-center">
                    <p className="text-xs text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        Referência: {imovel.smartId}. A Rentou não se responsabiliza por erros na descrição. As informações são fornecidas pelo anunciante.
                    </p>
                </footer>

            </main>

            {/* MODAL: GUIA DO BAIRRO (IA) */}
            {showNeighborhoodModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <MapIcon className="w-5 h-5 text-purple-300" /> Guia do Bairro IA
                                </h3>
                                <p className="text-indigo-200 text-sm mt-1">Descubra {imovel.endereco.bairro}</p>
                            </div>
                            <button onClick={() => setShowNeighborhoodModal(false)} className="text-white/70 hover:text-white bg-white/10 p-1 rounded-full"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 min-h-[200px]">
                            {loadingNeighborhood ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                    <p>Consultando mapas e dados...</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                    {aiNeighborhood}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
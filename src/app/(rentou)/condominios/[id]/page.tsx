'use client';

// ADICIONADO PARA SUPORTE AO CLOUDFLARE PAGES (EDGE RUNTIME)
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { buscarCondominioPorId, excluirCondominio } from '@/services/CondominioService';
import { listarImoveis } from '@/services/ImovelService'; 
import { Condominio } from '@/types/condominio';
import { Imovel } from '@/types/imovel';
import { Icon } from '@/components/ui/Icon';
import { 
    faMapMarkerAlt, faBuilding, faCheckCircle, faTrash, faEdit, faArrowLeft, 
    faHardHat, faChartLine, faSwimmingPool, faShieldAlt, faBed, faRulerCombined, 
    faCar, faChevronDown, faChevronUp, faHome, faKey, faDollarSign, faImage, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';

// --- HELPER: Tratamento de URLs de Imagem ---
const sanitizeUrl = (url: string | undefined, fallback: string = '/media/rentou-logo.png') => {
    if (!url) return fallback;
    if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
    return `https://${url}`;
};

// --- COMPONENTE: Galeria de Fotos do Condomínio (NOVO) ---
const CondoGallery = ({ photos, title }: { photos: string[], title: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Se não houver fotos, mostra fallback
    if (!photos || photos.length === 0) {
        return (
            <div className="aspect-video bg-gray-200 dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                <Icon icon={faImage} className="text-gray-400 text-6xl" />
                <p className="text-gray-500 ml-4">Sem fotos disponíveis</p>
            </div>
        );
    }

    const nextPhoto = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
    const prevPhoto = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

    return (
        <div className="space-y-4">
            {/* Imagem Principal Grande */}
            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-lg group">
                <img 
                    src={sanitizeUrl(photos[currentIndex])} 
                    alt={`${title} - Foto ${currentIndex + 1}`} 
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={(e) => { e.currentTarget.src = '/media/rentou-logo.png'; }}
                />
                
                {/* Botões de Navegação (aparecem no hover) */}
                {photos.length > 1 && (
                    <>
                        <button 
                            onClick={(e) => { e.preventDefault(); prevPhoto(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Icon icon={faChevronLeft} className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={(e) => { e.preventDefault(); nextPhoto(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Icon icon={faChevronRight} className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Contador */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-bold backdrop-blur-sm">
                    {currentIndex + 1} / {photos.length}
                </div>
            </div>

            {/* Miniaturas (Thumbnails) */}
            {photos.length > 1 && (
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600">
                    {photos.map((photo, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentIndex 
                                ? 'border-rentou-primary ring-2 ring-rentou-primary/30' 
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                        >
                            <img 
                                src={sanitizeUrl(photo)} 
                                alt={`Thumbnail ${index + 1}`} 
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Componente de Barra de Progresso da Obra
const ProgressBar = ({ label, percentage }: { label: string, percentage: number }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
            <span>{label}</span>
            <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
        </div>
    </div>
);

// Componente Card de Imóvel (Redesenhado e Moderno)
const CondoImovelCard = ({ imovel }: { imovel: Imovel }) => {
    const getPreco = () => {
        if (imovel.finalidades && imovel.finalidades.includes('Venda')) {
            return imovel.valorVenda || 0; 
        }
        return imovel.valorAluguel;
    };

    const preco = getPreco();
    const valorFormatado = preco ? preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sob Consulta';
    
    const rawFotoUrl = imovel.fotos && imovel.fotos.length > 0 ? imovel.fotos[0] : undefined;
    const fotoUrl = sanitizeUrl(rawFotoUrl, 'https://via.placeholder.com/400x300?text=Sem+Foto');

    return (
        <Link href={`/imoveis/${imovel.id}`} className="group flex flex-col bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-zinc-700 h-full">
            <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-zinc-900">
                <img 
                    src={fotoUrl} 
                    alt={imovel.titulo} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.currentTarget.src = '/media/rentou-logo.png'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-gray-800 dark:text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                    {imovel.smartId || 'S/ Cód'}
                </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-rentou-primary transition-colors">
                    {imovel.titulo}
                </h4>
                
                <p className="text-lg font-extrabold text-gray-900 dark:text-white mb-3">
                    {valorFormatado}
                </p>
                
                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-zinc-700 flex items-center gap-4 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Icon icon={faRulerCombined} className="w-3.5 h-3.5"/>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{imovel.areaUtil}m²</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Icon icon={faBed} className="w-3.5 h-3.5"/>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{imovel.quartos}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Icon icon={faCar} className="w-3.5 h-3.5"/>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{imovel.vagasGaragem}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// Seção Expansível de Imóveis (Layout Expandido)
const ImoveisSection = ({ title, icon, imoveis, colorClass }: { title: string, icon: any, imoveis: Imovel[], colorClass: string }) => {
    const [expanded, setExpanded] = useState(false);
    
    if (!imoveis || imoveis.length === 0) return null;

    const INITIAL_LIMIT = 5;
    const displayImoveis = expanded ? imoveis : imoveis.slice(0, INITIAL_LIMIT);
    const hasMore = imoveis.length > INITIAL_LIMIT;

    return (
        <div className="mt-8">
            <div className="flex items-center mb-6">
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 mr-4`}>
                    <Icon icon={icon} className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {imoveis.length} {imoveis.length === 1 ? 'unidade disponível' : 'unidades disponíveis'} nesta categoria
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {displayImoveis.map(imovel => (
                    <CondoImovelCard key={imovel.id} imovel={imovel} />
                ))}
            </div>

            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => setExpanded(!expanded)}
                        className="group flex items-center px-8 py-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-bold transition-all border border-gray-200 dark:border-zinc-600 shadow-sm hover:shadow-md"
                    >
                        {expanded ? (
                            <>Ver menos unidades <Icon icon={faChevronUp} className="ml-2" /></>
                        ) : (
                            <>Ver todas as {imoveis.length} unidades <Icon icon={faChevronDown} className="ml-2 group-hover:translate-y-0.5 transition-transform" /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default function CondominioDetalhePage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [condo, setCondo] = useState<Condominio | null>(null);
    const [imoveisVenda, setImoveisVenda] = useState<Imovel[]>([]);
    const [imoveisAluguel, setImoveisAluguel] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            
            try {
                const condomioData = await buscarCondominioPorId(id);
                setCondo(condomioData);

                const todosImoveis = await listarImoveis();
                
                const imoveisDesteCondominio = todosImoveis.filter(i => 
                    i.id && (
                        i.condominio?.condominioCadastradoId === id || 
                        (condomioData && i.endereco.logradouro === condomioData.endereco.logradouro && i.endereco.numero === condomioData.endereco.numero)
                    )
                );

                setImoveisVenda(imoveisDesteCondominio.filter(i => i.finalidades && i.finalidades.includes('Venda')));
                setImoveisAluguel(imoveisDesteCondominio.filter(i => 
                    i.finalidades && (i.finalidades.includes('Locação Residencial') || i.finalidades.includes('Locação Comercial') || i.finalidades.includes('Locação Temporada'))
                ));

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleDelete = async () => {
        if (confirm('Tem certeza que deseja excluir este condomínio? Isso não excluirá os imóveis vinculados, mas removerá o vínculo.')) {
            try {
                await excluirCondominio(id!);
                router.push('/condominios');
            } catch (error) {
                alert('Erro ao excluir condomínio');
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <Icon icon={faBuilding} className="text-rentou-primary text-4xl mr-3 animate-bounce" />
            <span className="text-gray-500 font-medium">Carregando empreendimento...</span>
        </div>
    );
    
    if (!condo) return <div className="p-8 text-center text-red-500">Condomínio não encontrado.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header com Ações */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/condominios" className="text-sm text-rentou-primary hover:underline mb-2 flex items-center">
                        <Icon icon={faArrowLeft} className="mr-2 w-3 h-3"/> Voltar para lista
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
                        {condo.nome}
                        {condo.lancamento && (
                            <span className="ml-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-200">Lançamento</span>
                        )}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1 text-sm">
                        <Icon icon={faMapMarkerAlt} className="mr-2 text-red-500 w-3 h-3"/>
                        {condo.endereco.logradouro}, {condo.endereco.numero} - {condo.endereco.bairro}, {condo.endereco.cidade}
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link href={`/condominios/${id}/editar`} className="flex-1 md:flex-none justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center text-sm">
                        <Icon icon={faEdit} className="mr-2"/> Editar
                    </Link>
                    <button onClick={handleDelete} className="flex-1 md:flex-none justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition flex items-center text-sm border border-red-200">
                        <Icon icon={faTrash} className="mr-2"/> Excluir
                    </button>
                </div>
            </div>

            {/* Grid Principal (Info do Condomínio) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coluna da Esquerda (2/3) - GALERIA e Conteúdo */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* GALERIA DE FOTOS (SUBSTITUI A IMAGEM ÚNICA) */}
                    <CondoGallery photos={condo.fotos} title={condo.nome} />

                    {/* Descrição */}
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Icon icon={faBuilding} className="mr-3 text-rentou-primary"/>
                            Sobre o Empreendimento
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                            {condo.descricao || 'Nenhuma descrição informada.'}
                        </p>
                    </div>

                    {/* Infraestrutura */}
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <Icon icon={faSwimmingPool} className="mr-3 text-blue-500" /> Lazer e Diferenciais
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(condo.infraestrutura).map(([key, value]) => {
                                if (value) {
                                    return (
                                        <span key={key} className="px-4 py-2 bg-gray-50 dark:bg-zinc-700/50 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium flex items-center border border-gray-200 dark:border-zinc-600">
                                            <Icon icon={faCheckCircle} className="w-4 h-4 mr-2 text-green-500"/>
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </span>
                                    )
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita (1/3) - Status e Ficha Técnica */}
                <div className="space-y-6">
                    
                    {/* Status da Obra */}
                    {condo.lancamento && condo.progressoObra && (
                        <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg border-t-4 border-green-500">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Icon icon={faChartLine} className="mr-2 text-green-500" /> Status da Obra
                            </h3>
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                <span className="text-xs uppercase text-green-700 dark:text-green-400 font-bold block">Fase Atual</span>
                                <span className="text-lg font-black text-green-800 dark:text-green-300">{condo.faseObra?.replace('_', ' ')}</span>
                            </div>
                            <div className="space-y-3">
                                <ProgressBar label="Geral" percentage={condo.progressoObra.geral} />
                                <ProgressBar label="Fundação" percentage={condo.progressoObra.fundacao} />
                                <ProgressBar label="Estrutura" percentage={condo.progressoObra.estrutura} />
                                <ProgressBar label="Alvenaria" percentage={condo.progressoObra.alvenaria} />
                                <ProgressBar label="Acabamento" percentage={condo.progressoObra.acabamento} />
                            </div>
                        </div>
                    )}

                    {/* Ficha Técnica Compacta */}
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                             <Icon icon={faBuilding} className="mr-2 text-gray-500" /> Ficha Técnica
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-700 pb-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Torres</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{condo.numeroTorres}</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-700 pb-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Andares</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{condo.numeroAndares}</span>
                            </li>
                             <li className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-700 pb-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Aptos/Andar</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{condo.unidadesPorAndar}</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-700 pb-2">
                                <span className="text-xs text-gray-500 uppercase font-bold">Total Unidades</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{condo.totalUnidades}</span>
                            </li>
                            <li className="flex justify-between items-center pt-1">
                                <span className="text-xs text-gray-500 uppercase font-bold">Portaria</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{condo.tipoPortaria.replace('_', ' ')}</span>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Gestão */}
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Icon icon={faShieldAlt} className="mr-2 text-gray-400" /> Gestão
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex justify-between">
                                <span>Administradora:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{condo.administradora || 'N/A'}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Condomínio (Médio):</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {condo.valorCondominioMedio ? `R$ ${condo.valorCondominioMedio}` : 'N/A'}
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span>Zelador:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{condo.zelador || 'N/A'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* SEÇÃO DE IMÓVEIS FULL WIDTH (MOVIDA PARA O FINAL DO GRID PRINCIPAL) */}
            <div id="unidades-disponiveis" className="pt-12 border-t border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Unidades Disponíveis
                    </h2>
                    <Link href="/imoveis/novo" className="px-5 py-2.5 bg-rentou-primary text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center text-sm">
                        <Icon icon={faBuilding} className="mr-2"/> Adicionar Unidade
                    </Link>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Visualize todas as opções de planta e unidades cadastradas neste empreendimento.
                </p>

                {imoveisVenda.length === 0 && imoveisAluguel.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-12 text-center">
                        <Icon icon={faHome} className="text-5xl text-gray-300 mb-4" />
                        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Nenhuma unidade cadastrada neste condomínio ainda.</p>
                        <Link href="/imoveis/novo" className="mt-4 inline-block text-rentou-primary font-bold hover:underline">
                            Cadastrar primeira unidade agora
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* 1. Locação (Prioridade Solicitada) */}
                        <ImoveisSection 
                            title="Disponíveis para Locação" 
                            icon={faKey} 
                            imoveis={imoveisAluguel} 
                            colorClass="bg-blue-500 text-blue-700 dark:text-blue-400" 
                        />
                        
                        {/* 2. Venda */}
                        <ImoveisSection 
                            title="Disponíveis para Venda" 
                            icon={faDollarSign} 
                            imoveis={imoveisVenda} 
                            colorClass="bg-green-500 text-green-700 dark:text-green-400" 
                        />
                    </>
                )}
            </div>
        </div>
    );
}
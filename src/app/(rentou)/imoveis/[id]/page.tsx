// src/app/(rentou)/imoveis/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchImovelPorSmartId, removerImovel } from '@/services/ImovelService'; 
import { Imovel } from '@/types/imovel'; 
import { Icon } from '@/components/ui/Icon';
// ÍCONES MODERNOS PARA ESTRUTURA E FINANÇAS
import { 
    faBed, faShower, faCar, faRulerCombined, faBuilding, faMapMarkerAlt, 
    faMoneyBillWave, faTrashAlt, faEdit, faCheckCircle, faBan, faDoorOpen,
    faClock, faShieldAlt, faTag, faEuroSign, faClipboardList,
    faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';

// Componente utilitário para formatação de moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// Componente para o badge de status (otimizado para impressão)
const StatusBadge: React.FC<{ status: Imovel['status'] }> = ({ status }) => {
  let classes = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ';
  let text = '';

  switch (status) {
    case 'ALUGADO':
      classes += 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 print:bg-transparent print:text-green-800 print:border print:border-green-800';
      text = 'Alugado';
      break;
    case 'VAGO':
      classes += 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 print:bg-transparent print:text-gray-800 print:border print:border-gray-800';
      text = 'Vago';
      break;
    case 'ANUNCIADO':
      classes += 'bg-blue-100 text-rentou-primary dark:bg-blue-900 dark:text-blue-300 print:bg-transparent print:text-rentou-primary print:border print:border-rentou-primary';
      text = 'Anunciado';
      break;
    case 'MANUTENCAO':
      classes += 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 print:bg-transparent print:text-yellow-800 print:border print:border-yellow-800';
      text = 'Manutenção';
      break;
    default:
      classes += 'bg-gray-500 text-white';
      text = status;
      break;
  }

  return <span className={classes}>{text}</span>;
};


// Item de Detalhe para relatório (Definition List style)
interface ReportDetailItemProps {
    icon: any;
    label: string;
    value: string | number | React.ReactNode;
    colorClass?: string;
    border?: boolean;
}

const ReportDetailItem: React.FC<ReportDetailItemProps> = ({ icon, label, value, colorClass = 'text-gray-900 dark:text-gray-100', border = true }) => (
    <div className={`flex items-center space-x-3 ${border ? 'border-b border-gray-100 dark:border-zinc-700 pb-2 mb-2' : ''}`}>
        <Icon icon={icon} className={`w-5 h-5 flex-shrink-0 text-rentou-primary dark:text-blue-400 print:text-gray-800`} />
        <div className='flex flex-col flex-grow'>
            <dt className="text-xs font-medium text-gray-500 uppercase print:text-gray-600">{label}</dt>
            <dd className={`mt-0.5 text-sm font-semibold ${colorClass} print:text-gray-900`}>{value}</dd>
        </div>
    </div>
);


// Cartão de Especificação Horizontal (Quick Facts)
interface SpecCardProps {
    icon: any;
    label: string;
    value: string | number;
    unit?: string;
    color: string; // Tailwind color class (e.g., 'text-red-500')
}

const SpecCard: React.FC<SpecCardProps> = ({ icon, label, value, unit, color }) => (
    <div className="flex items-center p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg shadow-inner print:border print:border-gray-300 print:bg-white print:shadow-none">
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-3 ${color.replace('text-', 'bg-')}/20`}>
            <Icon icon={icon} className={`w-4 h-4 ${color} print:text-gray-800`} />
        </div>
        <div>
            <p className="text-xs font-medium text-gray-500 uppercase print:text-gray-600">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 print:text-gray-900">
                {value}
                {unit && <span className="text-sm font-semibold ml-0.5 text-gray-500 print:text-gray-600">{unit}</span>}
            </p>
        </div>
    </div>
);


// Card de Destaque Financeiro (Horizontal e Limpo)
interface FinancialCardProps {
    label: string;
    value: string;
    icon: any;
    colorClass: string; 
}

const FinancialCard: React.FC<FinancialCardProps> = ({ label, value, icon, colorClass }) => (
    <div className="flex flex-col p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-md print:border-gray-400 print:shadow-none">
        <div className="flex items-center space-x-2 mb-1">
             <Icon icon={icon} className={`w-4 h-4 ${colorClass} print:text-gray-800`} />
             <p className="text-xs font-medium text-gray-500 uppercase print:text-gray-600">{label}</p>
        </div>
        <p className={`text-xl font-extrabold ${colorClass} print:text-gray-900`}>
            {value}
        </p>
    </div>
);

// MOCK DE IMAGENS PARA DEMONSTRAÇÃO DO CARROSSEL
const mockPhotos = [
    '/media/Rentou logomarcca.png', 
    'https://via.placeholder.com/1200x800?text=Quarto+Principal',
    'https://via.placeholder.com/1200x800?text=Cozinha+Moderna',
    'https://via.placeholder.com/1200x800?text=Sala+de+Estar',
];


/**
 * @fileoverview Página de Visualização/Detalhes de um Imóvel (Hub de Gerenciamento).
 * DESIGN REVAMPED: Layout de Relatório Profissional e Premium.
 */
export default function ImovelDetalhePage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id; 
    
    const [imovel, setImovel] = useState<Imovel | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // NOVO: Estado para a Galeria/Carrossel
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); 

    // Efeito para carregar os dados do imóvel
    useEffect(() => {
        if (!id) {
            setError('ID do imóvel não encontrado.');
            setLoading(false);
            return;
        }

        const loadImovel = async () => {
            setLoading(true);
            try {
                const data = await fetchImovelPorSmartId(id as string);
                
                // MOCK HACK: Se o imovel.fotos estiver vazio, adiciona as mockPhotos para o carrossel funcionar
                if (data && data.fotos.length === 0) {
                    data.fotos = mockPhotos;
                }
                
                setImovel(data || null); 
            } catch (err: any) {
                console.error('Erro ao buscar imóvel:', err);
                setError(err.message || 'Falha ao carregar os dados do imóvel.');
            } finally {
                setLoading(false);
            }
        };

        loadImovel();
    }, [id]);
    
    // Lógica do Carrossel
    const photos = imovel?.fotos || [];
    const totalPhotos = photos.length;
    
    const nextPhoto = () => {
        setCurrentPhotoIndex(prev => (prev === totalPhotos - 1 ? 0 : prev + 1));
    };

    const prevPhoto = () => {
        setCurrentPhotoIndex(prev => (prev === 0 ? totalPhotos - 1 : prev - 1));
    };


    // Função para lidar com a exclusão 
    const handleDelete = async () => {
        if (!id || !imovel) return;
        
        if (window.confirm(`Tem certeza que deseja remover permanentemente o imóvel "${imovel.titulo}"? Esta ação não pode ser desfeita.`)) {
            setIsDeleting(true);
            try {
                await removerImovel(imovel.id as string); 
                alert('Imóvel removido com sucesso!');
                router.push('/imoveis'); 
            } catch (err) {
                console.error('Erro ao remover imóvel:', err);
                alert('Falha ao remover o imóvel. Tente novamente.');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-48"><p className="text-gray-600 dark:text-gray-300 font-medium">Carregando detalhes do imóvel...</p></div>;
    }
    
    if (error || !imovel) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Erro:</strong>
                <span className="block sm:inline"> {error || 'O imóvel solicitado não pôde ser carregado.'}</span>
                <Link href="/imoveis" className="ml-4 font-semibold hover:underline text-blue-700">Voltar para a lista</Link>
            </div>
        );
    }

    const endereco = imovel.endereco || {};
    const condominio = imovel.condominio || {};
    
    // Lista de especificações estruturais para o Hero Specs
    const structuralSpecs = [
        { icon: faBed, value: imovel.quartos, unit: 'Quartos', color: 'text-red-500' },
        { icon: faShower, value: imovel.banheiros, unit: 'Banheiros', color: 'text-blue-500' },
        { icon: faCar, value: imovel.vagasGaragem, unit: 'Vagas', color: 'text-gray-500' },
        { icon: faRulerCombined, value: imovel.areaUtil, unit: 'm²', label: 'Área Útil', color: 'text-green-600' },
    ];
    
    if (imovel.categoriaPrincipal === 'Residencial' && imovel.tipoDetalhado.includes('Apartamento')) {
        structuralSpecs.push({ icon: faBuilding, value: imovel.andar || 'Térreo', unit: 'Andar', color: 'text-yellow-600', label: 'Andar' });
    }


    // ***********************************************************************************
    // INÍCIO DO LAYOUT WEB/MOBILE (DEFAULT)
    // ***********************************************************************************
    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-0">
             {/* Link Voltar (Oculto na impressão) */}
            <Link href="/imoveis" className="text-rentou-primary hover:underline font-medium text-sm print:hidden">
                ← Voltar para Lista de Imóveis
            </Link>
            
            {/* GALERIA / HERO SECTION (Web/Mobile Focus) */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-zinc-700 print:hidden">
                
                {/* Carrossel de Imagem Principal */}
                <div className="relative h-64 sm:h-96">
                    {totalPhotos > 0 ? (
                        <>
                            {/* Imagem Atual */}
                            <img 
                                src={photos[currentPhotoIndex] || '/placeholder.png'} 
                                alt={`Foto ${currentPhotoIndex + 1} de ${imovel.titulo}`} 
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />

                            {/* Controles de Navegação */}
                            {totalPhotos > 1 && (
                                <>
                                    {/* Botão Anterior */}
                                    <button 
                                        onClick={prevPhoto}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                    >
                                        <Icon icon={faChevronLeft} className='w-5 h-5' />
                                    </button>
                                    {/* Botão Próximo */}
                                    <button 
                                        onClick={nextPhoto}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                    >
                                        <Icon icon={faChevronRight} className='w-5 h-5' />
                                    </button>
                                </>
                            )}

                            {/* Indicador de Paginação */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                                {photos.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPhotoIndex(index)}
                                        className={`w-3 h-3 rounded-full transition-colors ${
                                            index === currentPhotoIndex ? 'bg-rentou-primary shadow-lg' : 'bg-white/70 hover:bg-white'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-700/50">
                            <p className="text-center text-gray-500 dark:text-gray-400 font-bold text-xl">
                                Nenhuma imagem cadastrada.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* HEADER MÓVEL & ACTIONS */}
            <div className="flex flex-col md:flex-row justify-between md:items-end space-y-4 md:space-y-0 print:hidden">
                
                {/* INFORMAÇÕES CHAVE E PREÇO */}
                <div className='flex-grow space-y-1'>
                    <div className="flex items-center space-x-3">
                        <StatusBadge status={imovel.status} />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID: {imovel.smartId}</p>
                    </div>
                     <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                        {imovel.titulo}
                    </h1>
                     <h2 className="text-3xl font-extrabold text-rentou-primary dark:text-blue-400">
                        {formatCurrency(imovel.valorAluguel)}
                    </h2>
                </div>
                
                {/* BOTÕES DE AÇÃO WEB */}
                <div className="flex space-x-3 flex-shrink-0">
                    <Link
                        href={`/imoveis/${id}/editar`}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-rentou-primary text-white hover:bg-blue-700 flex items-center shadow-md"
                    >
                        <Icon icon={faEdit} className="w-4 h-4 mr-2" />
                        Editar
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center shadow-md ${
                            isDeleting 
                            ? 'bg-red-300 text-white cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                        <Icon icon={faTrashAlt} className="w-4 h-4 mr-2" />
                        Excluir
                    </button>
                </div>
            </div>
            
            {/* ESPECIFICAÇÕES RÁPIDAS (Horizontal Scroll em Mobile) */}
            <div className="flex overflow-x-auto space-x-3 border-b border-gray-200 pb-3 dark:border-zinc-700 print:hidden">
                {structuralSpecs.map((spec, index) => (
                    <div key={index} className="flex-shrink-0 flex items-center space-x-2 bg-gray-50 dark:bg-zinc-700 p-2 rounded-lg text-sm font-medium">
                         <Icon icon={spec.icon} className={`w-4 h-4 ${spec.color}`} />
                         <span className='text-gray-900 dark:text-gray-100'>{spec.value}</span>
                         <span className='text-gray-500'>{spec.unit}</span>
                    </div>
                ))}
            </div>

            {/* GRID DE DETALHES (2 COLUNAS em Desktop, Stack em Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* COLUNA PRINCIPAL (2/3 - Descrição e Comodidades) */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* DESCRIÇÃO */}
                    <section className='space-y-3 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-md'>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2">Descrição Detalhada</h2>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {imovel.descricaoLonga || 'Nenhuma descrição detalhada fornecida.'}
                        </p>
                    </section>
                    
                    {/* COMODIDADES */}
                    <section className='space-y-3 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-md'>
                         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2">Comodidades</h2>
                         <div className="flex flex-wrap gap-3">
                            {imovel.caracteristicas.map(c => (
                                <span key={c} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium dark:bg-zinc-700 dark:text-gray-300 flex items-center">
                                    <Icon icon={faTag} className='w-3 h-3 mr-1 inline-block' /> {c}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* VISÃO FINANCEIRA RÁPIDA */}
                    <section className='space-y-3 pt-4'>
                         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2">Visão Financeira</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FinancialCard 
                                label="Condomínio Estimado" 
                                value={formatCurrency(imovel.valorCondominio)}
                                icon={faBuilding} 
                                colorClass="text-blue-700 dark:text-blue-400" 
                            />
                            <FinancialCard 
                                label="IPTU Mensal" 
                                value={formatCurrency(imovel.valorIPTU)} 
                                icon={faMoneyBillWave} 
                                colorClass="text-red-700 dark:text-red-400" 
                            />
                         </div>
                    </section>
                </div>
                
                {/* COLUNA LATERAL (1/3 - Fichas de Localização/Regras) */}
                <div className="md:col-span-1 space-y-6">
                    
                    {/* LOCALIZAÇÃO DETALHADA */}
                    <section className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-md border-l-4 border-rentou-primary">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Localização</h3>
                        <dl className="space-y-1">
                            <ReportDetailItem icon={faMapMarkerAlt} label="CEP" value={endereco.cep?.replace(/^(\d{5})(\d{3})$/, '$1-$2') || 'N/A'} border={false} />
                            <ReportDetailItem icon={faMapMarkerAlt} label="Endereço" value={`${endereco.logradouro}, ${endereco.numero}`} border={false} />
                            <ReportDetailItem icon={faMapMarkerAlt} label="Bairro" value={endereco.bairro || 'N/A'} border={false} />
                            <ReportDetailItem icon={faMapMarkerAlt} label="País" value={endereco.pais || 'Brasil'} border={false} />
                        </dl>
                    </section>

                    {/* REGRAS E CONDOMÍNIO */}
                    <section className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-md border-l-4 border-yellow-500">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Regras</h3>
                        <dl className="space-y-1">
                            <ReportDetailItem 
                                icon={faShieldAlt} 
                                label="Em Condomínio?" 
                                value={condominio.possuiCondominio ? 'Sim' : 'Não'} 
                                colorClass={condominio.possuiCondominio ? 'text-green-600' : 'text-red-600'}
                                border={false}
                            />
                            {condominio.possuiCondominio && <ReportDetailItem icon={faBuilding} label="Nome Condomínio" value={condominio.nomeCondominio || 'N/A'} border={false} />}
                            <ReportDetailItem 
                                icon={faClock} 
                                label="Portaria 24h" 
                                value={condominio.possuiCondominio && condominio.portaria24h ? 'Sim' : 'Não'} 
                                border={false}
                            />
                            <ReportDetailItem 
                                icon={faBed} 
                                label="Aceita Animais" 
                                value={imovel.aceitaAnimais ? 'Sim' : 'Não'} 
                                border={false}
                            />
                        </dl>
                    </section>
                </div>
            </div>
            
            {/* ***********************************************************************************
             * INÍCIO DO LAYOUT DE RELATÓRIO/IMPRESSÃO (VISÍVEL SOMENTE NO PRINT)
             * *********************************************************************************** */}
             <div className="hidden print:block p-4 md:p-10 print:border-2 print:border-gray-800">
                
                {/* CABEÇALHO (Print-Friendly) */}
                <header className="border-b-2 border-gray-200 dark:border-zinc-700 pb-6 mb-6 print:border-gray-800 print:pb-4">
                     <div className="flex justify-between items-start">
                        <div className='flex-grow'>
                            {/* Preço em Destaque */}
                            <div className='flex items-center space-x-3'>
                                <p className="text-base font-medium text-gray-500 dark:text-gray-400 print:text-gray-600">ALUGUEL MENSAL</p>
                                <StatusBadge status={imovel.status} />
                            </div>
                            
                            <h1 className="text-5xl font-extrabold text-rentou-primary dark:text-blue-400 print:text-blue-800 print:text-4xl mt-1">
                                {formatCurrency(imovel.valorAluguel)}
                            </h1>
                            
                            {/* Título e Endereço */}
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3 print:text-gray-900 print:mt-1">
                                {imovel.titulo}
                            </h2>
                            <p className="text-base text-gray-600 dark:text-gray-400 flex items-center mt-1 print:text-gray-700">
                                <Icon icon={faMapMarkerAlt} className="w-4 h-4 mr-2 text-red-500 print:text-gray-800" />
                                {endereco.logradouro}, {endereco.numero} - {endereco.cidade} / {endereco.estado}
                            </p>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 print:text-gray-600">
                                CÓDIGO DO RELATÓRIO: {imovel.smartId}
                            </p>
                        </div>
                    </div>
                </header>
                {/* FIM: CABEÇALHO/ÁREA DE DESTAQUE */}
                
                
                {/* 1. FICHA: QUICK FACTS ESTRUTURAIS */}
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2 mb-4 print:border-gray-800 flex items-center space-x-2">
                    <Icon icon={faRulerCombined} className='w-5 h-5 text-gray-500 print:text-gray-800'/>
                    <span>Fatos Rápidos e Estrutura</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {structuralSpecs.map((spec, index) => (
                        <SpecCard
                            key={index}
                            icon={spec.icon}
                            label={spec.label || spec.unit.replace('m²', 'Área Útil')}
                            value={spec.value}
                            unit={spec.unit !== 'Quartos' && spec.unit !== 'Banheiros' && spec.unit !== 'Vagas' ? spec.unit : ''}
                            color={spec.color}
                        />
                    ))}
                </div>


                {/* 2. FICHA: DETALHES E DESCRIÇÃO (2 COLUNAS) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    
                    {/* COLUNA PRINCIPAL (2/3) */}
                    <div className="md:col-span-2 space-y-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b pb-1 flex items-center space-x-2">
                           <Icon icon={faClipboardList} className='w-4 h-4 text-gray-500'/>
                           <span>Descrição e Atributos</span>
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {imovel.descricaoLonga || 'Nenhuma descrição detalhada fornecida.'}
                        </p>
                        
                        {/* Tags de Comodidades */}
                        <div className="space-y-3">
                             <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Comodidades e Atrativos</p>
                             <div className="flex flex-wrap gap-2">
                                {imovel.caracteristicas.map(c => (
                                    <span key={c} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium dark:bg-zinc-700 dark:text-gray-300 print:bg-gray-100 print:text-gray-700">
                                        <Icon icon={faTag} className='w-3 h-3 mr-1 inline-block' /> {c}
                                    </span>
                                ))}
                                {/* Mídia */}
                                {imovel.visitaVirtual360 && (
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium dark:bg-purple-900/50 dark:text-purple-300 print:text-purple-800 print:bg-transparent">
                                        Visita 360º Disponível
                                    </span>
                                )}
                             </div>
                        </div>

                        {/* SEÇÃO 3: GALERIA (Placeholder para impressão) */}
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-700 print:border-gray-400">
                             <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2">Galeria de Fotos</h2>
                            <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-900/50 print:border-solid print:h-64 print:bg-gray-100">
                                <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                                    **Área de Fotos de Alta Resolução (Não Impressa)**
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* COLUNA LATERAL (1/3 - Fichas Laterais) */}
                    <div className="md:col-span-1 space-y-4">
                        
                         {/* BLOC A: FINANCEIROS (Fichas em Linha para PDF) */}
                        <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 print:border-gray-400 print:shadow-none">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center space-x-2">
                                <Icon icon={faMoneyBillWave} className='w-5 h-5 text-red-500 print:text-gray-800' />
                                <span>Custos Detalhados</span>
                            </h3>
                            <div className='space-y-2'>
                                <FinancialCard 
                                    label="Aluguel Base" 
                                    value={formatCurrency(imovel.valorAluguel)}
                                    icon={faEuroSign} // Usando ícone genérico para BRL/R$
                                    colorClass="text-green-700 dark:text-green-400" 
                                />
                                <FinancialCard 
                                    label="Custos Fixos Totais" 
                                    value={formatCurrency(imovel.valorCondominio + imovel.valorIPTU)}
                                    icon={faTag} 
                                    colorClass="text-red-700 dark:text-red-400" 
                                />
                            </div>
                            <div className='mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700 print:border-gray-400 space-y-1'>
                                <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>Composição:</p>
                                <ReportDetailItem icon={faBuilding} label="Condomínio" value={formatCurrency(imovel.valorCondominio)} border={false} />
                                <ReportDetailItem icon={faClock} label="IPTU Mensal" value={formatCurrency(imovel.valorIPTU)} border={false} />
                            </div>
                        </div>

                        {/* BLOC B: LOCALIZAÇÃO E CONDOMÍNIO (Fichas em Linha para PDF) */}
                        <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 print:border-gray-400 print:shadow-none">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center space-x-2">
                                <Icon icon={faMapMarkerAlt} className='w-5 h-5 text-red-500 print:text-gray-800' />
                                <span>Ficha de Localização</span>
                            </h3>
                            <dl className="space-y-1">
                                <ReportDetailItem icon={faMapMarkerAlt} label="CEP" value={endereco.cep?.replace(/^(\d{5})(\d{3})$/, '$1-$2') || 'N/A'} />
                                <ReportDetailItem icon={faMapMarkerAlt} label="Endereço" value={`${endereco.logradouro}, ${endereco.numero}`} />
                                <ReportDetailItem icon={faMapMarkerAlt} label="Bairro" value={endereco.bairro || 'N/A'} />
                                <ReportDetailItem icon={faMapMarkerAlt} label="Cidade/UF" value={`${endereco.cidade} - ${endereco.estado}`} />
                                <ReportDetailItem icon={faMapMarkerAlt} label="País" value={endereco.pais || 'Brasil'} />
                            </dl>
                        </div>

                        {/* BLOC C: REGRAS E CONDOMÍNIO */}
                        <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 print:border-gray-400 print:shadow-none">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center space-x-2">
                                <Icon icon={faShieldAlt} className='w-5 h-5 text-yellow-600 print:text-gray-800' />
                                <span>Regras e Segurança</span>
                            </h3>
                            <dl className="space-y-1">
                                <ReportDetailItem 
                                    icon={faShieldAlt} 
                                    label="Em Condomínio?" 
                                    value={condominio.possuiCondominio ? 'Sim' : 'Não'} 
                                    colorClass={condominio.possuiCondominio ? 'text-green-600 print:text-gray-900' : 'text-red-600 print:text-gray-900'}
                                />
                                {condominio.possuiCondominio && <ReportDetailItem icon={faBuilding} label="Nome Condomínio" value={condominio.nomeCondominio || 'N/A'} />}
                                <ReportDetailItem 
                                    icon={faClock} 
                                    label="Portaria 24h" 
                                    value={condominio.possuiCondominio && condominio.portaria24h ? 'Sim' : 'Não'} 
                                />
                                <ReportDetailItem 
                                    icon={faCheckCircle} 
                                    label="Área de Lazer" 
                                    value={condominio.possuiCondominio && condominio.areaLazer ? 'Sim' : 'Não'} 
                                />
                                <ReportDetailItem 
                                    icon={faBed} 
                                    label="Aceita Animais" 
                                    value={imovel.aceitaAnimais ? 'Sim' : 'Não'} 
                                />
                            </dl>
                        </div>
                         {/* INSTRUÇÃO PARA EXPORTAÇÃO (Oculto na impressão) */}
                         <p className='text-center text-sm text-gray-500 dark:text-gray-400 pt-4 print:hidden'>
                            Relatório gerado em: {new Date().toLocaleDateString()}.
                        </p>
                    </div>
                </div>

            </div>
            {/* FIM: CONTAINER PRINCIPAL */}
            
            {/* INSTRUÇÃO PARA EXPORTAÇÃO (Oculto na impressão) */}
             <p className='text-center text-sm text-gray-500 dark:text-gray-400 pt-4 print:hidden'>
                Para gerar o **Relatório Profissional em PDF**, use a função de impressão do seu navegador (Ctrl+P ou Cmd+P) e selecione "Salvar como PDF". O layout foi otimizado para alto contraste e clareza de dados.
            </p>

        </div>
    );
}
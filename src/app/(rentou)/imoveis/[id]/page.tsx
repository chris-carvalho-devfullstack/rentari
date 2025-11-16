// src/app/(rentou)/imoveis/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchImovelPorSmartId, removerImovel } from '@/services/ImovelService'; 
// Importando TODAS as interfaces necessárias do seu modelo atualizado
import { 
    Imovel, 
    EnderecoImovel, 
    CondominioData, 
    CozinhaData, 
    SalaData, 
    VarandaData, 
    DispensaData, 
    ResponsavelPagamento 
} from '@/types/imovel'; 
import { Icon } from '@/components/ui/Icon';
// ÍCONES MODERNOS
import { 
    faBed, faShower, faCar, faRulerCombined, faBuilding, faMapMarkerAlt, 
    faMoneyBillWave, faTrashAlt, faEdit, faCheckCircle, faBan, 
    faClock, faShieldAlt, faTag, faDollarSign, faClipboardList,
    faChevronLeft, faChevronRight, faInfoCircle, faCalendarAlt, faWallet, faImage,
    faKey, faHome, faGlobe, faUsers, faUtensils, faCouch, faWarehouse
} from '@fortawesome/free-solid-svg-icons';

// Componente utilitário para formatação de moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// --- TIPAGEM DE DADOS APRIMORADA ---
interface EnhancedImovel extends Imovel {
    isTotalPackage?: boolean; // Flag simulada para despesas inclusas
}

const calculateTotalMonthlyValue = (imovel: EnhancedImovel): number => {
    // MOCK: A lógica de inclusão deve vir do backend ou de um campo do Imóvel.
    // Usamos a flag simulada 'isTotalPackage' para o cálculo.
    const isTotalPackage = imovel.custoCondominioIncluso || imovel.custoIPTUIncluso;

    if (isTotalPackage) {
        let total = imovel.valorAluguel;
        if (imovel.custoCondominioIncluso) total += imovel.valorCondominio;
        if (imovel.custoIPTUIncluso) total += imovel.valorIPTU;
        return total;
    }
    
    return imovel.valorAluguel;
};
// --- FIM CÁLCULO ---

// Componente para o badge de status (mantido)
const StatusBadge: React.FC<{ status: Imovel['status'] }> = ({ status }) => {
  let classes = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ';
  let text = '';

  switch (status) {
    case 'ALUGADO':
      classes += 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      text = 'Alugado';
      break;
    case 'VAGO':
      classes += 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      text = 'Vago';
      break;
    case 'ANUNCIADO':
      classes += 'bg-blue-100 text-rentou-primary dark:bg-blue-900 dark:text-blue-300';
      text = 'Anunciado';
      break;
    case 'MANUTENCAO':
      classes += 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
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

const getResponsavelText = (responsavel: ResponsavelPagamento): string => {
    switch(responsavel) {
        case 'LOCATARIO': return 'Locatário (Inquilino)';
        case 'PROPRIETARIO': return 'Proprietário';
        case 'NA_LOCACAO': return 'Não Aplicável / Negociável';
        default: return 'Não Definido';
    }
}

const ReportDetailItem: React.FC<ReportDetailItemProps> = ({ icon, label, value, colorClass = 'text-gray-900 dark:text-gray-100', border = true }) => (
    <div className={`flex items-center space-x-3 ${border ? 'border-b border-gray-100 dark:border-zinc-700 pb-2 mb-2' : ''}`}>
        <Icon icon={icon} className={`w-5 h-5 flex-shrink-0 text-rentou-primary dark:text-blue-400`} />
        <div className='flex flex-col flex-grow'>
            <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
            <dd className={`mt-0.5 text-sm font-semibold ${colorClass}`}>{value}</dd>
        </div>
    </div>
);


// Card de Destaque Financeiro (Mantido, mas com ícone ajustado)
interface FinancialCardProps {
    label: string;
    value: string;
    icon: any;
    colorClass: string; 
}

const FinancialCard: React.FC<FinancialCardProps> = ({ label, value, icon, colorClass }) => (
    <div className="flex flex-col p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
        <div className="flex items-center space-x-2 mb-1">
             <Icon icon={icon} className={`w-4 h-4 ${colorClass}`} />
             <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        </div>
        <p className={`text-xl font-extrabold ${colorClass}`}>
            {value}
        </p>
    </div>
);

// MOCK DE IMAGENS
const mockPhotos = [
    '/media/Rentou logomarcca.png', 
    'https://via.placeholder.com/1600x900?text=Quarto+Principal+(16:9)',
    'https://via.placeholder.com/1200x800?text=Cozinha+Moderna+(3:2)',
    'https://via.placeholder.com/1920x1080?text=Sala+de+Estar+(16:9)',
    'https://via.placeholder.com/800x1200?text=Vertical+Exemplo',
    'https://via.placeholder.com/600x600?text=Quadrada',
];

// Interface para estruturar os Quick Facts
interface StructuralSpecItem {
    icon: any;
    label?: string;
    value: string | number;
    unit: string;
    color: string;
}

// --- Componente SpecPill (Apenas para as métricas numéricas) ---
const SpecPill: React.FC<StructuralSpecItem> = ({ icon, value, unit, color }) => (
    <div className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-zinc-700 rounded-full shadow-inner print:hidden">
        <Icon icon={icon} className={`w-5 h-5 flex-shrink-0 ${color}`} />
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {value}
            {unit && <span className="text-xs font-medium ml-0.5 text-gray-500 dark:text-gray-400">{unit}</span>}
        </p>
    </div>
);

// --- Componente ClassificationPill (Para Tipo e Finalidade) ---
const ClassificationPill: React.FC<{ icon: any; primary: string; secondary: string; color: string }> = ({ icon, primary, secondary, color }) => (
    <div className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg shadow-inner print:hidden border border-gray-200 dark:border-zinc-700">
        <Icon icon={icon} className={`w-5 h-5 flex-shrink-0 ${color}`} />
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {primary}
            {secondary && <span className="text-xs font-medium ml-1 text-gray-500 dark:text-gray-400">({secondary})</span>}
        </p>
    </div>
);


// --- StructuralDetailsCard (CORRIGIDO PARA RECEBER E MOSTRAR DADOS NOVOS) ---
const StructuralDetailsCard: React.FC<{ specs: StructuralSpecItem[], imovel: EnhancedImovel }> = ({ specs, imovel }) => (
    <div className='p-5 bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-gray-200 dark:border-zinc-700'>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 flex items-center space-x-2">
            <Icon icon={faRulerCombined} className='w-5 h-5 text-rentou-primary' />
            <span>Especificações e Classificação</span>
        </h3>
        
        {/* Bloco de Classificação */}
        <div className="flex flex-wrap gap-3 mb-6">
             <ClassificationPill
                icon={faBuilding}
                primary={imovel.tipoDetalhado} 
                secondary={imovel.categoriaPrincipal} 
                color="text-rentou-primary"
            />
            <ClassificationPill
                icon={faUsers} 
                primary={imovel.finalidades.join(' / ')}
                secondary="Finalidade(s)" 
                color="text-indigo-500"
            />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {specs.map((spec, index) => (
                <div key={index} className="flex flex-col items-center justify-center p-3 border border-gray-100 dark:border-zinc-700 rounded-lg">
                    <Icon icon={spec.icon} className={`w-6 h-6 ${spec.color}`} />
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {spec.value}
                    </p>
                    <p className="text-xs font-medium text-gray-500 uppercase mt-0.5">{spec.unit}</p>
                </div>
            ))}
        </div>
        
        {/* NOVO: DETALHES DE COMODOS INTEGRADOS */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
             <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center space-x-2">
                <Icon icon={faHome} className='w-5 h-5 text-gray-500' />
                <span>Detalhes Internos dos Cômodos</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {/* Cozinha */}
                <ReportDetailItem 
                    icon={faUtensils} 
                    label="Cozinha" 
                    // Garante que o objeto exista e use fallback
                    value={`${imovel.cozinha?.tipo?.replace('_', ' ').toLowerCase() || 'Fechada'} ${imovel.cozinha?.possuiArmarios ? ' - C/ Armários' : ''}`}
                    border={false}
                />
                 {/* Dispensa */}
                <ReportDetailItem 
                    icon={faWarehouse} 
                    label="Dispensa" 
                    value={imovel.dispensa?.possuiDispensa ? `Sim ${imovel.dispensa.prateleirasEmbutidas ? ' (C/ Prateleiras)' : ''}` : 'Não possui'}
                    border={false}
                />
                {/* Sala */}
                 <ReportDetailItem 
                    icon={faCouch} 
                    label="Sala(s)" 
                    value={`${imovel.sala?.qtdSalas || 1} Sala(s) - Tipo: ${imovel.sala?.tipo?.replace('_', ' ').toLowerCase() || 'Estar/Jantar'}`}
                    border={false}
                />
                {/* Varanda */}
                 <ReportDetailItem 
                    icon={faBuilding} 
                    label="Varanda/Terraço" 
                    value={imovel.varanda?.possuiVaranda ? `${imovel.varanda?.tipo || 'Simples'} ${imovel.varanda.possuiChurrasqueira ? ' (C/ Churrasqueira Gourmet)' : ''}` : 'Não possui'}
                    border={false}
                />
            </div>
        </div>
        {/* FIM DETALHES COMODOS */}

    </div>
);
// --- FIM StructuralDetailsCard ---


// --- Componente de Galeria de Imagens (Mantido) ---
const ImageGallery: React.FC<{ photos: string[], titulo: string, currentPhotoIndex: number, setCurrentPhotoIndex: (index: number) => void, totalPhotos: number }> = ({ photos, titulo, currentPhotoIndex, setCurrentPhotoIndex, totalPhotos }) => {
    if (totalPhotos === 0) {
        return (
             <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-zinc-700/50 rounded-xl shadow-lg">
                <p className="text-center text-gray-500 dark:text-gray-400 font-bold text-xl">
                    Nenhuma imagem cadastrada.
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            <div className="relative h-[450px] overflow-hidden rounded-xl shadow-xl bg-gray-900">
                <img 
                    src={photos[currentPhotoIndex] || '/placeholder.png'} 
                    alt={`Foto ${currentPhotoIndex + 1} de ${titulo}`} 
                    className="w-full h-full object-cover transition-opacity duration-300"
                />
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full font-medium flex items-center space-x-2">
                    <Icon icon={faImage} className="w-4 h-4" />
                    <span>{currentPhotoIndex + 1} / {totalPhotos}</span>
                </div>
            </div>

            <div className="flex space-x-3 overflow-x-auto pb-2">
                {photos.map((url, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`flex-shrink-0 w-24 h-16 overflow-hidden rounded-lg transition-all duration-200 border-2 ${
                            index === currentPhotoIndex ? 'border-rentou-primary scale-105 shadow-md' : 'border-gray-300 dark:border-zinc-700 hover:border-rentou-primary/50'
                        }`}
                        style={{ minWidth: '96px' }} 
                    >
                        <img 
                            src={url} 
                            alt={`Thumbnail ${index + 1}`} 
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};


/**
 * @fileoverview Página de Visualização/Detalhes de um Imóvel (Hub de Gerenciamento).
 * Layout Clean & Organizado.
 */
export default function ImovelDetalhePage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id; 
    
    const [imovel, setImovel] = useState<EnhancedImovel | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); 

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
                
                // === CORREÇÃO: Tratamento para 'data' possivelmente undefined ===
                if (!data) {
                    throw new Error('Imóvel não encontrado.');
                }
                // =========================================================

                if (data.fotos.length === 0) {
                    data.fotos = mockPhotos;
                }
                
                // MOCK DE DADOS: Agora depende dos novos campos de inclusão e garante que objetos de cômodos existam
                const enhancedData: EnhancedImovel = { 
                    ...data,
                    // Garante que os objetos de cômodos existam para evitar crashes
                    cozinha: data.cozinha || {} as CozinhaData, 
                    sala: data.sala || {} as SalaData,
                    varanda: data.varanda || {} as VarandaData,
                    dispensa: data.dispensa || {} as DispensaData,
                    // Determina se o valor total deve ser calculado (Simulando flag)
                    isTotalPackage: data.custoCondominioIncluso || data.custoIPTUIncluso || (data.valorCondominio > 100), // Simulação
                } as EnhancedImovel;

                setImovel(enhancedData || null); 
            } catch (err: any) {
                console.error('Erro ao buscar imóvel:', err);
                // Captura o erro customizado ou o erro de falha ao carregar
                setError(err.message || 'Falha ao carregar os dados do imóvel.'); 
            } finally {
                setLoading(false);
            }
        };

        loadImovel();
    }, [id]);
    
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

    // --- VARIÁVEIS DERIVADAS APÓS CHECAGEM DE CARREGAMENTO (FIX) ---
    const photos = imovel?.fotos || [];
    const totalPhotos = photos.length; // <--- DEFINIÇÃO CORRETA
    const endereco = imovel.endereco || {};
    const condominio = imovel.condominio || {};
    
    const totalMonthlyValue = calculateTotalMonthlyValue(imovel);

    const handleDelete = async () => { /* Lógica de exclusão */ };

    // Lista de especificações estruturais (agora com Área Total e Andar)
    const structuralSpecs: StructuralSpecItem[] = [
        { icon: faBed, value: imovel.quartos, unit: 'Quartos', color: 'text-red-500' },
        { icon: faShower, value: imovel.banheiros, unit: 'Banheiros', color: 'text-blue-500' },
        { icon: faCar, value: imovel.vagasGaragem, unit: 'Vagas', color: 'text-gray-500' },
        { icon: faRulerCombined, value: imovel.areaTotal, unit: 'm² Total', label: 'Área Total', color: 'text-yellow-600' },
        { icon: faRulerCombined, value: imovel.areaUtil, unit: 'm² Útil', label: 'Área Útil', color: 'text-green-600' },
    ];
    
    if (imovel.categoriaPrincipal === 'Residencial' && imovel.tipoDetalhado.includes('Apartamento')) {
        structuralSpecs.push({ icon: faBuilding, value: imovel.andar || 'Térreo', unit: 'Andar', color: 'text-yellow-600', label: 'Andar' });
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-0">
             {/* Link Voltar */}
            <Link href="/imoveis" className="text-rentou-primary hover:underline font-medium text-sm flex items-center space-x-2">
                <Icon icon={faChevronLeft} className='w-3 h-3' />
                <span>Voltar para Lista de Imóveis</span>
            </Link>
            
            {/* 1. CARD PRINCIPAL (GALERIA, TÍTULO, PREÇO) */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-6 space-y-6">
                <ImageGallery 
                    photos={photos} 
                    titulo={imovel.titulo} 
                    currentPhotoIndex={currentPhotoIndex}
                    setCurrentPhotoIndex={setCurrentPhotoIndex}
                    totalPhotos={totalPhotos}
                />
                
                {/* HEADER COM STATUS E AÇÕES */}
                <div className="flex justify-between items-start border-b pb-4 border-gray-100 dark:border-zinc-700">
                    <div className='space-y-1'>
                         <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                            {imovel.titulo}
                        </h1>
                        <div className="flex flex-col space-y-1">
                            {/* Endereço Principal */}
                            <p className="text-xl font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                <Icon icon={faMapMarkerAlt} className='w-4 h-4 text-red-500' />
                                <span>{endereco.cidade} - {endereco.estado}, {endereco.bairro}</span>
                            </p>
                            {/* Smart ID Discreto */}
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 pl-6">
                                Cód. Imóvel: {imovel.smartId}
                            </p>
                        </div>
                    </div>
                    
                    {/* BOTÕES DE AÇÃO E STATUS */}
                    <div className='flex flex-col items-end space-y-2'>
                         <div className='flex space-x-2'>
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
                </div>

                {/* VALOR MENSAL (Status Badge movido ao lado do valor) */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1">
                        
                        <div className="flex items-center space-x-3">
                             {/* Label do Valor */}
                             <p className="text-sm text-gray-500 uppercase font-medium">
                                {imovel.isTotalPackage ? 'Valor Mensal Total' : 'Valor Mensal (Aluguel)'}
                            </p>
                            {/* Status Badge MOVIDO AQUI */}
                             <StatusBadge status={imovel.status} />
                        </div>
                        
                         <h2 className="text-4xl font-extrabold text-green-600 dark:text-green-400">
                            {formatCurrency(totalMonthlyValue)}
                        </h2>
                        {imovel.isTotalPackage && (
                            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                                Inclui taxas de Cond. ({formatCurrency(imovel.valorCondominio)}) e IPTU ({formatCurrency(imovel.valorIPTU)}).
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* CARD ESTRUTURAL E CLASSIFICAÇÃO */}
            <StructuralDetailsCard specs={structuralSpecs} imovel={imovel} />

            {/* 2. SEÇÃO DE DETALHES (2 COLUNAS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* COLUNA ESQUERDA (2/3): DESCRIÇÃO E COMODIDADES */}
                <div className='md:col-span-2 space-y-6'>
                    
                    {/* DESCRIÇÃO DETALHADA */}
                    <section className='space-y-4 p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-md'>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2 flex items-center space-x-2">
                            <Icon icon={faInfoCircle} className='w-5 h-5 text-rentou-primary' />
                            <span>Descrição do Imóvel</span>
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {imovel.descricaoLonga || 'Nenhuma descrição detalhada fornecida para este anúncio.'}
                        </p>
                    </section>
                    
                    {/* COMODIDADES E REGRAS */}
                    <section className='space-y-4 p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-md'>
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2 flex items-center space-x-2">
                            <Icon icon={faCheckCircle} className='w-5 h-5 text-green-600' />
                            <span>Comodidades e Regras de Locação</span>
                        </h2>
                         <div className="flex flex-wrap gap-3 pt-2">
                            {imovel.caracteristicas.map(c => (
                                <span key={c} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium dark:bg-green-900/50 dark:text-green-300 flex items-center">
                                    <Icon icon={faTag} className='w-3 h-3 mr-1 inline-block' /> {c}
                                </span>
                            ))}
                            {imovel.aceitaAnimais && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium dark:bg-yellow-900/50 dark:text-yellow-300 flex items-center">
                                    <Icon icon={faBed} className='w-3 h-3 mr-1 inline-block' /> Aceita Animais
                                </span>
                            )}
                            {imovel.visitaVirtual360 && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium dark:bg-purple-900/50 dark:text-purple-300 flex items-center">
                                    Tour Virtual 360º
                                </span>
                            )}
                        </div>
                    </section>

                    {/* DETALHES CONDOMÍNIO (SE APLICÁVEL) */}
                    {condominio.possuiCondominio && (
                         <section className='space-y-4 p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-md'>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b pb-2 mb-4 flex items-center space-x-2">
                                <Icon icon={faBuilding} className='w-5 h-5 text-blue-600' />
                                <span>Dados do Condomínio {condominio.nomeCondominio && `(${condominio.nomeCondominio})`}</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ReportDetailItem 
                                    icon={faShieldAlt} 
                                    label="Segurança / Portaria" 
                                    value={condominio.portaria24h ? '24 Horas' : 'Portaria Simples'} 
                                    border={false}
                                />
                                <ReportDetailItem 
                                    icon={faCheckCircle} 
                                    label="Lazer e Áreas Comuns" 
                                    value={condominio.areaLazer ? 'Sim' : 'Não'} 
                                    border={false}
                                />
                            </div>
                        </section>
                    )}
                </div>
                
                {/* COLUNA DIREITA (1/3): FINANCEIRO E LOCALIZAÇÃO */}
                <div className="md:col-span-1 space-y-6">
                    
                    {/* DADOS FINANCEIROS */}
                    <div className="p-5 rounded-xl shadow-xl border-l-4 border-red-500 bg-white dark:bg-zinc-800 space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-2 border-b pb-2">
                             <Icon icon={faWallet} className='w-5 h-5 text-red-500' />
                            <span>Custos e Contrato</span>
                        </h3>
                        {/* Aluguel Base */}
                        <FinancialCard 
                            label="Aluguel Base" 
                            value={formatCurrency(imovel.valorAluguel)}
                            icon={faDollarSign} 
                            colorClass="text-green-700 dark:text-green-400" 
                        />
                        {/* Condomínio */}
                        <FinancialCard 
                            label="Condomínio Estimado" 
                            value={formatCurrency(imovel.valorCondominio)}
                            icon={faBuilding} 
                            colorClass="text-blue-700 dark:text-blue-400" 
                        />
                        <ReportDetailItem
                            icon={faUsers}
                            label="Responsável Condomínio"
                            value={getResponsavelText(imovel.responsavelCondominio)}
                            colorClass={imovel.responsavelCondominio === 'LOCATARIO' ? 'text-blue-600' : 'text-gray-600'}
                            border={true}
                        />
                        {/* IPTU */}
                        <FinancialCard 
                            label="IPTU Mensal Estimado" 
                            value={formatCurrency(imovel.valorIPTU)} 
                            icon={faDollarSign} 
                            colorClass="text-red-700 dark:text-red-400" 
                        />
                         <ReportDetailItem
                            icon={faUsers}
                            label="Responsável IPTU"
                            value={getResponsavelText(imovel.responsavelIPTU)}
                            colorClass={imovel.responsavelIPTU === 'LOCATARIO' ? 'text-blue-600' : 'text-gray-600'}
                            border={true}
                        />
                         <ReportDetailItem 
                            icon={faCalendarAlt} 
                            label="Disponível a Partir de" 
                            value={new Date(imovel.dataDisponibilidade).toLocaleDateString('pt-BR', { dateStyle: 'medium' })} 
                            border={false}
                        />
                        <ReportDetailItem 
                            icon={faKey} 
                            label="Cód. Negócio (Smart ID)" 
                            value={imovel.smartId} 
                            border={false}
                        />
                    </div>
                    
                    {/* LOCALIZAÇÃO DETALHADA */}
                    <div className="p-5 rounded-xl shadow-xl border-l-4 border-green-500 bg-white dark:bg-zinc-800 space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-2 border-b pb-2">
                            <Icon icon={faMapMarkerAlt} className='w-5 h-5 text-green-500' />
                            <span>Endereço Completo</span>
                        </h3>
                        {/* CEP com ícone distinto */}
                        <ReportDetailItem 
                            icon={faKey} 
                            label="CEP" 
                            value={endereco.cep?.replace(/^(\d{5})(\d{3})$/, '$1-$2') || 'N/A'}
                            border={true}
                        />
                         {/* Logradouro com ícone de casa */}
                        <ReportDetailItem 
                            icon={faHome} 
                            label="Logradouro e Número" 
                            value={`${endereco.logradouro}, ${endereco.numero}`}
                            border={true}
                        />
                         {/* Complemento (NOVO CAMPO) */}
                         <ReportDetailItem 
                            icon={faTag} 
                            label="Complemento" 
                            value={endereco.complemento || 'N/A'}
                            border={true}
                        />
                        <ReportDetailItem icon={faMapMarkerAlt} label="Bairro" value={endereco.bairro || 'N/A'} border={true} />
                        <ReportDetailItem icon={faMapMarkerAlt} label="Cidade/UF" value={`${endereco.cidade} - ${endereco.estado}`} border={true} />
                        {/* País com ícone de globo */}
                        <ReportDetailItem 
                            icon={faGlobe} 
                            label="País" 
                            value={endereco.pais || 'N/A'}
                            border={false}
                        />
                    </div>

                </div>
            </div>
            
             {/* Rodapé de instrução */}
             <p className='text-center text-sm text-gray-500 dark:text-gray-400 pt-4'>
                O layout foi otimizado para a gestão de informações e relatórios. Para gerar o **Relatório Profissional em PDF**, use a função de impressão do seu navegador (Ctrl+P ou Cmd+P).
            </p>

        </div>
    );
}
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link'; // ADICIONADO
import { useAuthStore } from '@/hooks/useAuthStore';
import { CacheInspector } from '@/components/admin/CacheInspector';
import { Icon } from '@/components/ui/Icon';
import { 
    faChartLine, faShieldAlt, 
    faDatabase, faImages, faMapMarkedAlt, faStopwatch, faSync, faCheckCircle, faQuestionCircle, faTimes, faExclamationTriangle,
    faList, faFilter, faSearch, faChevronDown, faInfoCircle, faLifeRing // ADICIONADO faLifeRing
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { db } from '@/services/FirebaseService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Imovel } from '@/types/imovel';

// Interface para as estatísticas
interface AdminStats {
    totalImoveis: number;
    imoveisPublicados: number;
    totalUsuarios: number;
    proprietarios: number;
    inquilinos: number;
    ambos: number;
    receitaEstimada: number;
    pendenciasFinanceiras: number;
    // Novas Métricas de Infra
    imoveisSemCoordenadas: number;
    totalFotos: number;
    dbResponseTime: number;
}

// Interface para os detalhes da auditoria
interface AuditDetail {
    smartId: string;
    address: string;
    cfStatus: string;
    age: string;
    latency: number;
    isHit: boolean;
    timestamp: string;
    fullHeaders: Record<string, string>;
}

// --- COMPONENTE DE MODAL DE AJUDA ---
const HelpModal = ({ title, content, isOpen, onClose }: { title: string, content: React.ReactNode, isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <Icon icon={faTimes} className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Icon icon={faQuestionCircle} className="w-6 h-6 mr-2 text-blue-500" />
                    {title}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                    {content}
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 font-medium text-sm">
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- NOVO: POPOVER TÉCNICO INTERATIVO (POSICIONAMENTO INTELIGENTE) ---
interface TechDetailsPopoverProps {
    headers: Record<string, string>;
    onClose: () => void;
    position?: 'top' | 'bottom'; // Nova prop para controlar a direção
}

const TechDetailsPopover = ({ headers, onClose, position = 'top' }: TechDetailsPopoverProps) => {
    // Define classes baseadas na posição
    const containerClasses = position === 'top' 
        ? "bottom-full mb-3 animate-in slide-in-from-bottom-2" // Abre para CIMA
        : "top-full mt-3 animate-in slide-in-from-top-2";      // Abre para BAIXO

    const arrowClasses = position === 'top'
        ? "-bottom-1 border-r border-b" // Seta aponta para baixo
        : "-top-1.5 border-l border-t";   // Seta aponta para cima

    return (
        <div 
            className={`absolute left-1/2 transform -translate-x-1/2 w-72 bg-gray-900 text-white text-xs rounded-lg shadow-2xl z-50 text-left font-mono border border-gray-700 flex flex-col overflow-hidden fade-in zoom-in-95 duration-200 ${containerClasses}`}
            onClick={(e) => e.stopPropagation()} 
        >
            {/* Header do Popover */}
            <div className="flex justify-between items-center px-3 py-2 bg-gray-800 border-b border-gray-700">
                 <span className="font-bold text-gray-300 flex items-center gap-2">
                    <Icon icon={faList} className="text-blue-400" /> Cloudflare Debug
                 </span>
                 <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-400 hover:text-white p-1">
                    <Icon icon={faTimes} />
                 </button>
            </div>
            
            {/* Conteúdo */}
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {headers['cf-ray'] ? (
                    <>
                        <div className="flex flex-col">
                            <span className="text-gray-500 uppercase text-[10px]">Ray ID (Rastreio)</span>
                            <span className="text-blue-300 break-all select-all">{headers['cf-ray']}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                                <span className="text-gray-500 uppercase text-[10px]">Datacenter</span>
                                <span className="text-green-400 select-all">{headers['cf-ray'].split('-')[1] || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 uppercase text-[10px]">Server</span>
                                <span className="text-gray-300 select-all">{headers['server'] || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col border-t border-gray-700 pt-2 mt-1">
                            <span className="text-gray-500 uppercase text-[10px]">Date</span>
                            <span className="text-gray-400">{headers['date']}</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500 py-2 italic">
                        Headers raw indisponíveis.<br/>
                        Verifique o CORS.
                    </div>
                )}
            </div>
    
            {/* Seta do Popover (Dinâmica) */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 border-gray-700 ${arrowClasses}`}></div>
        </div>
    );
};

// --- COMPONENTE MODAL DE DETALHES DA AUDITORIA (ATUALIZADO) ---
const AuditDetailsModal = ({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: AuditDetail[] }) => {
    const [searchFilter, setSearchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'HIT' | 'MISS'>('ALL');
    const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

    // Filtra os dados com base no Smart ID e no Status
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = item.smartId.toLowerCase().includes(searchFilter.toLowerCase());
            
            let matchesStatus = true;
            if (statusFilter === 'HIT') matchesStatus = item.isHit;
            if (statusFilter === 'MISS') matchesStatus = !item.isHit;

            return matchesSearch && matchesStatus;
        });
    }, [data, searchFilter, statusFilter]);

    const handleTogglePopover = (id: string) => {
        setActivePopoverId(prev => prev === id ? null : id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-5xl w-full p-6 relative animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => { e.stopPropagation(); setActivePopoverId(null); }}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-zinc-700 pb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <Icon icon={faList} className="w-6 h-6 mr-3 text-rentou-primary" />
                            Relatório Detalhado de Cache
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Clique no status para ver detalhes técnicos profundos.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <Icon icon={faTimes} className="w-6 h-6" />
                    </button>
                </div>

                {/* Barra de Ferramentas (Filtros) */}
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    
                    {/* Busca */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon icon={faSearch} className="text-gray-400 w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Filtrar por Smart ID..." 
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700/50 text-sm focus:ring-2 focus:ring-rentou-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>

                    {/* Filtro de Status */}
                    <div className="relative min-w-[180px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon icon={faFilter} className="text-gray-400 w-3 h-3" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full pl-9 pr-8 py-2 appearance-none rounded-lg border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700/50 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-rentou-primary outline-none cursor-pointer"
                        >
                            <option value="ALL">Todos os Status</option>
                            <option value="HIT">✅ Apenas HIT (Cache)</option>
                            <option value="MISS">⚠️ Apenas MISS / Bypass</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                            <Icon icon={faChevronDown} className="w-3 h-3" />
                        </div>
                    </div>

                    <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {filteredData.length} resultados
                    </div>
                </div>

                {/* Tabela */}
                <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-zinc-700 relative">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-zinc-900 text-xs uppercase text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Smart ID</th>
                                <th className="px-4 py-3 font-semibold">Localização</th>
                                <th className="px-4 py-3 text-center font-semibold">Status CF</th>
                                <th className="px-4 py-3 text-center font-semibold">Age (s)</th>
                                <th className="px-4 py-3 text-center font-semibold">Latência</th>
                                <th className="px-4 py-3 text-right font-semibold">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700 bg-white dark:bg-zinc-800">
                            {filteredData.length > 0 ? (
                                filteredData.map((row, index) => {
                                    // LÓGICA DE POSICIONAMENTO INTELIGENTE
                                    // Se for uma das primeiras 3 linhas, abre para BAIXO ('bottom').
                                    // Senão, abre para CIMA ('top') padrão.
                                    const popoverPosition = index < 3 ? 'bottom' : 'top';

                                    return (
                                        <tr key={row.smartId} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors group">
                                            <td className="px-4 py-3 font-mono font-medium text-rentou-primary">{row.smartId}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={row.address}>{row.address}</td>
                                            
                                            {/* Célula de Status Interativa */}
                                            <td className="px-4 py-3 text-center relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleTogglePopover(row.smartId); }}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-offset-1 ${
                                                        row.isHit 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 focus:ring-green-500' 
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 focus:ring-yellow-500'
                                                    }`}
                                                >
                                                    {row.cfStatus || 'MISS'}
                                                    <Icon icon={faInfoCircle} className="w-3 h-3 opacity-50" />
                                                </button>
                                                
                                                {/* Renderização Condicional da Caixa de Detalhes */}
                                                {activePopoverId === row.smartId && (
                                                    <TechDetailsPopover 
                                                        headers={row.fullHeaders} 
                                                        onClose={() => setActivePopoverId(null)}
                                                        position={popoverPosition} 
                                                    />
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-center font-mono text-gray-600 dark:text-gray-400">
                                                {row.age || '0'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${row.latency < 100 ? 'text-green-600' : 'text-orange-500'}`}>
                                                    {row.latency}ms
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500 text-xs">
                                                {new Date(row.timestamp).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
                                        <Icon icon={faSearch} className="w-8 h-8 mb-2 text-gray-300" />
                                        <p>Nenhum registro encontrado com estes filtros.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg shadow-sm transition-colors dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-600"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Botão de Ajuda Reutilizável para os Cards
const CardHelpButton = ({ onClick }: { onClick: () => void }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="text-gray-400 hover:text-blue-500 transition-colors ml-auto"
        title="O que é isso?"
    >
        <Icon icon={faQuestionCircle} className="w-4 h-4" />
    </button>
);

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();

    // Estados de Ajuda (Modal)
    const [helpModalKey, setHelpModalKey] = useState<string | null>(null);

    // Estado das Estatísticas
    const [stats, setStats] = useState<AdminStats>({
        totalImoveis: 0, imoveisPublicados: 0,
        totalUsuarios: 0, proprietarios: 0, inquilinos: 0, ambos: 0,
        receitaEstimada: 0, pendenciasFinanceiras: 0,
        imoveisSemCoordenadas: 0, totalFotos: 0, dbResponseTime: 0
    });

    // Estado da Auditoria de Cache
    const [cacheAudit, setCacheAudit] = useState({
        checked: 0, totalToCheck: 0, hits: 0, loading: false, completed: false,
        averageLatency: 0 // Média acumulada
    });
    
    // Novos estados para o Relatório Detalhado
    const [auditDetails, setAuditDetails] = useState<AuditDetail[]>([]);
    const [showAuditModal, setShowAuditModal] = useState(false);

    // 1. Carregar Estatísticas
    useEffect(() => {
        const fetchStats = async () => {
            const startTime = performance.now(); // Início da medição
            try {
                const imoveisColl = collection(db, 'imoveis');
                const imoveisSnapshot = await getDocs(imoveisColl);
                
                let countTotal = 0;
                let countPublicados = 0;
                let countSemCoords = 0;
                let countFotos = 0;

                imoveisSnapshot.forEach(doc => {
                    const data = doc.data() as Imovel;
                    countTotal++;
                    if (data.status === 'ANUNCIADO') countPublicados++;
                    if (!data.latitude || !data.longitude) countSemCoords++;
                    if (data.fotos && Array.isArray(data.fotos)) countFotos += data.fotos.length;
                });

                const usuariosColl = collection(db, 'usuarios');
                const usuariosSnap = await getDocs(usuariosColl);
                
                let props = 0, inqs = 0, ambs = 0;
                usuariosSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.perfil === 'PROPRIETARIO') props++;
                    else if (data.perfil === 'INQUILINO') inqs++;
                    else if (data.perfil === 'AMBOS') ambs++;
                    else props++;
                });

                const receitaEstimada = countPublicados * 2500; 
                const endTime = performance.now(); // Fim da medição

                setStats({
                    totalImoveis: countTotal,
                    imoveisPublicados: countPublicados,
                    totalUsuarios: usuariosSnap.size,
                    proprietarios: props,
                    inquilinos: inqs,
                    ambos: ambs,
                    receitaEstimada: receitaEstimada,
                    pendenciasFinanceiras: 3,
                    imoveisSemCoordenadas: countSemCoords,
                    totalFotos: countFotos,
                    dbResponseTime: Math.round(endTime - startTime)
                });

            } catch (error) {
                console.error("Erro ao carregar estatísticas admin:", error);
            }
        };

        if (user?.tipo === 'ADMIN') {
            fetchStats();
        }
    }, [user]);

    // 2. Auditoria de Cache (Com Validação Rigorosa de Borda - CUSTO ZERO e Coleta de Detalhes)
    const runCacheAudit = async () => {
        setCacheAudit({ checked: 0, totalToCheck: 0, hits: 0, loading: true, completed: false, averageLatency: 0 });
        setAuditDetails([]); // Limpa detalhes anteriores
        
        try {
            const q = query(collection(db, 'imoveis'), where('status', '==', 'ANUNCIADO'));
            const snapshot = await getDocs(q);
            const imoveis = snapshot.docs.map(d => d.data() as Imovel);
            
            setCacheAudit(prev => ({ ...prev, totalToCheck: imoveis.length }));

            let hitCount = 0;
            let processed = 0;
            let totalLatencySum = 0;
            let latenciesRecorded = 0;
            const newDetails: AuditDetail[] = []; // Array temporário para coleta

            const batchSize = 5;
            for (let i = 0; i < imoveis.length; i += batchSize) {
                const batch = imoveis.slice(i, i + batchSize);
                const promises = batch.map(async (imovel) => {
                    if (!imovel.latitude || !imovel.longitude) return null;
                    // Removido o 'tag' da URL para bater na mesma chave de cache do usuário real (All-in-One)
                    const url = `/api/pois?lat=${imovel.latitude}&lon=${imovel.longitude}`;
                    const start = performance.now();
                    try {
                        // --- MODO AUDITORIA SEGURA ---
                        const res = await fetch(url, { 
                            headers: { 'x-audit-mode': '1' },
                            // cache: 'no-store' REMOVIDO para permitir que bata no cache da Cloudflare
                        }); 
                        const end = performance.now();
                        const latency = Math.round(end - start);
                        
                        const data = await res.json();
                        
                        // CAPTURA HEADERS COMPLETOS
                        const headersObj: Record<string, string> = {};
                        res.headers.forEach((val, key) => {
                            headersObj[key] = val;
                        });

                        // SE data for array, Cloudflare entregou o cache antigo (HIT).
                        // SE data for { audit: 'miss' }, foi um MISS seguro (sem custo).
                        const isRealHit = Array.isArray(data);
                        const cfStatus = res.headers.get('cf-cache-status');
                        const age = res.headers.get('age');

                        // Constrói objeto de detalhe
                        const detail: AuditDetail = {
                            smartId: imovel.smartId || 'N/A',
                            address: `${imovel.endereco.bairro}, ${imovel.endereco.cidade}`,
                            cfStatus: cfStatus || (isRealHit ? 'HIT' : 'MISS (Safe)'),
                            age: age || '0',
                            latency: latency,
                            isHit: isRealHit,
                            timestamp: new Date().toISOString(),
                            fullHeaders: headersObj // NOVO: Salva headers completos para o Modal
                        };
                        
                        return detail;
                    } catch {
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                
                results.forEach(res => {
                    if (res) {
                        newDetails.push(res); // Adiciona ao acumulador
                        if (res.isHit) {
                            if (res.isHit) hitCount++;
                             totalLatencySum += res.latency;
                             latenciesRecorded++;
                        }
                    }
                });
                
                // Ordena por Smart ID para facilitar leitura
                newDetails.sort((a, b) => a.smartId.localeCompare(b.smartId));
                setAuditDetails([...newDetails]); // Atualiza o estado progressivamente

                processed += batch.length;
                const currentAvg = latenciesRecorded > 0 ? Math.round(totalLatencySum / latenciesRecorded) : 0;
                
                setCacheAudit(prev => ({ ...prev, checked: processed, hits: hitCount, averageLatency: currentAvg }));
            }
            setCacheAudit(prev => ({ ...prev, loading: false, completed: true }));
        } catch (error) {
            console.error("Erro na auditoria:", error);
            setCacheAudit(prev => ({ ...prev, loading: false }));
        }
    };

    if (user?.tipo !== 'ADMIN') {
        return <div className="flex justify-center items-center h-screen text-red-600 font-bold">Acesso Negado</div>;
    }

    const cachePercentage = cacheAudit.totalToCheck > 0 
        ? Math.round((cacheAudit.hits / cacheAudit.totalToCheck) * 100) 
        : 0;
    
    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Conteúdo dos Modais de Ajuda
    const getHelpContent = (key: string) => {
        switch(key) {
            case 'db_health': return (
                <>
                    <p>Mede o tempo total necessário para conectar ao <strong>Firebase Firestore</strong>, baixar os dados iniciais e processar as estatísticas desta tela.</p>
                    <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li><strong>&lt; 500ms:</strong> Excelente saúde do banco.</li>
                        <li><strong>&gt; 2s:</strong> Atenção. Pode indicar que o banco está grande demais e precisa de otimização (índices ou paginação).</li>
                    </ul>
                </>
            );
            case 'geocoding': return (
                <>
                    <p>Monitora a integridade dos dados de localização.</p>
                    <p className="mt-2">Imóveis sem Latitude/Longitude não aparecem no mapa para os clientes, mesmo que tenham endereço escrito. Se este número crescer, verifique o serviço de Geocoding automático.</p>
                </>
            );
            case 'storage': return (
                <>
                    <p>Contagem total de fotos de alta resolução armazenadas no bucket.</p>
                    <p className="mt-2">Um número muito alto pode impactar os custos de armazenamento do Firebase. Use esta métrica para decidir quando rodar scripts de limpeza ou compressão de imagens antigas.</p>
                </>
            );
            case 'latency': return (
                <>
                    <p>A <strong>prova real</strong> da velocidade do seu site para o usuário final (apenas para requisições em Cache).</p>
                    <p className="mt-2">Calculada em tempo real durante a auditoria. Se o cache da Cloudflare estiver funcionando ("quente"), este valor deve ser baixíssimo (20-50ms). Se estiver alto, significa que o HIT não está ocorrendo no Edge mais próximo.</p>
                </>
            );
            case 'status_cache': return (
                <>
                    <p>Auditoria global de <strong>Custo Zero</strong>.</p>
                    <p className='mt-2'>O sistema verifica se a Cloudflare possui o cache. Se <strong>NÃO</strong> possuir (MISS), a API aborta a chamada ao Mapbox para não gerar custos. A porcentagem mostra quantos imóveis estão sendo servidos "de graça" pelo cache da Cloudflare.</p>
                </>
            );
            case 'auditoria_individual': return (
                <>
                    <p>Ferramenta de diagnóstico cirúrgico.</p>
                    <p className='mt-2'>Permite testar um imóvel específico pelo Smart ID para ver se as coordenadas estão corretas e se as APIs de escolas, transporte e hospitais estão respondendo corretamente para aquela região.</p>
                </>
            );
            default: return null;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
            
            {/* MODAL DE AJUDA */}
            <HelpModal 
                isOpen={!!helpModalKey} 
                onClose={() => setHelpModalKey(null)}
                title="Entenda a Métrica"
                content={helpModalKey ? getHelpContent(helpModalKey) : null}
            />

            {/* MODAL DE DETALHES DA AUDITORIA */}
            <AuditDetailsModal 
                isOpen={showAuditModal} 
                onClose={() => setShowAuditModal(false)} 
                data={auditDetails} 
            />

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Painel Master <span className="text-sm font-normal text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-full ml-2 shadow-sm">Admin 2.0</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral da plataforma, usuários e infraestrutura.</p>
                </div>

                {/* BOTÃO PARA A CENTRAL DE AJUDA */}
                <Link 
                    href="/admin/ajuda" 
                    className="flex items-center px-4 py-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors font-medium text-sm"
                >
                    <Icon icon={faLifeRing} className="w-4 h-4 mr-2 text-red-500" />
                    Central de Ajuda & Manuais
                </Link>
            </div>

            {/* === LINHA 1: NEGÓCIO (KPIs Principais) === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Imóveis */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                        Imóveis
                    </h3>
                    <div className="mt-2 flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalImoveis}</span>
                        <span className="text-sm text-gray-500">cadastrados</span>
                    </div>
                    <div className="mt-4 w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.totalImoveis > 0 ? (stats.imoveisPublicados / stats.totalImoveis) * 100 : 0}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2"><strong className="text-blue-600">{stats.imoveisPublicados}</strong> publicados</p>
                </div>

                {/* Usuários */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Usuários</h3>
                    <div className="mt-2">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalUsuarios}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-1 text-center text-xs">
                        <div className='bg-purple-50 dark:bg-purple-900/20 p-1 rounded text-purple-700 dark:text-purple-300'><span className='block font-bold'>{stats.proprietarios}</span> Prop.</div>
                        <div className='bg-green-50 dark:bg-green-900/20 p-1 rounded text-green-700 dark:text-green-300'><span className='block font-bold'>{stats.inquilinos}</span> Inq.</div>
                        <div className='bg-orange-50 dark:bg-orange-900/20 p-1 rounded text-orange-700 dark:text-orange-300'><span className='block font-bold'>{stats.ambos}</span> Ambos</div>
                    </div>
                </div>

                {/* Financeiro */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Receita Potencial</h3>
                    <div className="mt-2">
                        <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">{formatMoney(stats.receitaEstimada)}</span>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit">
                        <Icon icon={faExclamationTriangle} className="mr-1" /> {stats.pendenciasFinanceiras} Alertas de Pagamento
                    </div>
                </div>

                {/* Status Geral */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 flex flex-col justify-between">
                     <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Estado do Sistema</h3>
                        <div className="mt-2 flex items-center space-x-2">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="font-bold text-green-600 text-lg">Operacional</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Todas as APIs e Banco de Dados respondendo.</p>
                </div>
            </div>

            {/* === LINHA 2: INFRAESTRUTURA & SAÚDE (NOVAS MÉTRICAS) === */}
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 pt-4 border-t border-gray-200 dark:border-zinc-700">
                Monitoramento de Infraestrutura
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Métrica 1: Saúde do Banco */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-lg border border-gray-200 dark:border-zinc-700 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                            <Icon icon={faDatabase} className="w-5 h-5" />
                        </div>
                        <CardHelpButton onClick={() => setHelpModalKey('db_health')} />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.dbResponseTime}ms</span>
                    <span className="text-xs text-gray-500 mt-1">Tempo de resposta do Banco</span>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${stats.dbResponseTime < 500 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(stats.dbResponseTime / 10, 100)}%` }}></div>
                    </div>
                </div>

                {/* Métrica 2: Integridade Geocoding */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-lg border border-gray-200 dark:border-zinc-700 flex flex-col">
                     <div className="flex justify-between items-start mb-2">
                        <div className={`p-2 rounded-lg ${stats.imoveisSemCoordenadas === 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <Icon icon={faMapMarkedAlt} className="w-5 h-5" />
                        </div>
                        <CardHelpButton onClick={() => setHelpModalKey('geocoding')} />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.imoveisSemCoordenadas}</span>
                    <span className="text-xs text-gray-500 mt-1">Imóveis sem coordenadas (Invisíveis)</span>
                    {stats.imoveisSemCoordenadas > 0 && <span className="text-[10px] text-red-500 font-bold mt-1">Ação necessária!</span>}
                </div>

                {/* Métrica 3: Volume de Storage */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-lg border border-gray-200 dark:border-zinc-700 flex flex-col">
                     <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30 dark:text-purple-400">
                            <Icon icon={faImages} className="w-5 h-5" />
                        </div>
                        <CardHelpButton onClick={() => setHelpModalKey('storage')} />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalFotos}</span>
                    <span className="text-xs text-gray-500 mt-1">Fotos hospedadas no total</span>
                </div>

                {/* Métrica 4: Latência Média (Resultado da Auditoria) */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-lg border border-gray-200 dark:border-zinc-700 flex flex-col relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2">
                        <div className={`p-2 rounded-lg transition-colors ${
                            cacheAudit.averageLatency === 0 ? 'bg-gray-100 text-gray-400' : 
                            cacheAudit.averageLatency < 100 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                            <Icon icon={faStopwatch} className="w-5 h-5" />
                        </div>
                        <CardHelpButton onClick={() => setHelpModalKey('latency')} />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">
                        {cacheAudit.averageLatency > 0 ? `${cacheAudit.averageLatency}ms` : '--'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Latência Média do Cache</span>
                    {cacheAudit.loading && <div className="absolute bottom-0 left-0 h-1 bg-orange-500 animate-progress w-full"></div>}
                </div>
            </div>

            {/* === LINHA 3: FERRAMENTAS DE CACHE === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Auditoria em Massa */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 relative overflow-hidden h-full">
                    <button 
                        onClick={() => setHelpModalKey('status_cache')}
                        className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 transition-colors z-10"
                    >
                        <Icon icon={faQuestionCircle} className="w-5 h-5" />
                    </button>

                    <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                        <Icon icon={faShieldAlt} className="w-20 h-20 text-orange-500" />
                    </div>
                    
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex justify-between items-start pr-8">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Status de Cache (Cloudflare)</h3>
                                    <div className="mt-2 flex items-center space-x-2">
                                        <span className={`text-4xl font-extrabold ${cachePercentage > 80 ? 'text-green-600' : cachePercentage > 50 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                            {cacheAudit.loading ? '...' : cacheAudit.completed ? `${cachePercentage}%` : '--'}
                                        </span>
                                        <span className="text-sm text-gray-500 max-w-[150px] leading-tight">HIT Rate (Economia)</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={runCacheAudit}
                                    disabled={cacheAudit.loading}
                                    className={`px-4 py-3 rounded-lg text-sm font-bold text-white shadow-md transition-all flex items-center ${
                                        cacheAudit.loading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-orange-600 hover:bg-orange-700 hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    {cacheAudit.loading ? (
                                        <><Icon icon={faSync} spin className="mr-2" /> Verificando...</>
                                    ) : (
                                        <><Icon icon={faChartLine} className="mr-2" /> Auditar Sem Custos</>
                                    )}
                                </button>
                            </div>

                            <div className="mt-8">
                                <div className="flex justify-between text-xs mb-1 font-medium text-gray-500">
                                    <span>Progresso da Verificação</span>
                                    <span>{cacheAudit.checked} / {cacheAudit.totalToCheck} Imóveis</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-gradient-to-r from-orange-500 to-yellow-400 h-4 transition-all duration-500 ease-out relative"
                                        style={{ width: `${cacheAudit.totalToCheck > 0 ? (cacheAudit.checked / cacheAudit.totalToCheck) * 100 : 0}%` }}
                                    >
                                        {cacheAudit.loading && <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/30 animate-pulse"></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer com resultado e botão de detalhes */}
                        <div className='mt-4 space-y-3'>
                            {cacheAudit.completed ? (
                                <>
                                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                                        <Icon icon={faCheckCircle} className="mr-2" />
                                        Auditoria concluída: {cacheAudit.hits} imóveis em Cache (HIT).
                                    </p>
                                    <button 
                                        onClick={() => setShowAuditModal(true)}
                                        className="w-full py-2 text-sm font-bold text-rentou-primary bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center"
                                    >
                                        <Icon icon={faList} className="mr-2" />
                                        Ver Relatório Detalhado
                                    </button>
                                </>
                            ) : (
                                <p className="text-xs text-gray-400 italic mt-4">
                                    Esta auditoria usa a técnica <strong>"Safe Miss"</strong> para economizar custos de API.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Auditoria Individual */}
                <div className="h-full relative">
                     <button 
                        onClick={() => setHelpModalKey('auditoria_individual')}
                        className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 transition-colors z-20"
                        style={{ marginTop: '5px', marginRight: '5px' }} 
                    >
                        <Icon icon={faQuestionCircle} className="w-5 h-5" />
                    </button>
                    <CacheInspector />
                </div>
            </div>
        </div>
    );
}
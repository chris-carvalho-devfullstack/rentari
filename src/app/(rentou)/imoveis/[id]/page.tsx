// src/app/(rentou)/imoveis/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchImovelPorId, removerImovel } from '@/services/ImovelService';
import { Imovel } from '@/types/imovel'; 

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

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


/**
 * @fileoverview Página de Visualização/Detalhes de um Imóvel (Hub de Gerenciamento).
 * ATUALIZADA: Exibe o smartId (ID de Negócio) em vez do id (Firestore ID).
 */
export default function ImovelDetalhePage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [imovel, setImovel] = useState<Imovel | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                const data = await fetchImovelPorId(id as string);
                setImovel(data || null); // CORREÇÃO APLICADA AQUI
            } catch (err: any) {
                console.error('Erro ao buscar imóvel:', err);
                setError(err.message || 'Falha ao carregar os dados do imóvel.');
            } finally {
                setLoading(false);
            }
        };

        loadImovel();
    }, [id]);
    
    // Função para lidar com a exclusão 
    const handleDelete = async () => {
        if (!id || !imovel) return;
        
        if (window.confirm(`Tem certeza que deseja remover permanentemente o imóvel "${imovel.titulo}"? Esta ação não pode ser desfeita.`)) {
            setIsDeleting(true);
            try {
                await removerImovel(id as string);
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

    // Conteúdo de Carregamento e Erro
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

    // Função auxiliar para renderizar blocos de dados
    const DataBlock: React.FC<{ label: string; value: string | number | React.ReactNode }> = ({ label, value }) => (
        <div className="p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <Link href="/imoveis" className="text-rentou-primary hover:underline font-medium text-sm">
                ← Voltar para Lista de Imóveis
            </Link>
            
            {/* Cabeçalho e Ações (Moderno e Centralizado) */}
            <div className="flex justify-between items-start border-b pb-4">
                <div>
                    {/* ID DE NEGÓCIO: Exibe o smartId de forma destacada */}
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 -mb-1">
                        ID: {imovel.smartId}
                    </p>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">{imovel.titulo}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{imovel.endereco}, {imovel.cidade}</p>
                    <div className="mt-2">
                        <StatusBadge status={imovel.status} />
                    </div>
                </div>
                
                <div className="flex space-x-3 mt-2 sm:mt-0">
                    <Link
                        // ESTE LINK AGORA APONTA PARA A ROTA DE EDIÇÃO QUE SERÁ CRIADA NO PRÓXIMO PASSO
                        href={`/imoveis/${id}/editar`}
                        className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-rentou-primary text-white hover:bg-blue-700"
                    >
                        Editar Informações
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            isDeleting 
                            ? 'bg-red-300 text-white cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                        {isDeleting ? 'Removendo...' : 'Excluir Imóvel'}
                    </button>
                </div>
            </div>

            {/* Seção 1: Identificação e Valores Financeiros */}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Visão Financeira</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ID INTELIGENTE (SMART ID) exibido no card principal */}
                <DataBlock 
                    label="ID do Imóvel" 
                    value={<span className="text-rentou-primary dark:text-blue-400">{imovel.smartId}</span>} 
                />
                <DataBlock 
                    label="Aluguel Mensal" 
                    value={<span className="text-green-600 dark:text-green-400">{formatCurrency(imovel.valorAluguel)}</span>} 
                />
                <DataBlock 
                    label="Condomínio Estimado" 
                    value={formatCurrency(imovel.valorCondominio)} 
                />
                <DataBlock 
                    label="IPTU Mensal Estimado" 
                    value={formatCurrency(imovel.valorIPTU)} 
                />
            </div>
            
            {/* Seção 2: Estrutura e Detalhes */}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 pt-4 border-t border-gray-200 dark:border-zinc-700">Detalhes do Imóvel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DataBlock label="Tipo" value={imovel.tipoDetalhado} />
                <DataBlock label="Quartos" value={imovel.quartos} />
                <DataBlock label="Banheiros" value={imovel.banheiros} />
                <DataBlock label="Vagas de Garagem" value={imovel.vagasGaragem} />
                <DataBlock label="Área Total (m²)" value={imovel.areaTotal} />
                <DataBlock label="Área Útil (m²)" value={imovel.areaUtil} />
                {imovel.categoriaPrincipal === 'Residencial' && imovel.tipoDetalhado.includes('Apartamento') && <DataBlock label="Andar" value={imovel.andar || 'Térreo/Não Aplicável'} />}
                <DataBlock label="Aceita Animais?" value={imovel.aceitaAnimais ? 'Sim' : 'Não'} />
            </div>
            
            {/* Seção 3: Descrição e Comodidades */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="xl:col-span-2 space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Descrição Detalhada</h2>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{imovel.descricaoLonga || 'Nenhuma descrição longa fornecida.'}</p>
                    
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-6">Atrativos/Mídia</h3>
                    <div className="flex flex-wrap gap-2">
                        {imovel.caracteristicas.map(c => (
                            <span key={c} className="px-3 py-1 bg-rentou-primary/10 text-rentou-primary rounded-full text-sm font-medium dark:bg-blue-900/50 dark:text-blue-300">
                                {c}
                            </span>
                        ))}
                        {imovel.linkVideoTour && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium dark:bg-green-900/50 dark:text-green-300">
                                Vídeo Tour (Link)
                            </span>
                        )}
                        {imovel.visitaVirtual360 && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium dark:bg-purple-900/50 dark:text-purple-300">
                                Visita 360º
                            </span>
                        )}
                    </div>
                </div>

                {/* Seção 4: Galeria (Placeholder Atração) */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Galeria de Fotos ({imovel.fotos.length})</h3>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
                        <p className="text-center text-gray-500 dark:text-gray-400">
                            Imagens em alta resolução serão carregadas aqui.
                        </p>
                    </div>
                    <div className="text-center mt-3">
                        <button className="text-sm font-medium text-rentou-primary hover:text-blue-700">
                            Ver Mídia Completa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
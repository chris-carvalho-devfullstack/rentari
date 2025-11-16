// src/components/imoveis/FormularioImovel.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adicionarNovoImovel, atualizarImovel } from '@/services/ImovelService'; 
import { Imovel, ImovelCategoria, ImovelFinalidade, NovoImovelData } from '@/types/imovel'; 
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy'; 
import { useAuthStore } from '@/hooks/useAuthStore';
import { Icon } from '@/components/ui/Icon'; // Importar Icon Componente
import { faSave, faChevronRight, faChevronLeft, faCheckCircle, faImage } from '@fortawesome/free-solid-svg-icons';

interface FormularioImovelProps {
    initialData?: Imovel;
}

// Define os passos do formulário (agora com nomes mais limpos)
const formSteps = [
    { id: 1, name: 'Classificação' },
    { id: 2, name: 'Estrutura' },
    { id: 3, name: 'Valores' },
    { id: 4, name: 'Mídia & Detalhes' },
];

const defaultFormData: NovoImovelData = {
    titulo: '',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Locação Residencial'], // Default para Locação
    endereco: '',
    cidade: '',
    quartos: 1,
    banheiros: 1,
    vagasGaragem: 0,
    areaTotal: 0, 
    areaUtil: 0, 
    descricaoLonga: '',
    caracteristicas: [], 
    aceitaAnimais: false,
    andar: 1,
    status: 'VAGO',
    valorAluguel: 0, 
    valorCondominio: 0,
    valorIPTU: 0,
    dataDisponibilidade: new Date().toISOString().split('T')[0],
    fotos: [], 
    linkVideoTour: undefined,
    visitaVirtual360: false,
};

// ... Funções Auxiliares (isNumericField, getInitialState) - MANTIDAS SEM ALTERAÇÃO ...

const isNumericField = (name: string): boolean => 
    ['quartos', 'banheiros', 'vagasGaragem', 'areaTotal', 'areaUtil', 
     'valorAluguel', 'valorCondominio', 'valorIPTU', 'andar'].includes(name);

const getInitialState = (initialData?: Imovel) => {
    const initialDataPayload = initialData ? Object.keys(defaultFormData).reduce((acc, key) => {
        if (key in initialData) {
            (acc as any)[key] = (initialData as any)[key];
        }
        return acc;
    }, {}) : {};

    const initialFormData = {
        ...defaultFormData, 
        ...initialDataPayload as Partial<NovoImovelData>,
        categoriaPrincipal: initialData?.categoriaPrincipal || defaultFormData.categoriaPrincipal,
        tipoDetalhado: initialData?.tipoDetalhado || defaultFormData.tipoDetalhado,
        finalidades: initialData?.finalidades || defaultFormData.finalidades,
        dataDisponibilidade: initialData?.dataDisponibilidade || defaultFormData.dataDisponibilidade,
        andar: initialData?.andar || 0,
    };

    const initialLocalInputs: Record<string, string> = {};
    Object.keys(initialFormData).filter(isNumericField).forEach(keyString => {
        const numericValue = (initialFormData as any)[keyString] as number;
        initialLocalInputs[keyString] = String(numericValue === 0 ? '' : numericValue);
    });
    
    return { initialFormData, initialLocalInputs };
};


/**
 * @fileoverview Formulário multi-step (inteligente) para a criação e edição de imóveis.
 */
export default function FormularioImovel({ initialData }: FormularioImovelProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const isEditing = !!initialData;
    const formTitle = isEditing ? 'Editar Imóvel Existente' : 'Adicionar Novo Imóvel';
    
    const { initialFormData, initialLocalInputs } = useMemo(() => getInitialState(initialData), [initialData]);

    const [localNumericInputs, setLocalNumericInputs] = useState<Record<string, string>>(initialLocalInputs);
    const [formData, setFormData] = useState<NovoImovelData>(initialFormData);

    const tiposDisponiveis = useMemo(() => {
        return IMÓVEIS_HIERARQUIA.find(c => c.categoria === formData.categoriaPrincipal)?.tipos || [];
    }, [formData.categoriaPrincipal]);
    
    const finalidadesDisponiveis = useMemo(() => {
        const tipo = tiposDisponiveis.find(t => formData.tipoDetalhado.startsWith(t.nome));
        return tipo?.finalidade || [];
    }, [formData.tipoDetalhado, tiposDisponiveis]);

    useEffect(() => {
        const firstTipo = tiposDisponiveis[0];
        if (firstTipo) {
            const defaultTipoDetalhado = firstTipo.subtipos ? `${firstTipo.nome} - ${firstTipo.subtipos[0]}` : firstTipo.nome;
            
            setFormData(prevData => ({
                ...prevData,
                tipoDetalhado: defaultTipoDetalhado,
                finalidades: prevData.finalidades.filter(f => firstTipo.finalidade.includes(f)).length > 0
                    ? prevData.finalidades.filter(f => firstTipo.finalidade.includes(f))
                    : [firstTipo.finalidade[0] || 'Locação Residencial'], // Garante pelo menos uma finalidade
            }));
        }
    }, [formData.categoriaPrincipal, tiposDisponiveis]); 

    // --- Lógica de Manipulação de Inputs (Mantida a correção de Numéricos) ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const target = e.target;

        if (isNumericField(name)) {
            setLocalNumericInputs(prev => ({ ...prev, [name]: value }));
            return; 
        }
        
        setFormData((prevData: NovoImovelData) => ({
            ...prevData,
            [name]: (type === 'checkbox') ? (target as HTMLInputElement).checked : value,
        }));
    }, []); 

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (isNumericField(name)) {
            const cleanedValue = value.replace(',', '.');
            const numericValue = parseFloat(cleanedValue) || 0; 

            setFormData(prevData => ({
                ...prevData,
                [name]: numericValue,
            }));
            
            setLocalNumericInputs(prev => ({
                ...prev,
                [name]: String(numericValue === 0 ? '' : numericValue)
            }));
        }
    }, []);

    const handleFinalidadeChange = useCallback((finalidade: ImovelFinalidade) => {
        setFormData((prevData: NovoImovelData) => {
            const isSelected = prevData.finalidades.includes(finalidade);
            let newFinalidades;
            
            if (isSelected) {
                newFinalidades = prevData.finalidades.filter(f => f !== finalidade);
            } else {
                newFinalidades = [...prevData.finalidades, finalidade];
            }
            
            // Requisito de Negócio: Não pode ter 0 finalidades
            if (newFinalidades.length === 0) {
                 setError("Selecione pelo menos uma finalidade para o imóvel.");
                 return prevData;
            }
            setError(null);
            
            return { ...prevData, finalidades: newFinalidades };
        });
    }, []);

    const handleCaracteristicaChange = useCallback((caracteristica: string) => {
        setFormData((prevData: NovoImovelData) => {
            const isSelected = prevData.caracteristicas.includes(caracteristica);
            return {
                ...prevData,
                caracteristicas: isSelected
                    ? prevData.caracteristicas.filter(c => c !== caracteristica) 
                    : [...prevData.caracteristicas, caracteristica], 
            };
        });
    }, []);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault(); 
        setError(null);
        
        // Validação Mínima da Etapa 1
        if (currentStep === 1 && formData.finalidades.length === 0) {
            setError("Selecione pelo menos uma finalidade para o imóvel.");
            return;
        }

        // Consolidação de Valores no Blur (se necessário)
        const numericFieldsToConsolidate: string[] = ['areaTotal', 'areaUtil', 'valorAluguel', 'valorCondominio', 'valorIPTU'];
        if (currentStep === 2) {
             numericFieldsToConsolidate.push('quartos', 'banheiros', 'vagasGaragem', 'andar');
        }
        
        numericFieldsToConsolidate.forEach(name => {
            const value = localNumericInputs[name];
            if (value !== undefined) {
                const cleanedValue = value.replace(',', '.');
                const numericValue = parseFloat(cleanedValue) || 0; 
                setFormData(prevData => ({ ...prevData, [name]: numericValue }));
                setLocalNumericInputs(prev => ({ ...prev, [name]: String(numericValue === 0 ? '' : numericValue) }));
            }
        });

        if (currentStep < formSteps.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0); 
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!user || !user.id) {
            setError('Erro de autenticação. Proprietário não identificado. Tente relogar.');
            setLoading(false);
            return;
        }
        const proprietarioId = user.id;
        
        try {
            let finalFormData: NovoImovelData = { ...formData };
            
            // Consolidação final (Garantia para campos monetários/numéricos)
            const finalNumericFields = ['valorAluguel', 'valorCondominio', 'valorIPTU', 'quartos', 'banheiros', 'vagasGaragem', 'areaTotal', 'areaUtil', 'andar'];
            finalNumericFields.forEach(name => {
                const value = localNumericInputs[name];
                if (value !== undefined) {
                    const numericValue = parseFloat(value.replace(',', '.')) || 0; 
                    (finalFormData as any)[name] = numericValue;
                }
            });

            if (finalFormData.valorAluguel < 0 || isNaN(finalFormData.valorAluguel)) {
                throw new Error('O valor do aluguel deve ser um número válido.');
            }

            let result: Imovel;
            
            if (isEditing && initialData) {
                result = await atualizarImovel(initialData.id, finalFormData);
            } else {
                result = await adicionarNovoImovel(finalFormData, proprietarioId);
            }
            
            router.push(`/imoveis/${result.id}`); 

        } catch (err: any) {
            console.error('Erro na operação de imóvel:', err);
            setError(`Falha ao ${isEditing ? 'atualizar' : 'adicionar'} o imóvel. Detalhe: ${err.message || 'Erro desconhecido.'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Componente: ProgressIndicator (NOVO DESIGN, SEM PORCENTAGEM EXTERNA) ---
    const ProgressIndicator = () => {
        // Calcula a porcentagem do progresso (0% na etapa 1, 100% na etapa 4)
        const percentage = formSteps.length > 1 ? Math.round(((currentStep - 1) / (formSteps.length - 1)) * 100) : 100;

        return (
            <div className="space-y-4 mb-8">
                {/* 1. Indicadores Visuais de Etapa */}
                <div className="flex justify-between items-center relative">
                    {/* Linha de Conexão (Fundo) */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-zinc-700 -z-10 transform -translate-y-1/2 mx-5">
                         {/* Linha de Conexão (Progresso) */}
                         <div 
                            className="h-full bg-rentou-primary dark:bg-blue-600 transition-all duration-500 ease-out" 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    
                    {formSteps.map((step, index) => {
                        const isCompleted = index + 1 < currentStep;
                        const isActive = index + 1 === currentStep;

                        return (
                            <div 
                                key={step.id} 
                                className={`flex flex-col items-center z-10 transition-transform duration-300 ${isActive ? 'scale-105' : 'scale-100'} w-1/4`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 shadow-lg ${
                                    isCompleted ? 'bg-green-500' : 
                                    isActive ? 'bg-rentou-primary dark:bg-blue-600 border-4 border-white dark:border-zinc-800' : 
                                    'bg-gray-300 dark:bg-zinc-600'
                                }`}>
                                    {isCompleted ? <Icon icon={faCheckCircle} className="w-5 h-5" /> : step.id}
                                </div>
                                <span className={`text-xs mt-2 text-center max-w-full font-semibold transition-colors ${
                                    isActive ? 'text-rentou-primary dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {step.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
                
                {/* 2. Barra de Progresso com Porcentagem (AGORA SÓ A BARRA VISUAL) */}
                <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full relative mt-4">
                     {/* Barra de Progresso, que ainda mostra o visual de 0% a 100% */}
                     <div 
                        className="h-full bg-rentou-primary dark:bg-blue-600 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%` }}
                    >
                         {/* Opcional: Adicionar a porcentagem dentro da barra se ela fosse mais alta (h-8) */}
                         {/* Se a barra fosse maior, poderíamos usar: */}
                         {/* <span className="absolute right-0 text-white text-xs font-bold mr-1"> {percentage}% </span> */}
                    </div>
                </div>
            </div>
        );
    };
    // FIM Progress Indicator

    // --- Componentes Auxiliares (mantidos limpos e funcionais) ---
    const renderNumericInput = (name: string, label: string, currentValue: number, placeholder?: string) => {
        const getDisplayValue = (name: string, currentValue: number) => {
            const localValue = localNumericInputs[name];
            return localValue !== undefined ? localValue : (currentValue === 0 ? '' : String(currentValue));
        };
        
        return (
            <div>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <input
                    id={name}
                    name={name}
                    type="text" 
                    required
                    value={getDisplayValue(name, currentValue)}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                />
            </div>
        );
    };

    const CheckboxInput: React.FC<{ label: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; description?: string; }> = ({ label, name, checked, onChange, description }) => (
        <div className="flex items-center space-x-3 bg-gray-50 dark:bg-zinc-700 p-4 rounded-lg border border-gray-200 dark:border-zinc-600">
            <input
                id={name}
                name={name}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-4 w-4 text-rentou-primary border-gray-300 rounded focus:ring-rentou-primary"
            />
            <div className="flex flex-col">
                <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
        </div>
    );
    
    const ComodidadesSelector: React.FC<{ selected: string[]; onSelect: (caracteristica: string) => void }> = ({ selected, onSelect }) => {
        const availableFeatures = ['Piscina', 'Churrasqueira', 'Academia', 'Portaria 24h', 'Mobiliado', 'Aquecimento a Gás', 'Salão de Festas', 'Quintal/Jardim', 'Elevador', 'Acessibilidade'];
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comodidades/Atrativos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableFeatures.map((feature) => (
                        <button
                            key={feature}
                            type="button" 
                            onClick={() => onSelect(feature)}
                            className={`py-2 px-4 text-sm font-medium rounded-full transition-all duration-150 border ${
                                selected.includes(feature)
                                    ? 'bg-rentou-primary text-white border-rentou-primary shadow-md' // Selected: Fundo primário, Texto branco
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-600 dark:hover:bg-zinc-700' // Unselected
                            }`}
                        >
                            {feature}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // --- Renderização de Conteúdo por Etapa (Melhorias de Layout/Grid) ---
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">1. Classificação e Localização</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Categoria Principal */}
                            <div>
                                <label htmlFor="categoriaPrincipal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria Principal</label>
                                <select
                                    id="categoriaPrincipal"
                                    name="categoriaPrincipal"
                                    required
                                    value={formData.categoriaPrincipal}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                >
                                    {IMÓVEIS_HIERARQUIA.map(c => (
                                        <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tipo Detalhado (Cascata) */}
                            <div>
                                <label htmlFor="tipoDetalhado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo e Subtipo Detalhado</label>
                                <select
                                    id="tipoDetalhado"
                                    name="tipoDetalhado"
                                    required
                                    value={formData.tipoDetalhado}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                >
                                    {tiposDisponiveis.flatMap(tipo => 
                                        tipo.subtipos ? tipo.subtipos.map(sub => (
                                            <option key={`${tipo.nome} - ${sub}`} value={`${tipo.nome} - ${sub}`}>{`${tipo.nome} - ${sub}`}</option>
                                        )) : (
                                            <option key={tipo.nome} value={tipo.nome}>{tipo.nome}</option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Seleção de Múltiplas Finalidades (Tags/Botões) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Finalidade do Imóvel (Múltipla Seleção)</label>
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600">
                                {finalidadesDisponiveis.map((finalidade) => (
                                    <button
                                        key={finalidade}
                                        type="button" 
                                        onClick={() => handleFinalidadeChange(finalidade as ImovelFinalidade)}
                                        className={`py-2 px-4 text-sm font-medium rounded-full transition-all duration-150 border ${
                                            formData.finalidades.includes(finalidade as ImovelFinalidade)
                                                ? 'bg-rentou-primary text-white border-rentou-primary shadow-md'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-600 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {finalidade}
                                    </button>
                                ))}
                            </div>
                             {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                        </div>

                        {/* Informações de Anúncio e Localização */}
                        <div>
                            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Anúncio (Destaque)</label>
                            <input
                                id="titulo"
                                name="titulo"
                                type="text"
                                required
                                placeholder="Ex: Apartamento de Luxo (Vista para o Mar)"
                                value={formData.titulo}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço Completo</label>
                                <input
                                    id="endereco"
                                    name="endereco"
                                    type="text"
                                    required
                                    placeholder="Rua, Número, Bairro, CEP"
                                    value={formData.endereco}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade e UF</label>
                                <input
                                    id="cidade"
                                    name="cidade"
                                    type="text"
                                    required
                                    placeholder="Ex: São Paulo, SP"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">2. Estrutura e Características</h3>
                        
                        {/* Linha: Quartos, Banheiros, Vagas, Andar (Condicional) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {renderNumericInput("quartos", "Quartos", formData.quartos)}
                            {renderNumericInput("banheiros", "Banheiros", formData.banheiros)}
                            {renderNumericInput("vagasGaragem", "Vagas Garagem", formData.vagasGaragem)}
                            {formData.categoriaPrincipal === 'Residencial' && formData.tipoDetalhado.includes('Apartamento') ? (
                                renderNumericInput("andar", "Andar", formData.andar || 0, "Ex: 5")
                            ) : (
                                <div className='hidden md:block'></div> // Placeholder em grid para manter o alinhamento
                            )}
                        </div>

                        {/* Linha: Áreas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                            {renderNumericInput("areaTotal", "Área Total (m²)", formData.areaTotal)}
                            {renderNumericInput("areaUtil", "Área Útil (m²)", formData.areaUtil)}
                        </div>
                        
                        {/* Seletor de Comodidades */}
                        <div className='pt-4 border-t border-gray-100 dark:border-zinc-700'>
                            <ComodidadesSelector selected={formData.caracteristicas} onSelect={handleCaracteristicaChange} />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">3. Valores e Contrato</h3>
                        
                        {/* Linha: Valor Aluguel e Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderNumericInput("valorAluguel", "Valor do Aluguel (R$)", formData.valorAluguel, "3500.00")}
                            
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status do Imóvel</label>
                                <select
                                    id="status"
                                    name="status"
                                    required
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                >
                                    <option value="VAGO">VAGO (Pronto para anunciar)</option>
                                    <option value="ANUNCIADO">ANUNCIADO (Aguardando locação)</option>
                                    <option value="ALUGADO">ALUGADO (Já locado)</option>
                                    <option value="MANUTENCAO">MANUTENÇÃO (Indisponível)</option>
                                </select>
                            </div>
                        </div>

                        {/* Linha: Condomínio e IPTU */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderNumericInput("valorCondominio", "Valor Condomínio (R$)", formData.valorCondominio, "0.00")}
                            {renderNumericInput("valorIPTU", "Valor IPTU (Mensal R$)", formData.valorIPTU, "0.00")}
                        </div>
                        
                        {/* Campo Data de Disponibilidade */}
                        <div>
                            <label htmlFor="dataDisponibilidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disponível a partir de</label>
                            <input
                                id="dataDisponibilidade"
                                name="dataDisponibilidade"
                                type="date"
                                required
                                value={formData.dataDisponibilidade}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                            />
                        </div>
                        
                        <CheckboxInput 
                            label="Aceita Animais?" 
                            name="aceitaAnimais" 
                            checked={formData.aceitaAnimais} 
                            onChange={handleChange} 
                            description="Marque se a locação permite animais de estimação."
                        />
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">4. Mídia e Detalhes do Anúncio</h3>
                        
                        {/* Campo Descrição Longa */}
                        <div>
                            <label htmlFor="descricaoLonga" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição Detalhada para Anúncio</label>
                            <textarea
                                id="descricaoLonga"
                                name="descricaoLonga"
                                rows={4}
                                required
                                value={formData.descricaoLonga}
                                onChange={handleChange}
                                placeholder="Descreva o imóvel em detalhes, destacando os pontos fortes e a vizinhança."
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                            />
                        </div>

                        {/* Mídia (Links e Checkbox) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                             <div>
                                <label htmlFor="linkVideoTour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link do Vídeo Tour (Opcional)</label>
                                <input
                                    id="linkVideoTour"
                                    name="linkVideoTour"
                                    type="url"
                                    value={formData.linkVideoTour || ''}
                                    onChange={handleChange}
                                    placeholder="Ex: https://youtube.com/watch?v=tour"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                />
                            </div>
                             <CheckboxInput 
                                label="Visita Virtual 360º Disponível" 
                                name="visitaVirtual360" 
                                checked={formData.visitaVirtual360} 
                                onChange={handleChange} 
                                description="Marque se você possui um link para tour virtual 360º."
                            />
                        </div>
                        
                        {/* Upload de Fotos (Mocked - Aprimorado) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Galeria de Fotos (Mock)</label>
                            <div className="mt-1 p-6 border-2 border-dashed border-gray-400 dark:border-zinc-600 rounded-xl text-center bg-gray-50 dark:bg-zinc-700/50">
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    <Icon icon={faImage} className="inline-block w-5 h-5 mr-2 text-rentou-primary/70" />
                                    Funcionalidade de upload (Cloud Storage) será implementada na fase 2.
                                </p>
                                <p className="text-sm mt-2 text-rentou-primary">
                                    Atualmente: {formData.fotos.length} fotos mockadas.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    // --- FIM Renderização de Conteúdo por Etapa ---


    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b pb-4">
                {formTitle}
            </h2>
            
            {/* Indicador de Progresso (Novo Design) */}
            <ProgressIndicator />

            {error && (
                <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
                    {error}
                </p>
            )}

            <form onSubmit={currentStep === formSteps.length ? handleSubmit : handleNextStep} className="space-y-8">
                
                {renderStepContent()}

                {/* --- Navigation Buttons --- */}
                <div className="pt-6 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                    
                    {/* Botão Voltar */}
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-rentou-primary transition-colors font-medium cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
                        >
                             <Icon icon={faChevronLeft} className="w-3 h-3 mr-2" />
                            Anterior
                        </button>
                    )}
                    
                    <div className={currentStep === 1 ? 'flex-1' : 'flex-grow'}></div> {/* Espaçador */}

                    {/* Botão Próximo/Salvar */}
                    <button
                        type={currentStep === formSteps.length ? 'submit' : 'button'}
                        onClick={currentStep < formSteps.length ? handleNextStep : undefined} 
                        disabled={loading}
                        className={`flex justify-center py-2 px-6 border border-transparent rounded-md shadow-lg text-sm font-medium text-white transition-colors cursor-pointer ${
                            loading 
                                ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                                : 'bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600'
                        }`}
                    >
                        {loading 
                            ? (isEditing ? 'Salvando...' : 'Adicionando...') 
                            : (currentStep === formSteps.length ? 'Salvar Imóvel' : <>Próxima Etapa <Icon icon={faChevronRight} className="w-3 h-3 ml-2" /></>)}
                    </button>
                </div>
                
                {/* Botão de Cancelar */}
                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={() => router.push('/imoveis')}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium cursor-pointer transition-colors"
                    >
                        Cancelar
                    </button>
                </div>

            </form>
        </div>
    );
}
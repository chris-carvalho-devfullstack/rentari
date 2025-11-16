// src/components/imoveis/FormularioImovel.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adicionarNovoImovel, atualizarImovel } from '@/services/ImovelService'; 
// ATUALIZADO: Importar novos tipos de endereço e condomínio
import { Imovel, ImovelCategoria, ImovelFinalidade, NovoImovelData, EnderecoImovel, CondominioData } from '@/types/imovel'; 
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy'; 
import { useAuthStore } from '@/hooks/useAuthStore';
// Importação do serviço de CEP
import { fetchAddressByCep, CepData } from '@/services/CepService'; 
import { Icon } from '@/components/ui/Icon'; // Importar Icon Componente
import { faSave, faChevronRight, faChevronLeft, faCheckCircle, faImage, faHome } from '@fortawesome/free-solid-svg-icons'; // Adicionado faHome

interface FormularioImovelProps {
    initialData?: Imovel;
}

// Define os passos do formulário
const formSteps = [
    { id: 1, name: 'Classificação' },
    { id: 2, name: 'Estrutura' },
    { id: 3, name: 'Valores' },
    { id: 4, name: 'Mídia & Detalhes' },
];

// NOVO: Estruturas default aninhadas
const defaultEndereco: EnderecoImovel = {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil', // Default País
};

const defaultCondominio: CondominioData = {
    possuiCondominio: false,
    nomeCondominio: '',
    portaria24h: false,
    areaLazer: false,
};

const defaultFormData: NovoImovelData = {
    titulo: '',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Locação Residencial'], 
    endereco: defaultEndereco, // Novo objeto
    condominio: defaultCondominio, // Novo objeto
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

const isNumericField = (name: string): boolean => 
    ['quartos', 'banheiros', 'vagasGaragem', 'areaTotal', 'areaUtil', 
     'valorAluguel', 'valorCondominio', 'valorIPTU', 'andar'].includes(name);

// ATUALIZADO: Inicia o estado com a nova estrutura aninhada
const getInitialState = (initialData?: Imovel) => {
    // Mescla o initialData com o defaultFormData para garantir a estrutura completa
    const initialDataPayload: Partial<NovoImovelData> = initialData 
        ? Object.keys(defaultFormData).reduce((acc, key) => {
            const prop = key as keyof NovoImovelData;
            if (initialData[prop] !== undefined) {
                 (acc as any)[prop] = (initialData as any)[prop];
            }
            return acc;
        }, {} as Partial<NovoImovelData>) 
        : {};

    const initialFormData = {
        ...defaultFormData,
        ...initialDataPayload,
        // Garante que os objetos aninhados sejam mesclados corretamente, preenchendo defaults
        endereco: { ...defaultEndereco, ...(initialData?.endereco || {}) },
        condominio: { ...defaultCondominio, ...(initialData?.condominio || {}) },
        categoriaPrincipal: initialData?.categoriaPrincipal || defaultFormData.categoriaPrincipal,
        tipoDetalhado: initialData?.tipoDetalhado || defaultFormData.tipoDetalhado,
        finalidades: initialData?.finalidades || defaultFormData.finalidades,
        dataDisponibilidade: initialData?.dataDisponibilidade || defaultFormData.dataDisponibilidade,
        andar: initialData?.andar || 0,
    } as NovoImovelData;

    const initialLocalInputs: Record<string, string> = {};
    
    // Adiciona o campo CEP para gerenciar o input formatado localmente
    // Usa o valor limpo do endereco.cep para formatar se existir
    initialLocalInputs['endereco.cep'] = initialFormData.endereco.cep ? initialFormData.endereco.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : ''; 
    
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
            
            setFormData(prevData => {
                
                const keptFinalidades = prevData.finalidades.filter(
                    f => firstTipo.finalidade.includes(f as ImovelFinalidade)
                );

                let finalArray: ImovelFinalidade[];
                
                if (keptFinalidades.length > 0) {
                    finalArray = keptFinalidades as ImovelFinalidade[]; 
                } else {
                    const defaultFinalidade = firstTipo.finalidade[0] || 'Locação Residencial';
                    finalArray = [defaultFinalidade as ImovelFinalidade];
                }
                
                return {
                    ...prevData,
                    tipoDetalhado: defaultTipoDetalhado,
                    finalidades: finalArray,
                };
            });
        }
    }, [formData.categoriaPrincipal, tiposDisponiveis]); 

    // --- Lógica de Manipulação de Inputs (Incluindo formatação de CEP e aninhamento) ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const target = e.target;
        const isCheckbox = type === 'checkbox';
        
        // 1. Lida com campos aninhados (Ex: endereco.cep, condominio.possuiCondominio)
        if (name.includes('.') || (isCheckbox && name.startsWith('condominio.'))) {
            const [parent, child] = name.split('.');
            const parentKey = parent as keyof NovoImovelData;
            
            // Tratamento especial para o CEP (formatação e armazenamento local)
            if (name === 'endereco.cep') {
                let cleanedValue = value.replace(/\D/g, '').slice(0, 8); // Limita a 8 dígitos (CEP)
                let formattedValue = cleanedValue;
                
                if (cleanedValue.length > 5) {
                    formattedValue = `${cleanedValue.slice(0, 5)}-${cleanedValue.slice(5)}`;
                }

                setLocalNumericInputs(prev => ({ ...prev, [name]: formattedValue }));
                // O valor limpo será salvo no formData no blur ou submit
                setFormData(prevData => ({
                    ...prevData,
                    endereco: { ...prevData.endereco, cep: cleanedValue },
                }));
                return;
            }
            
            // Tratamento para Checkboxes aninhados (Ex: condominio.possuiCondominio)
            if (isCheckbox && parentKey === 'condominio') {
                setFormData(prevData => ({
                    ...prevData,
                    condominio: { ...prevData.condominio, [child || parent]: (target as HTMLInputElement).checked },
                }));
                return;
            }

            // Tratamento para outros campos aninhados de texto/select
            if (parentKey === 'endereco') {
                setFormData(prevData => ({
                    ...prevData,
                    endereco: { ...prevData.endereco, [child]: value },
                }));
            } else if (parentKey === 'condominio') {
                // Para campos de texto/select dentro de CondominioData
                setFormData(prevData => ({
                    ...prevData,
                    condominio: { ...prevData.condominio, [child]: value },
                }));
            }
            return;
        }

        // 2. Lida com campos no primeiro nível (Ex: titulo, quartos, status)
        if (isNumericField(name)) {
            setLocalNumericInputs(prev => ({ ...prev, [name]: value }));
            return;
        }
        
        setFormData((prevData: NovoImovelData) => ({
            ...prevData,
            [name]: isCheckbox ? (target as HTMLInputElement).checked : value,
        }));
    }, []); 

    // Lógica para consolidar campos numéricos ao perder o foco
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

    // --- FUNÇÃO PARA BUSCAR ENDEREÇO POR CEP ---
    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanCep = value.replace(/\D/g, '');
        
        // Salva o CEP limpo no formData
        setFormData(prevData => ({
            ...prevData,
            endereco: { ...prevData.endereco, cep: cleanCep },
        }));
        
        if (cleanCep.length === 8) {
            setLoading(true);
            setError(null);

            try {
                const addressData = await fetchAddressByCep(cleanCep); 

                if (addressData) {
                    // Preenche todos os campos de endereço
                    setFormData(prevData => ({
                        ...prevData,
                        endereco: { 
                            ...prevData.endereco, 
                            logradouro: addressData.logradouro,
                            bairro: addressData.bairro,
                            cidade: addressData.localidade,
                            estado: addressData.uf,
                            // Mantém número/complemento/país
                        },
                    }));
                    
                    setError(`CEP ${localNumericInputs['endereco.cep']} encontrado! Logradouro, Bairro, Cidade/UF preenchidos automaticamente. Não se esqueça de adicionar o NÚMERO!`);
                    
                } else {
                    setError('CEP não encontrado ou inválido. Digite o endereço manualmente.');
                }
            } catch (err) {
                setError('Erro ao se comunicar com o serviço de CEP.');
            } finally {
                setLoading(false);
            }
        } else if (cleanCep.length > 0 && cleanCep.length < 8) {
             setError('O CEP deve ter 8 dígitos.');
        } else {
             setError(null);
        }
    };
    // --- FIM FUNÇÃO CEP ---


    const handleFinalidadeChange = useCallback((finalidade: ImovelFinalidade) => {
        setFormData((prevData: NovoImovelData) => {
            const isSelected = prevData.finalidades.includes(finalidade);
            let newFinalidades;
            
            if (isSelected) {
                newFinalidades = prevData.finalidades.filter(f => f !== finalidade);
            } else {
                newFinalidades = [...prevData.finalidades, finalidade];
            }
            
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
        if (currentStep === 1) {
            // Verifica campos de endereço obrigatórios
            const { endereco } = formData;
            if (!endereco.logradouro || !endereco.numero || endereco.cep.replace(/\D/g, '').length !== 8 || !endereco.bairro || !endereco.cidade || !endereco.estado || !endereco.pais) {
                 setError("Preencha todos os campos obrigatórios do endereço (CEP, Logradouro, Número, Bairro, Cidade, Estado, País) antes de prosseguir.");
                 return;
            }
            if (formData.finalidades.length === 0) {
                setError("Selecione pelo menos uma finalidade para o imóvel.");
                return;
            }
        }

        // Consolidação de Valores Numéricos
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

    const ProgressIndicator = () => {
        const percentage = formSteps.length > 1 ? Math.round(((currentStep - 1) / (formSteps.length - 1)) * 100) : 100;

        return (
            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-zinc-700 -z-10 transform -translate-y-1/2 mx-5">
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
                
                <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full relative mt-4">
                     <div 
                        className="h-full bg-rentou-primary dark:bg-blue-600 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%` }}
                    >
                    </div>
                </div>
            </div>
        );
    };

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

                        {/* --- NOVO: SEÇÃO ENDEREÇO DETALHADO --- */}
                        <div className='space-y-4 p-4 border rounded-lg border-gray-200 dark:border-zinc-700'>
                             <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center mb-3">
                                <Icon icon={faHome} className="w-4 h-4 mr-2" /> Endereço Completo
                            </h4>
                            
                            {/* CEP (Primeira Opção e Busca) */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1">
                                    <label htmlFor="endereco.cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        CEP
                                    </label>
                                    <input
                                        id="endereco.cep"
                                        name="endereco.cep"
                                        type="text"
                                        value={localNumericInputs['endereco.cep'] || ''} // Valor formatado
                                        onChange={handleChange}
                                        onBlur={handleCepBlur}
                                        required
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                        disabled={loading}
                                    />
                                </div>
                                {/* Logradouro (Expande para o resto da linha) */}
                                <div className="md:col-span-3">
                                    <label htmlFor="endereco.logradouro" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logradouro (Rua, Av.)</label>
                                    <input
                                        id="endereco.logradouro"
                                        name="endereco.logradouro"
                                        type="text"
                                        required
                                        value={formData.endereco.logradouro}
                                        onChange={handleChange}
                                        placeholder="Preenchido pelo CEP"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                {/* Número */}
                                <div>
                                    <label htmlFor="endereco.numero" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número</label>
                                    <input
                                        id="endereco.numero"
                                        name="endereco.numero"
                                        type="text"
                                        required
                                        value={formData.endereco.numero}
                                        onChange={handleChange}
                                        placeholder="Ex: 123"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                    />
                                </div>
                                {/* Complemento */}
                                <div>
                                    <label htmlFor="endereco.complemento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Complemento (Opcional)</label>
                                    <input
                                        id="endereco.complemento"
                                        name="endereco.complemento"
                                        type="text"
                                        value={formData.endereco.complemento || ''}
                                        onChange={handleChange}
                                        placeholder="Ex: Apartamento 401"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                    />
                                </div>
                                {/* Bairro */}
                                <div className="col-span-2">
                                    <label htmlFor="endereco.bairro" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bairro</label>
                                    <input
                                        id="endereco.bairro"
                                        name="endereco.bairro"
                                        type="text"
                                        required
                                        value={formData.endereco.bairro}
                                        onChange={handleChange}
                                        placeholder="Preenchido pelo CEP"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {/* Cidade */}
                                <div>
                                    <label htmlFor="endereco.cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</label>
                                    <input
                                        id="endereco.cidade"
                                        name="endereco.cidade"
                                        type="text"
                                        required
                                        value={formData.endereco.cidade}
                                        onChange={handleChange}
                                        placeholder="Preenchido pelo CEP"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                    />
                                </div>
                                {/* Estado (UF) */}
                                <div>
                                    <label htmlFor="endereco.estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado (UF)</label>
                                    <input
                                        id="endereco.estado"
                                        name="endereco.estado"
                                        type="text"
                                        required
                                        value={formData.endereco.estado}
                                        onChange={handleChange}
                                        placeholder="Ex: SP"
                                        maxLength={2}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                    />
                                </div>
                                {/* País */}
                                <div>
                                    <label htmlFor="endereco.pais" className="block text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
                                    <input
                                        id="endereco.pais"
                                        name="endereco.pais"
                                        type="text"
                                        required
                                        value={formData.endereco.pais}
                                        onChange={handleChange}
                                        placeholder="Ex: Brasil"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* --- OPÇÕES DE CONDOMÍNIO (ANINHADO) - FIX APPLIED HERE --- */}
                         <div className='space-y-4 p-4 border border-blue-200 dark:border-blue-900/50 rounded-lg bg-blue-50 dark:bg-zinc-700/50'>
                             <h4 className="text-lg font-semibold text-rentou-primary dark:text-blue-400 mb-3">Informações de Condomínio</h4>
                             <CheckboxInput 
                                label="O imóvel está localizado em Condomínio/Edifício?" 
                                name="condominio.possuiCondominio" 
                                // FIX: Adicionado optional chaining e fallback para o checked
                                checked={formData.condominio?.possuiCondominio || false} 
                                onChange={handleChange} 
                            />
                            
                            {/* FIX: Adicionado optional chaining na renderização condicional */}
                            {formData.condominio?.possuiCondominio && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label htmlFor="condominio.nomeCondominio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Condomínio/Edifício</label>
                                        <input
                                            id="condominio.nomeCondominio"
                                            name="condominio.nomeCondominio"
                                            type="text"
                                            value={formData.condominio.nomeCondominio || ''}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Condomínio Residencial Alphaville"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         <CheckboxInput 
                                            label="Possui Portaria 24h?" 
                                            name="condominio.portaria24h" 
                                             // FIX: Adicionado optional chaining
                                            checked={formData.condominio?.portaria24h || false} 
                                            onChange={handleChange} 
                                        />
                                        <CheckboxInput 
                                            label="Possui Área de Lazer/Comum?" 
                                            name="condominio.areaLazer" 
                                             // FIX: Adicionado optional chaining
                                            checked={formData.condominio?.areaLazer || false} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>
                            )}
                         </div>
                        {/* --- FIM: OPÇÕES DE CONDOMÍNIO --- */}
                        
                        {/* Informações de Anúncio (Título) */}
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
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">2. Estrutura e Características</h3>
                        
                        {/* Linha: Quartos, Banheiros, Vagas, Andar (Condicional) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             <div>
                                <label htmlFor="quartos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quartos</label>
                                <input id="quartos" name="quartos" type="text" required value={localNumericInputs['quartos'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            <div>
                                <label htmlFor="banheiros" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banheiros</label>
                                <input id="banheiros" name="banheiros" type="text" required value={localNumericInputs['banheiros'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            <div>
                                <label htmlFor="vagasGaragem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vagas Garagem</label>
                                <input id="vagasGaragem" name="vagasGaragem" type="text" required value={localNumericInputs['vagasGaragem'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            {formData.categoriaPrincipal === 'Residencial' && formData.tipoDetalhado.includes('Apartamento') ? (
                                <div>
                                    <label htmlFor="andar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Andar</label>
                                    <input id="andar" name="andar" type="text" required value={localNumericInputs['andar'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="Ex: 5" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                                </div>
                            ) : (
                                <div className='hidden md:block'></div>
                            )}
                        </div>

                        {/* Linha: Áreas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                             <div>
                                <label htmlFor="areaTotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área Total (m²)</label>
                                <input id="areaTotal" name="areaTotal" type="text" required value={localNumericInputs['areaTotal'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="Ex: 120.5" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                             <div>
                                <label htmlFor="areaUtil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área Útil (m²)</label>
                                <input id="areaUtil" name="areaUtil" type="text" required value={localNumericInputs['areaUtil'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="Ex: 80.0" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
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
                             <div>
                                <label htmlFor="valorAluguel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor do Aluguel (R$)</label>
                                <input id="valorAluguel" name="valorAluguel" type="text" required value={localNumericInputs['valorAluguel'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="3500.00" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            
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
                             <div>
                                <label htmlFor="valorCondominio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Condomínio (R$)</label>
                                <input id="valorCondominio" name="valorCondominio" type="text" required value={localNumericInputs['valorCondominio'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="0.00" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                             <div>
                                <label htmlFor="valorIPTU" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor IPTU (Mensal R$)</label>
                                <input id="valorIPTU" name="valorIPTU" type="text" required value={localNumericInputs['valorIPTU'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="0.00" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
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
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:focus:border-rentou-primary"
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

    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b pb-4">
                {formTitle}
            </h2>
            
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
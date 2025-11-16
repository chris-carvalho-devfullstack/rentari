// src/components/imoveis/FormularioImovel.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// ATUALIZADO: Importar funções de foto
import { adicionarNovoImovel, atualizarImovel, updateImovelFotos } from '@/services/ImovelService'; 
import { uploadImovelPhotos, deleteFotoImovel } from '@/services/StorageService'; 
// ATUALIZADO: Importar TODOS os novos tipos, incluindo Cômodos e Responsabilidade
import { Imovel, ImovelCategoria, ImovelFinalidade, NovoImovelData, EnderecoImovel, CondominioData, CozinhaData, SalaData, VarandaData, DispensaData, ResponsavelPagamento } from '@/types/imovel'; 
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy'; 
import { useAuthStore } from '@/hooks/useAuthStore';
// Importação do serviço de CEP
import { fetchAddressByCep, CepData } from '@/services/CepService'; 
import { Icon } from '@/components/ui/Icon'; // Importar Icon Componente
import { faSave, faChevronRight, faChevronLeft, faCheckCircle, faImage, faHome, faTrash, faUsers, faTag } from '@fortawesome/free-solid-svg-icons'; 

interface FormularioImovelProps {
    initialData?: Imovel;
}

// Define os passos do formulário
const formSteps = [
    { id: 1, name: 'Classificação' },
    { id: 2, name: 'Estrutura & Cômodos' }, // NOME ATUALIZADO
    { id: 3, name: 'Valores & Responsabilidade' }, // NOME ATUALIZADO
    { id: 4, name: 'Mídia & Fotos' }, 
];

// --- NOVAS ESTRUTURAS DEFAULT (Corrigido) ---
const defaultCozinha: CozinhaData = {
    tipo: 'FECHADA',
    possuiArmarios: false,
    possuiDispensa: false,
};

const defaultSala: SalaData = {
    tipo: 'ESTAR_JANTAR',
    qtdSalas: 1,
    possuiVaranda: false,
};

const defaultVaranda: VarandaData = {
    possuiVaranda: false,
    tipo: 'SIMPLES',
    possuiChurrasqueira: false,
};

const defaultDispensa: DispensaData = {
    possuiDispensa: false,
    prateleirasEmbutidas: false,
};
// --- FIM NOVAS ESTRUTURAS ---


// Estruturas default aninhadas (existentes)
const defaultEndereco: EnderecoImovel = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', pais: 'Brasil' };
const defaultCondominio: CondominioData = { possuiCondominio: false, nomeCondominio: '', portaria24h: false, areaLazer: false };


// --- DEFAULT DATA PRINCIPAL (ATUALIZADO COM OS NOVOS CAMPOS) ---
const defaultFormData: NovoImovelData = {
    titulo: '',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Locação Residencial'], 
    endereco: defaultEndereco, 
    condominio: defaultCondominio, 
    quartos: 1,
    banheiros: 1,
    vagasGaragem: 0,
    areaTotal: 0, 
    areaUtil: 0, 
    andar: 1,
    
    // NOVO: Estrutura de Cômodos
    cozinha: defaultCozinha,
    sala: defaultSala,
    varanda: defaultVaranda,
    dispensa: defaultDispensa,

    descricaoLonga: '',
    caracteristicas: [], 
    aceitaAnimais: false,
    status: 'VAGO',
    valorAluguel: 0, 
    valorCondominio: 0, 
    valorIPTU: 0,
    dataDisponibilidade: new Date().toISOString().split('T')[0],
    
    // NOVO: Responsabilidades Financeiras
    custoCondominioIncluso: false,
    responsavelCondominio: 'LOCATARIO',
    custoIPTUIncluso: false,
    responsavelIPTU: 'LOCATARIO',

    fotos: [], 
    linkVideoTour: undefined,
    visitaVirtual360: false,
};


const isNumericField = (name: string): boolean => 
    ['quartos', 'banheiros', 'vagasGaragem', 'areaTotal', 'areaUtil', 
     'valorAluguel', 'valorCondominio', 'valorIPTU', 'andar'].includes(name);

// ATUALIZADO: Inicia o estado com a nova estrutura aninhada
const getInitialState = (initialData?: Imovel) => {
    const initialDataPayload = initialData || {} as Imovel;

    const initialFormData: NovoImovelData = {
        ...defaultFormData,
        ...(initialDataPayload as any), 
        
        // Garante que os objetos aninhados sejam mesclados corretamente
        endereco: { ...defaultEndereco, ...(initialDataPayload.endereco || {}) },
        condominio: { ...defaultCondominio, ...(initialDataPayload.condominio || {}) },
        cozinha: { ...defaultCozinha, ...(initialDataPayload.cozinha || {}) },
        sala: { ...defaultSala, ...(initialDataPayload.sala || {}) },
        varanda: { ...defaultVaranda, ...(initialDataPayload.varanda || {}) },
        dispensa: { ...defaultDispensa, ...(initialDataPayload.dispensa || {}) },

        // Garantias de tipos
        categoriaPrincipal: initialDataPayload.categoriaPrincipal || defaultFormData.categoriaPrincipal,
        tipoDetalhado: initialDataPayload.tipoDetalhado || defaultFormData.tipoDetalhado,
        finalidades: initialDataPayload.finalidades || defaultFormData.finalidades,
        dataDisponibilidade: initialDataPayload.dataDisponibilidade || defaultFormData.dataDisponibilidade,
        andar: initialDataPayload.andar || 0,
        fotos: initialDataPayload.fotos || [], 
    } as NovoImovelData;

    const initialLocalInputs: Record<string, string> = {};
    initialLocalInputs['endereco.cep'] = initialFormData.endereco.cep ? initialFormData.endereco.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : ''; 
    
    Object.keys(initialFormData).filter(isNumericField).forEach(keyString => {
        const numericValue = (initialFormData as any)[keyString] as number;
        initialLocalInputs[keyString] = String(numericValue === 0 ? '' : numericValue);
    });
    
    return { initialFormData, initialLocalInputs };
};


// --- COMPONENTES AUXILIARES DEFINIDOS ANTES DO EXPORT DEFAULT ---

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

// CORRIGIDO: Componente SelectResponsabilidade
const SelectResponsabilidade: React.FC<{ label: string, name: string, value: ResponsavelPagamento, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
        >
            <option value="LOCATARIO">Locatário (Inquilino)</option>
            <option value="PROPRIETARIO">Proprietário</option>
            <option value="NA_LOCACAO">Não Aplicável/Negociável</option>
        </select>
    </div>
);

const ComodidadesSelector: React.FC<{ selected: string[]; onSelect: (caracteristica: string) => void }> = ({ selected, onSelect }) => {
    const availableFeatures = ['Piscina', 'Churrasqueira', 'Academia', 'Portaria 24h', 'Mobiliado', 'Aquecimento a Gás', 'Salão de Festas', 'Quintal/Jardim', 'Elevador', 'Acessibilidade'];
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comodidades/Atrativos</label>
            <div className="flex flex-wrap gap-2">
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
    
    // --- ESTADO DE GERENCIAMENTO DE FOTOS ---
    const [novasFotos, setNovasFotos] = useState<File[]>([]);
    const [fotosAExcluir, setFotosAExcluir] = useState<string[]>([]);
    const MAX_PHOTOS = 25;


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

    // --- CORRIGIDO: Lógica de Alteração Centralizada ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const target = e.target;
        const isCheckbox = type === 'checkbox';
        
        // 1. Lida com campos aninhados (incluindo as novas estruturas de Cômodos)
        if (name.includes('.') || 
            name.includes('cozinha') || name.includes('sala') || 
            name.includes('varanda') || name.includes('dispensa')
        ) {
            const parts = name.split('.');
            const mainKey = parts[0] as keyof NovoImovelData; 
            const subKey = parts.length > 1 ? parts[1] : undefined;

            if (name === 'endereco.cep') {
                let cleanedValue = value.replace(/\D/g, '').slice(0, 8);
                let formattedValue = cleanedValue.length > 5 ? `${cleanedValue.slice(0, 5)}-${cleanedValue.slice(5)}` : cleanedValue;
                setLocalNumericInputs(prev => ({ ...prev, [name]: formattedValue }));
                setFormData(prevData => ({ ...prevData, endereco: { ...prevData.endereco, cep: cleanedValue } }));
                return;
            }

            // Tratamento para objetos aninhados (Condomínio, Cozinha, Sala, Varanda, Dispensa, Endereço)
             if (subKey) {
                 setFormData(prevData => ({
                    ...prevData,
                    [mainKey]: { 
                        ...(prevData[mainKey] as any), 
                        [subKey]: isCheckbox ? (target as HTMLInputElement).checked : value 
                    },
                }));
                return;
            }
            // Se for apenas 'endereco' no root
             if (mainKey === 'endereco') {
                 setFormData(prevData => ({
                    ...prevData,
                    endereco: { ...(prevData.endereco), [subKey || mainKey]: value },
                }));
                return;
            }
        }

        // 2. Lida com campos no primeiro nível (incluindo as novas flags financeiras)
        if (isNumericField(name)) {
            setLocalNumericInputs(prev => ({ ...prev, [name]: value }));
            return;
        }
        
        // Trata responsabilidades e flags de inclusão (top-level)
        if (name === 'custoCondominioIncluso' || name === 'custoIPTUIncluso') {
            setFormData(prevData => ({
                ...prevData,
                [name]: (target as HTMLInputElement).checked,
            }));
            return;
        }
        if (name === 'responsavelCondominio' || name === 'responsavelIPTU') {
             setFormData(prevData => ({
                ...prevData,
                [name]: value as ResponsavelPagamento,
            }));
            return;
        }
        
        setFormData((prevData: NovoImovelData) => ({
            ...prevData,
            [name]: isCheckbox ? (target as HTMLInputElement).checked : value,
        }));
    }, []); 
    // --- FIM Lógica de Alteração Centralizada ---


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
    
    // --- Handlers de Foto ---
    const getAvailableSlots = useCallback(() => {
        const currentValidPhotos = formData.fotos.filter(url => !fotosAExcluir.includes(url)).length;
        const totalNewPhotos = novasFotos.length;
        return MAX_PHOTOS - currentValidPhotos - totalNewPhotos;
    }, [formData.fotos, fotosAExcluir, novasFotos.length]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const availableSlots = getAvailableSlots();
            
            if (filesArray.length > availableSlots) {
                setError(`Você só pode adicionar mais ${availableSlots} fotos. Remova fotos existentes ou novas fotos para continuar.`);
                e.target.value = ''; 
                return;
            }

            setNovasFotos(prev => [...prev, ...filesArray]);
            e.target.value = ''; 
            setError(null);
        }
    };

    const handleRemoveNewPhoto = (index: number) => {
        setNovasFotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleExistingPhoto = (url: string) => {
        setFotosAExcluir(prev => {
            if (prev.includes(url)) {
                return prev.filter(u => u !== url); 
            } else {
                return [...prev, url]; 
            }
        });
    };
    // --- FIM Handlers de Foto ---


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
        // Validação mínima da Etapa 2 (Novos campos)
        if (currentStep === 2) {
             if (formData.varanda.possuiVaranda && !formData.varanda.tipo) {
                 setError("Selecione o tipo de varanda.");
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

            // 1. Cria ou atualiza o Imóvel no Firestore (sem a lista final de fotos)
            let result: Imovel;
            
            if (isEditing && initialData) {
                const updateDataWithoutPhotos = { ...finalFormData, fotos: initialData.fotos };
                result = await atualizarImovel(initialData.id, updateDataWithoutPhotos);
            } else {
                result = await adicionarNovoImovel(finalFormData, proprietarioId);
            }
            
            // 2. Processa as fotos
            let finalFotosUrls = result.fotos || [];

            // A. Excluir fotos marcadas (se for edição)
            if (fotosAExcluir.length > 0 && isEditing) {
                const deletePromises = fotosAExcluir.map(url => deleteFotoImovel(url));
                await Promise.all(deletePromises);
                
                // Remove as URLs excluídas do array final
                finalFotosUrls = finalFotosUrls.filter(url => !fotosAExcluir.includes(url));
            }
            
            // B. Upload de novas fotos
            if (novasFotos.length > 0) {
                 const uploadedUrls = await uploadImovelPhotos(novasFotos, result.smartId);
                 // Concatena as fotos existentes com as novas, limitando ao MAX_PHOTOS
                 finalFotosUrls = [...finalFotosUrls, ...uploadedUrls].slice(0, MAX_PHOTOS);
            }

            // 3. Atualiza o documento Imóvel no Firestore com a lista FINAL de URLs
            if (novasFotos.length > 0 || fotosAExcluir.length > 0) {
                 await updateImovelFotos(result.id, finalFotosUrls);
            }
            
            router.push(`/imoveis/${result.smartId}`); // Redireciona usando o Smart ID

        } catch (err: any) {
            console.error('Erro na operação de imóvel:', err);
            setError(`Falha ao ${isEditing ? 'atualizar' : 'adicionar'} o imóvel. Detalhe: ${err.message || 'Erro desconhecido.'}. Verifique o console para mais detalhes.`);
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

    // Componente Select/Responsabilidade (CORRIGIDO)
    const SelectResponsabilidade: React.FC<{ label: string, name: string, value: ResponsavelPagamento, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, name, value, onChange }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
            >
                <option value="LOCATARIO">Locatário (Inquilino)</option>
                <option value="PROPRIETARIO">Proprietário</option>
                <option value="NA_LOCACAO">Não Aplicável/Negociável</option>
            </select>
        </div>
    );

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
                        {/* --- FIM: SEÇÃO ENDEREÇO DETALHADO --- */}

                        {/* --- OPÇÕES DE CONDOMÍNIO (Mantidas) --- */}
                         <div className='space-y-4 p-4 border border-blue-200 dark:border-blue-900/50 rounded-lg bg-blue-50 dark:bg-zinc-700/50'>
                             <h4 className="text-lg font-semibold text-rentou-primary dark:text-blue-400 mb-3">Informações de Condomínio</h4>
                             <CheckboxInput 
                                label="O imóvel está localizado em Condomínio/Edifício?" 
                                name="condominio.possuiCondominio" 
                                checked={formData.condominio?.possuiCondominio || false} 
                                onChange={handleChange} 
                            />
                            
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
                                            checked={formData.condominio?.portaria24h || false} 
                                            onChange={handleChange} 
                                        />
                                        <CheckboxInput 
                                            label="Possui Área de Lazer/Comum?" 
                                            name="condominio.areaLazer" 
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
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">2. Estrutura e Cômodos</h3>
                        
                        {/* Linha: Quartos, Banheiros, Vagas, Andar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             {/* Quartos */}
                             <div>
                                <label htmlFor="quartos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quartos</label>
                                <input id="quartos" name="quartos" type="text" required value={localNumericInputs['quartos'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            {/* Banheiros */}
                            <div>
                                <label htmlFor="banheiros" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banheiros</label>
                                <input id="banheiros" name="banheiros" type="text" required value={localNumericInputs['banheiros'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            {/* Vagas Garagem */}
                            <div>
                                <label htmlFor="vagasGaragem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vagas Garagem</label>
                                <input id="vagasGaragem" name="vagasGaragem" type="text" required value={localNumericInputs['vagasGaragem'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            {/* Andar (Condicional) */}
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
                             {/* Área Total */}
                             <div>
                                <label htmlFor="areaTotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área Total (m²)</label>
                                <input id="areaTotal" name="areaTotal" type="text" required value={localNumericInputs['areaTotal'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="Ex: 120.5" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                             {/* Área Útil */}
                             <div>
                                <label htmlFor="areaUtil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área Útil (m²)</label>
                                <input id="areaUtil" name="areaUtil" type="text" required value={localNumericInputs['areaUtil'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="Ex: 80.0" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                        </div>
                        
                        {/* --- NOVO: DETALHES DE CÔMODOS --- */}
                        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detalhes dos Principais Cômodos</h4>

                            {/* Detalhes da Cozinha */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-zinc-700">
                                <div>
                                    <label htmlFor="cozinha.tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Cozinha</label>
                                    <select id="cozinha.tipo" name="cozinha.tipo" value={formData.cozinha.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md">
                                        <option value="FECHADA">Fechada</option>
                                        <option value="AMERICANA">Americana</option>
                                        <option value="GOURMET">Gourmet</option>
                                        <option value="INTEGRADA">Integrada (Estilo Loft)</option>
                                        <option value="INDUSTRIAL">Industrial</option>
                                    </select>
                                </div>
                                <CheckboxInput label="Possui Armários Planejados?" name="cozinha.possuiArmarios" checked={formData.cozinha.possuiArmarios || false} onChange={handleChange} />
                                <CheckboxInput label="Possui Dispensa Embutida?" name="dispensa.possuiDispensa" checked={formData.dispensa.possuiDispensa || false} onChange={handleChange} />
                            </div>
                            
                            {/* Detalhes da Sala e Varanda */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-zinc-700">
                                <div>
                                    <label htmlFor="sala.tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Sala Principal</label>
                                    <select id="sala.tipo" name="sala.tipo" value={formData.sala.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md">
                                        <option value="ESTAR_JANTAR">Estar e Jantar Integradas</option>
                                        <option value="ESTAR">Apenas Estar</option>
                                        <option value="JANTAR">Apenas Jantar</option>
                                        <option value="TV">Sala de TV</option>
                                        <option value="ESCRITORIO">Escritório/Home Office</option>
                                        <option value="OUTRA">Outra</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="sala.qtdSalas" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade de Salas</label>
                                    <input id="sala.qtdSalas" name="sala.qtdSalas" type="number" required min={1} value={formData.sala.qtdSalas} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                                </div>
                                <CheckboxInput label="Possui Varanda/Terraço?" name="varanda.possuiVaranda" checked={formData.varanda.possuiVaranda || false} onChange={handleChange} />
                            </div>

                            {/* Detalhes da Varanda (Condicional) */}
                            {formData.varanda.possuiVaranda && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-zinc-700/50">
                                    <div>
                                        <label htmlFor="varanda.tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Varanda</label>
                                        <select id="varanda.tipo" name="varanda.tipo" value={formData.varanda.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md">
                                            <option value="SIMPLES">Simples (Aberto)</option>
                                            <option value="GOURMET">Gourmet (Com Infra)</option>
                                            <option value="FECHADA">Fechada (Vidro/Reiki)</option>
                                        </select>
                                    </div>
                                    <CheckboxInput label="Varanda possui Churrasqueira?" name="varanda.possuiChurrasqueira" checked={formData.varanda.possuiChurrasqueira || false} onChange={handleChange} />
                                </div>
                            )}

                        </div>
                        {/* --- FIM: DETALHES DE CÔMODOS --- */}
                        
                        {/* Seletor de Comodidades */}
                        <div className='pt-4 border-t border-gray-100 dark:border-zinc-700'>
                            <ComodidadesSelector selected={formData.caracteristicas} onSelect={handleCaracteristicaChange} />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">3. Valores e Responsabilidade</h3>
                        
                        {/* Linha: Valor Aluguel e Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Valor Aluguel */}
                             <div>
                                <label htmlFor="valorAluguel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor do Aluguel (R$)</label>
                                <input id="valorAluguel" name="valorAluguel" type="text" required value={localNumericInputs['valorAluguel'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="3500.00" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                            </div>
                            
                            {/* Status */}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status do Imóvel</label>
                                <select id="status" name="status" required value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary">
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
                        
                        {/* --- NOVO: DETALHES DE RESPONSABILIDADE FINANCEIRA --- */}
                        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                             <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Responsabilidade dos Custos Fixos</h4>
                             
                             {/* RESPONSABILIDADE CONDOMÍNIO */}
                            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-zinc-700/50">
                                <h5 className="text-base font-semibold text-rentou-primary mb-3">Custo do Condomínio</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CheckboxInput 
                                        label="Condomínio incluído no valor do aluguel?" 
                                        name="custoCondominioIncluso" 
                                        checked={formData.custoCondominioIncluso} 
                                        onChange={handleChange} 
                                        description="Se marcado, o valor será somado ao Valor Total da Locação."
                                    />
                                    <SelectResponsabilidade 
                                        label="Responsável pelo Pagamento" 
                                        name="responsavelCondominio" 
                                        value={formData.responsavelCondominio} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>

                            {/* RESPONSABILIDADE IPTU */}
                            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-zinc-700/50">
                                <h5 className="text-base font-semibold text-rentou-primary mb-3">Custo do IPTU</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CheckboxInput 
                                        label="IPTU incluído no valor do aluguel?" 
                                        name="custoIPTUIncluso" 
                                        checked={formData.custoIPTUIncluso} 
                                        onChange={handleChange} 
                                        description="Se marcado, o valor mensal será somado ao Valor Total da Locação."
                                    />
                                    <SelectResponsabilidade 
                                        label="Responsável pelo Pagamento" 
                                        name="responsavelIPTU" 
                                        value={formData.responsavelIPTU} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>
                        </div>
                        {/* --- FIM: DETALHES DE RESPONSABILIDADE FINANCEIRA --- */}
                        
                        {/* Campo Data de Disponibilidade, Aceita Animais (Mantidos) */}
                        <div>
                            <label htmlFor="dataDisponibilidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disponível a partir de</label>
                            <input id="dataDisponibilidade" name="dataDisponibilidade" type="date" required value={formData.dataDisponibilidade} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                        </div>
                        
                        <CheckboxInput label="Aceita Animais?" name="aceitaAnimais" checked={formData.aceitaAnimais} onChange={handleChange} description="Marque se a locação permite animais de estimação." />
                    </div>
                );
            case 4:
                // --- NOVO: Renderização da Etapa 4 (Mídia e Fotos) ---
                const currentValidPhotosCount = formData.fotos.filter(url => !fotosAExcluir.includes(url)).length;
                const totalPhotosCount = currentValidPhotosCount + novasFotos.length;
                const availableSlots = MAX_PHOTOS - totalPhotosCount;
                
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">4. Mídia e Fotos do Anúncio</h3>
                        
                        {/* CAMPO DESCRIÇÃO LONGA */}
                        <div>
                            <label htmlFor="descricaoLonga" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição Detalhada para Anúncio</label>
                            <textarea id="descricaoLonga" name="descricaoLonga" rows={4} required value={formData.descricaoLonga} onChange={handleChange} placeholder="Descreva o imóvel em detalhes, destacando os pontos fortes e a vizinhança." className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                        </div>
                        
                        {/* MÍDIA (LINKS E CHECKBOX) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                             <div>
                                <label htmlFor="linkVideoTour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link do Vídeo Tour (Opcional)</label>
                                <input id="linkVideoTour" name="linkVideoTour" type="url" value={formData.linkVideoTour || ''} onChange={handleChange} placeholder="Ex: https://youtube.com/watch?v=tour" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:focus:border-rentou-primary" />
                            </div>
                             <CheckboxInput label="Visita Virtual 360º Disponível" name="visitaVirtual360" checked={formData.visitaVirtual360} onChange={handleChange} description="Marque se você possui um link para tour virtual 360º." />
                        </div>

                        {/* SEÇÃO DE UPLOAD E GERENCIAMENTO DE FOTOS */}
                        <div className='space-y-4 p-4 border rounded-lg border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800'>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                <Icon icon={faImage} className="w-4 h-4 mr-2" /> Galeria de Fotos (Máx. {MAX_PHOTOS})
                            </h4>
                             <p className={`text-sm font-medium ${availableSlots === 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                Slots disponíveis: {availableSlots}. Fotos totais: {totalPhotosCount}
                            </p>

                            {/* UPLOAD DE NOVAS FOTOS */}
                            {availableSlots > 0 && (
                                <div className="mt-1">
                                    {/* O INPUT FILE É CUSTUMIZADO POR UM LABEL */}
                                    <label htmlFor="fotos-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rentou-primary hover:bg-blue-700 transition-colors cursor-pointer">
                                        <Icon icon={faImage} className="w-4 h-4 mr-2" />
                                        Selecionar Novas Fotos
                                    </label>
                                    <input
                                        type="file"
                                        id="fotos-upload"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="sr-only" // ESCONDE O INPUT
                                        disabled={loading || availableSlots <= 0}
                                    />
                                </div>
                            )}
                            
                            {/* GALERIA DE NOVAS FOTOS (PREVIEW) */}
                            {novasFotos.length > 0 && (
                                 <div className='space-y-2 pt-2'>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Novas para Upload ({novasFotos.length}):</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {novasFotos.map((file, index) => (
                                            <div key={file.name + index} className="relative group w-full h-24 bg-blue-100 rounded-lg overflow-hidden border-2 border-dashed border-blue-400 flex items-center justify-center">
                                                <p className="text-center text-xs text-blue-800 p-1 truncate max-w-full">{file.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNewPhoto(index)}
                                                    className="absolute top-0 right-0 m-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remover nova foto"
                                                >
                                                    <Icon icon={faTrash} className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* GALERIA DE FOTOS EXISTENTES */}
                            {formData.fotos.length > 0 && (
                                <div className='space-y-2 pt-2 border-t border-gray-200 dark:border-zinc-700'>
                                     <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fotos Atuais ({formData.fotos.length}):</p>
                                     <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {formData.fotos.map((url, index) => {
                                            const isMarkedForDeletion = fotosAExcluir.includes(url);
                                            return (
                                                <div key={url} className="relative group w-full h-24 bg-gray-100 rounded-lg overflow-hidden border">
                                                    <img 
                                                        src={url} 
                                                        alt={`Foto ${index + 1} do Imóvel`} 
                                                        className={`w-full h-full object-cover transition-opacity ${isMarkedForDeletion ? 'opacity-30' : ''}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleExistingPhoto(url)}
                                                        className={`absolute inset-0 flex items-center justify-center text-white text-xs font-bold transition-all duration-200 ${
                                                            isMarkedForDeletion 
                                                            ? 'bg-red-600/80 opacity-100' 
                                                            : 'bg-black/40 opacity-0 group-hover:opacity-100'
                                                        }`}
                                                        title={isMarkedForDeletion ? 'Manter foto' : 'Marcar para Excluir'}
                                                    >
                                                        <Icon icon={faTrash} className="w-4 h-4 mr-1" />
                                                        {isMarkedForDeletion ? 'REMOVER MARCAÇÃO' : 'EXCLUIR'}
                                                    </button>
                                                    {isMarkedForDeletion && (
                                                         <span className="absolute top-0 left-0 bg-red-600 text-white text-xs px-2 py-0.5 rounded-br-lg">Excluir</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
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
                        className={`w-full flex justify-center py-2 px-6 border border-transparent rounded-md shadow-lg text-sm font-medium text-white transition-colors cursor-pointer ${
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
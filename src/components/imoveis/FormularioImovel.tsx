// src/components/imoveis/FormularioImovel.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adicionarNovoImovel, atualizarImovel } from '@/services/ImovelService'; 
import { Imovel, ImovelCategoria, ImovelFinalidade, NovoImovelData } from '@/types/imovel'; 
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy'; 
import { useAuthStore } from '@/hooks/useAuthStore'; // <-- IMPORT NECESSÁRIO

interface FormularioImovelProps {
    initialData?: Imovel;
}

// Define os passos do formulário
const formSteps = [
    { id: 1, name: 'Classificação e Finalidade' },
    { id: 2, name: 'Estrutura e Área' },
    { id: 3, name: 'Valores e Contrato' },
    { id: 4, name: 'Descrição e Mídia' },
];

const defaultFormData: NovoImovelData = {
    titulo: '',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Venda'], 
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

// Função auxiliar para determinar se um campo armazena um valor numérico
const isNumericField = (name: string): boolean => 
  ['quartos', 'banheiros', 'vagasGaragem', 'areaTotal', 'areaUtil', 
   'valorAluguel', 'valorCondominio', 'valorIPTU', 'andar'].includes(name);

// FUNÇÃO DE INICIALIZAÇÃO CORRIGIDA (EVITA CHAMAR SETTERS NO INITIALIZER)
const getInitialState = (initialData?: Imovel) => {
    // 1. Inicializa o formData
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

    // 2. Inicializa o estado local de strings para inputs numéricos
    const initialLocalInputs: Record<string, string> = {};
    
    // Itera sobre as chaves válidas e assegura a tipagem correta.
    Object.keys(initialFormData).filter(isNumericField).forEach(keyString => {
        const numericValue = (initialFormData as any)[keyString] as number;
        
        // Conversão segura para string, evitando '0' em inputs vazios
        initialLocalInputs[keyString] = String(numericValue === 0 ? '' : numericValue);
    });
    
    return { initialFormData, initialLocalInputs };
};


/**
 * @fileoverview Formulário multi-step (inteligente) para a criação e edição de imóveis.
 * CORRIGIDO: Adiciona o imóvel no Firestore com o ID do proprietário logado.
 */
export default function FormularioImovel({ initialData }: FormularioImovelProps) {
  const router = useRouter();
  const { user } = useAuthStore(); // <-- Acessa o usuário logado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Imóvel Existente' : 'Adicionar Novo Imóvel';
  
  // Chama a função de inicialização APENAS uma vez com useMemo
  const { initialFormData, initialLocalInputs } = useMemo(() => getInitialState(initialData), [initialData]);

  // Inicializa os estados com os valores calculados (sem dependência circular)
  const [localNumericInputs, setLocalNumericInputs] = useState<Record<string, string>>(initialLocalInputs);
  const [formData, setFormData] = useState<NovoImovelData>(initialFormData);

  // Mapeia os tipos disponíveis com base na categoria principal selecionada
  const tiposDisponiveis = useMemo(() => {
    return IMÓVEIS_HIERARQUIA.find(c => c.categoria === formData.categoriaPrincipal)?.tipos || [];
  }, [formData.categoriaPrincipal]);
  
  // Mapeia as finalidades disponíveis com base no tipo selecionado (Tipo de Categoria + Subtipo)
  const finalidadesDisponiveis = useMemo(() => {
    const tipo = tiposDisponiveis.find(t => formData.tipoDetalhado.startsWith(t.nome));
    return tipo?.finalidade || [];
  }, [formData.tipoDetalhado, tiposDisponiveis]);

  // Efeito para resetar tipoDetalhado e finalidades ao mudar a categoria
  useEffect(() => {
    const firstTipo = tiposDisponiveis[0];
    if (firstTipo) {
      const defaultTipoDetalhado = firstTipo.subtipos ? `${firstTipo.nome} - ${firstTipo.subtipos[0]}` : firstTipo.nome;
      
      setFormData(prevData => ({
        ...prevData,
        tipoDetalhado: defaultTipoDetalhado,
        // Remove finalidades que não são mais válidas (mantendo pelo menos uma se houver)
        finalidades: prevData.finalidades.filter(f => firstTipo.finalidade.includes(f))
      }));
    }
  }, [formData.categoriaPrincipal, tiposDisponiveis]); 

  // --- CORREÇÃO DEFINITIVA DO FLUXO DE INPUT NUMÉRICO ---
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const target = e.target;

    if (isNumericField(name)) {
        // PASSO 1: SOMENTE atualiza o estado local de string.
        setLocalNumericInputs(prev => ({ ...prev, [name]: value }));
        return; 
    }
    
    // Lógica para campos não numéricos
    setFormData((prevData: NovoImovelData) => ({
      ...prevData,
      [name]: (type === 'checkbox') ? (target as HTMLInputElement).checked : value,
    }));
  }, []); 

  // NOVO HANDLER: Atualiza o estado principal (formData) quando o campo perde o foco
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (isNumericField(name)) {
        const cleanedValue = value.replace(',', '.');
        const numericValue = parseFloat(cleanedValue) || 0; 

        // 1. Atualiza o estado principal (formData) com o valor numérico final.
        setFormData(prevData => ({
            ...prevData,
            [name]: numericValue,
        }));
        
        // 2. Garante que o estado local de string reflita o valor final (ou vazio, se 0)
        setLocalNumericInputs(prev => ({
            ...prev,
            [name]: String(numericValue === 0 ? '' : numericValue)
        }));
    }
  }, []);
  // --- FIM CORREÇÃO DO FLUXO DE INPUT NUMÉRICO ---


  const handleFinalidadeChange = useCallback((finalidade: ImovelFinalidade) => {
    setFormData((prevData: NovoImovelData) => {
        const isSelected = prevData.finalidades.includes(finalidade);
        let newFinalidades;
        
        if (isSelected) {
            newFinalidades = prevData.finalidades.filter(f => f !== finalidade);
        } else {
            newFinalidades = [...prevData.finalidades, finalidade];
        }
        
        // Garante que o array não fique vazio para evitar bugs de persistência (pelo menos 'Venda' se não for Locação)
        if (newFinalidades.length === 0) {
            return prevData;
        }

        return {
            ...prevData,
            finalidades: newFinalidades,
        };
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
    // Validação de Finalidade na Etapa 1
    if (currentStep === 1 && formData.finalidades.length === 0) {
      setError("Selecione pelo menos uma finalidade para o imóvel (Venda ou Locação).");
      return;
    }

    // --- CONSOLIDAÇÃO DE VALOR NA TRANSIÇÃO DE ETAPA ---
    const numericFieldsToConsolidate: string[] = [];
    if (currentStep === 2) {
         numericFieldsToConsolidate.push('quartos', 'banheiros', 'vagasGaragem', 'areaTotal', 'areaUtil');
         if (formData.categoriaPrincipal === 'Residencial' && formData.tipoDetalhado.includes('Apartamento')) {
             numericFieldsToConsolidate.push('andar');
         }
    }
    if (currentStep === 3) {
         numericFieldsToConsolidate.push('valorAluguel', 'valorCondominio', 'valorIPTU');
    }

    // Executa a consolidação (simulando o blur)
    numericFieldsToConsolidate.forEach(name => {
         const value = localNumericInputs[name];
         if (value !== undefined) {
             const cleanedValue = value.replace(',', '.');
             const numericValue = parseFloat(cleanedValue) || 0; 
             
             setFormData(prevData => ({ ...prevData, [name]: numericValue }));
             setLocalNumericInputs(prev => ({ ...prev, [name]: String(numericValue === 0 ? '' : numericValue) }));
         }
    });
    // --- FIM CONSOLIDAÇÃO DE VALOR ---


    if (currentStep < formSteps.length) {
      setCurrentStep(currentStep + 1);
      setError(null);
      window.scrollTo(0, 0); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // VALIDAÇÃO CRÍTICA DE AUTENTICAÇÃO
    if (!user || !user.id) {
        setError('Erro de autenticação. Proprietário não identificado. Tente relogar.');
        setLoading(false);
        return;
    }
    const proprietarioId = user.id;
    
    try {
      
      // CONSOLIDAÇÃO FINAL DE VALOR (focada na Etapa 3)
      let finalFormData = { ...formData };
      const finalNumericFields = ['valorAluguel', 'valorCondominio', 'valorIPTU'];
      
      finalNumericFields.forEach(name => {
         const value = localNumericInputs[name];
         if (value !== undefined) {
             const cleanedValue = value.replace(',', '.');
             const numericValue = parseFloat(cleanedValue) || 0; 
             
             (finalFormData as any)[name] = numericValue;
         }
      });

      if (finalFormData.valorAluguel < 0 || isNaN(finalFormData.valorAluguel)) {
        setError('O valor do aluguel deve ser um número válido (maior ou igual a zero).');
        setLoading(false);
        return;
      }

      let result: Imovel;
      
      if (isEditing && initialData) {
        result = await atualizarImovel(initialData.id, finalFormData);
        console.log('Imóvel atualizado com sucesso:', result);
      } else {
        // CORRIGIDO: Passa o proprietarioId obtido do hook
        result = await adicionarNovoImovel(finalFormData, proprietarioId);
        console.log('Imóvel adicionado com sucesso:', result);
      }
      
      router.push(`/imoveis/${result.id}`); // Redireciona para o novo Hub de Detalhes

    } catch (err: any) {
      console.error('Erro na operação de imóvel:', err);
      setError(`Falha ao ${isEditing ? 'atualizar' : 'adicionar'} o imóvel. Detalhe: ${err.message || 'Erro desconhecido.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Componentes de Passo (Renderização Condicional)
  const renderStepContent = () => {
    
    // Função auxiliar para obter o valor de exibição
    const getDisplayValue = (name: string, currentValue: number) => {
        const localValue = localNumericInputs[name];
        // Prioriza o valor string do estado local (digitado). Se não estiver sendo digitado, usa o valor numérico (convertido para string ou vazio se 0)
        return localValue !== undefined ? localValue : (currentValue === 0 ? '' : String(currentValue));
    };
    
    // Função auxiliar para renderizar Input Numérico (substitui o NumericInput component)
    const renderNumericInput = (name: string, label: string, currentValue: number, placeholder?: string) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input
                id={name}
                name={name}
                type="text" 
                required
                value={getDisplayValue(name, currentValue)}
                onChange={handleChange}
                onBlur={handleBlur} // Usa o handler de consolidação
                placeholder={placeholder}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
            />
        </div>
    );

    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">1. Classificação e Finalidade</h3>
                    
                    {/* Seleção de Categoria Principal */}
                    <div>
                        <label htmlFor="categoriaPrincipal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria Principal</label>
                        <select
                            id="categoriaPrincipal"
                            name="categoriaPrincipal"
                            required
                            value={formData.categoriaPrincipal}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        >
                            {IMÓVEIS_HIERARQUIA.map(c => (
                                <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
                            ))}
                        </select>
                    </div>

                    {/* Seleção de Tipo Detalhado (Cascata) */}
                    <div>
                        <label htmlFor="tipoDetalhado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo e Subtipo Detalhado</label>
                        <select
                            id="tipoDetalhado"
                            name="tipoDetalhado"
                            required
                            value={formData.tipoDetalhado}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
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
                    
                    {/* Seleção de Múltiplas Finalidades */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Finalidade do Imóvel (Múltipla Seleção)</label>
                        <div className="flex flex-wrap gap-2">
                            {finalidadesDisponiveis.map((finalidade) => (
                                <button
                                    key={finalidade}
                                    type="button" 
                                    onClick={() => handleFinalidadeChange(finalidade as ImovelFinalidade)}
                                    className={`py-2 px-4 text-sm font-medium rounded-full transition-all duration-150 ${
                                        formData.finalidades.includes(finalidade as ImovelFinalidade)
                                            ? 'bg-blue-100 text-rentou-primary border border-rentou-primary shadow-md' // Selected: Fundo claro, Texto escuro, Borda destaque
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600' // Unselected: Fundo claro, Texto escuro
                                    }`}
                                >
                                    {finalidade}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Campos Título, Endereço, Cidade movidos para cá */}
                    <div>
                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Anúncio</label>
                        <input
                            id="titulo"
                            name="titulo"
                            type="text"
                            required
                            placeholder="Ex: Apartamento de Luxo (Vista para o Mar)"
                            value={formData.titulo}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                    </div>
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                    </div>

                </div>
            );
        case 2:
            return (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">2. Estrutura e Características</h3>
                    
                    {/* Linha: Quartos, Banheiros, Vagas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {renderNumericInput("quartos", "Quartos", formData.quartos)}
                        {renderNumericInput("banheiros", "Banheiros", formData.banheiros)}
                        {renderNumericInput("vagasGaragem", "Vagas de Garagem", formData.vagasGaragem)}
                    </div>

                    {/* Linha: Áreas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {renderNumericInput("areaTotal", "Área Total (m²)", formData.areaTotal)}
                        {renderNumericInput("areaUtil", "Área Útil (m²)", formData.areaUtil)}
                    </div>
                    
                    {/* Campo Andar (Condicional) */}
                    {formData.categoriaPrincipal === 'Residencial' && formData.tipoDetalhado.includes('Apartamento') && (
                        renderNumericInput("andar", "Andar", formData.andar || 0, "Ex: 5")
                    )}

                    {/* Comodidades (Checkboxes) - Layout Inteligente */}
                    <ComodidadesSelector selected={formData.caracteristicas} onSelect={handleCaracteristicaChange} />
                </div>
            );
        case 3:
            return (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">3. Valores e Disponibilidade</h3>
                    
                    {/* Linha: Valor Aluguel e Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {renderNumericInput("valorAluguel", "Valor do Aluguel (R$)", formData.valorAluguel, "3500.00")}
                        
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status do Imóvel</label>
                            <select
                                id="status"
                                name="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                            >
                                <option value="VAGO">VAGO (Pronto para anunciar)</option>
                                <option value="ANUNCIADO">ANUNCIADO (Aguardando locação)</option>
                                <option value="ALUGADO">ALUGADO (Já locado)</option>
                                <option value="MANUTENCAO">MANUTENÇÃO (Indisponível)</option>
                            </select>
                        </div>
                    </div>

                    {/* Linha: Condomínio e IPTU */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                        />
                    </div>

                    {/* Upload de Fotos (Mocked) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Galeria de Fotos (Mock)</label>
                        <div className="mt-1 p-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-md text-center">
                            <p className="text-gray-500 dark:text-gray-400">
                                Funcionalidade de upload de fotos (Cloud Storage) será implementada na fase 2.
                            </p>
                            <p className="text-sm mt-1 text-rentou-primary">Atualmente: {formData.fotos.length} fotos mockadas.</p>
                        </div>
                    </div>
                    
                    {/* Campo Vídeo Tour */}
                    <div>
                        <label htmlFor="linkVideoTour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link do Vídeo Tour (Opcional)</label>
                        <input
                            id="linkVideoTour"
                            name="linkVideoTour"
                            type="url"
                            value={formData.linkVideoTour || ''}
                            onChange={handleChange}
                            placeholder="Ex: https://youtube.com/watch?v=tour"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
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
            );
        default:
            return null;
    }
  };
  
  // Progress Indicator (Smart UI)
  const ProgressIndicator = () => {
    // Calcula a porcentagem de conclusão (Ex: 1/4 = 25%, 4/4 = 100%)
    const percentage = Math.round((currentStep / formSteps.length) * 100);
    const stepName = formSteps[currentStep - 1].name;

    return (
        <div className="space-y-3 mb-6">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex justify-between items-center">
                <span>
                    Etapa {currentStep} de {formSteps.length}: <strong className="text-rentou-primary dark:text-blue-400">{stepName}</strong>
                </span>
            </div>
            
            {/* Barra de Progresso Customizada com Porcentagem Interna */}
            <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-8 overflow-hidden relative">
                {/* Barra Preenchida */}
                <div 
                    className="h-full bg-rentou-primary dark:bg-blue-600 transition-all duration-500 ease-out flex items-center justify-center" 
                    style={{ width: `${percentage}%` }}
                >
                    {/* Texto da Porcentagem (usa position absolute para ficar no centro da área do container) */}
                    <span 
                        className={`absolute inset-0 flex items-center justify-center text-sm font-bold transition-colors duration-200 
                            ${percentage > 15 ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        {percentage}% Completo
                    </span>
                </div>
            </div>
        </div>
    );
  };
  // FIM Progress Indicator

  // --- Helper Components ---
  // Apenas a renderização do NumericInput e CheckboxInput foi mantida aqui
    const renderNumericInput = (name: string, label: string, currentValue: number, placeholder?: string) => {
        // Função auxiliar para obter o valor de exibição
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
                    onBlur={handleBlur} // Usa o handler de consolidação
                    placeholder={placeholder}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
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
        const availableFeatures = ['Piscina', 'Churrasqueira', 'Academia', 'Portaria 24h', 'Mobiliado', 'Aquecimento a Gás', 'Salão de Festas', 'Quintal/Jardim'];
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comodidades/Atrativos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableFeatures.map((feature) => (
                        <button
                            key={feature}
                            type="button" 
                            onClick={() => onSelect(feature)}
                            className={`py-2 px-4 text-sm font-medium rounded-full transition-all duration-150 ${
                                selected.includes(feature)
                                    ? 'bg-blue-100 text-rentou-primary border border-rentou-primary shadow-md' // Selected: Fundo claro, Texto escuro, Borda destaque
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600' // Unselected: Fundo claro, Texto escuro
                            }`}
                        >
                            {feature}
                        </button>
                    ))}
                </div>
            </div>
        );
    };


  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b pb-4">
        {formTitle}
      </h2>
      
      {/* Novo Indicador de Progresso em Barra */}
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
            {/* Botão Voltar - FIX: Adicionado cursor-pointer */}
            {currentStep > 1 && (
                <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center text-gray-500 dark:text-gray-400 hover:text-rentou-primary transition-colors font-medium cursor-pointer"
                >
                    ← Anterior
                </button>
            )}
            
            <div className="flex-1"></div>

            {/* Botão Próximo/Salvar */}
            <button
                type={currentStep === formSteps.length ? 'submit' : 'button'}
                onClick={currentStep < formSteps.length ? handleNextStep : undefined} 
                disabled={loading}
                className={`flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rentou-primary hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary cursor-pointer ${
                  loading 
                    ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                    : ''
                }`}
            >
                {loading 
                    ? (isEditing ? 'Salvando...' : 'Adicionando...') 
                    : (currentStep === formSteps.length ? 'Salvar Imóvel' : 'Próxima Etapa →')}
            </button>
        </div>
        
        {/* Botão de Cancelar - FIX: Adicionado cursor-pointer e hover customizado */}
        <div className="text-center">
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
// src/components/imoveis/FormularioImovel.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NovoImovelData, adicionarNovoImovel, atualizarImovel } from '@/services/ImovelService';
import { Imovel, ImovelCategoria, ImovelFinalidade } from '@/types/imovel'; 
import { IMÓVEIS_HIERARQUIA } from '@/data/imovelHierarchy'; // Importa a nova estrutura

interface FormularioImovelProps {
    initialData?: Imovel;
}

// Define os passos do formulário
const formSteps = [
    { id: 1, name: 'Classificação e Finalidade' }, // Etapa 1 atualizada
    { id: 2, name: 'Estrutura e Área' },
    { id: 3, name: 'Valores e Contrato' },
    { id: 4, name: 'Descrição e Mídia' },
];

const defaultFormData: NovoImovelData = {
    titulo: '',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Venda'], // Padrão
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
    valorAluguel: 0, // Valor pode ser 0 se for apenas venda
    valorCondominio: 0,
    valorIPTU: 0,
    dataDisponibilidade: new Date().toISOString().split('T')[0],
    fotos: [], 
    linkVideoTour: undefined,
    visitaVirtual360: false,
};


/**
 * @fileoverview Formulário multi-step (inteligente) para a criação e edição de imóveis.
 * Implementa a hierarquia de tipos de imóveis.
 */
export default function FormularioImovel({ initialData }: FormularioImovelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Imóvel Existente' : 'Adicionar Novo Imóvel';

  const [formData, setFormData] = useState<NovoImovelData>(() => {
    const initialDataAsNovoImovelData = (initialData || {}) as NovoImovelData; 
    return {
        ...defaultFormData, 
        ...initialDataAsNovoImovelData,
        // Garante que os novos campos tenham valor
        categoriaPrincipal: initialDataAsNovoImovelData.categoriaPrincipal || defaultFormData.categoriaPrincipal,
        tipoDetalhado: initialDataAsNovoImovelData.tipoDetalhado || defaultFormData.tipoDetalhado,
        finalidades: initialDataAsNovoImovelData.finalidades || defaultFormData.finalidades,
        dataDisponibilidade: initialDataAsNovoImovelData.dataDisponibilidade || defaultFormData.dataDisponibilidade,
        andar: initialDataAsNovoImovelData.andar || 0,
    };
  });

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


  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    setFormData((prevData: NovoImovelData) => ({
      ...prevData,
      [name]: (type === 'number') 
                ? parseFloat(value) 
                : (type === 'checkbox') 
                  ? checked 
                  : value,
    }));
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
    
    try {
      if (formData.valorAluguel <= 0 || isNaN(formData.valorAluguel)) {
        setError('O valor do aluguel deve ser um número maior que zero.');
        setLoading(false);
        return;
      }

      let result: Imovel;
      
      if (isEditing && initialData) {
        result = await atualizarImovel(initialData.id, formData);
        console.log('Imóvel atualizado com sucesso:', result);
      } else {
        result = await adicionarNovoImovel(formData);
        console.log('Imóvel adicionado com sucesso:', result);
      }
      
      router.push(`/imoveis/${result.id}`); // Redireciona para o novo Hub de Detalhes

    } catch (err) {
      console.error('Erro na operação de imóvel:', err);
      setError(`Falha ao ${isEditing ? 'atualizar' : 'adicionar'} o imóvel. Tente novamente mais tarde.`);
    } finally {
      setLoading(false);
    }
  };

  // Componentes de Passo (Renderização Condicional)
  const renderStepContent = () => {
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
                                            ? 'bg-rentou-primary text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600'
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
                            placeholder="Ex: Apartamento de Luxo (Vista Mar)"
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
                    {/* ... (Conteúdo da Etapa 2 permanece igual) ... */}
                    
                    {/* Linha: Quartos, Banheiros, Vagas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <NumericInput label="Quartos" name="quartos" value={formData.quartos} onChange={handleChange} min={0} />
                        <NumericInput label="Banheiros" name="banheiros" value={formData.banheiros} onChange={handleChange} min={0} />
                        <NumericInput label="Vagas de Garagem" name="vagasGaragem" value={formData.vagasGaragem} onChange={handleChange} min={0} />
                    </div>

                    {/* Linha: Áreas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <NumericInput label="Área Total (m²)" name="areaTotal" value={formData.areaTotal} onChange={handleChange} min={0} />
                        <NumericInput label="Área Útil (m²)" name="areaUtil" value={formData.areaUtil} onChange={handleChange} min={0} />
                    </div>
                    
                    {/* Campo Andar (Condicional) */}
                    {formData.categoriaPrincipal === 'Residencial' && formData.tipoDetalhado.includes('Apartamento') && (
                        <NumericInput label="Andar" name="andar" value={formData.andar || 0} onChange={handleChange} min={0} placeholder="Ex: 5" />
                    )}

                    {/* Comodidades (Checkboxes) - Layout Inteligente */}
                    <ComodidadesSelector selected={formData.caracteristicas} onSelect={handleCaracteristicaChange} />
                </div>
            );
        // ... (Cases 3 e 4 permanecem iguais) ...
        case 3:
            return (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">3. Valores e Disponibilidade</h3>
                    
                    {/* Linha: Valor Aluguel e Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="valorAluguel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor do Aluguel (R$)</label>
                            <input
                                id="valorAluguel"
                                name="valorAluguel"
                                type="number"
                                step="0.01"
                                min="0.00" // Permite 0 se for apenas Venda/Permuta
                                required
                                placeholder="3500.00"
                                value={formData.valorAluguel}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
                            />
                        </div>
                        
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
                        <NumericInput label="Valor Condomínio (R$)" name="valorCondominio" value={formData.valorCondominio} onChange={handleChange} min={0} placeholder="0.00" />
                        <NumericInput label="Valor IPTU (Mensal R$)" name="valorIPTU" value={formData.valorIPTU} onChange={handleChange} min={0} placeholder="0.00" />
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
  const ProgressIndicator = () => (
    <div className="flex justify-between items-center mb-6">
        {formSteps.map((step) => (
            <div key={step.id} className="flex-1">
                <div className={`text-center ${step.id <= currentStep ? 'text-rentou-primary dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className={`w-8 h-8 mx-auto mb-1 flex items-center justify-center rounded-full border-2 ${step.id === currentStep ? 'bg-rentou-primary text-white border-rentou-primary' : step.id < currentStep ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 dark:border-zinc-600'}`}>
                        {step.id < currentStep ? '✓' : step.id}
                    </div>
                    <span className="text-xs hidden sm:block">{step.name}</span>
                </div>
                {step.id < formSteps.length && (
                    <div className={`h-0.5 w-full -mt-4 mx-auto ${step.id < currentStep ? 'bg-rentou-primary' : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
                )}
            </div>
        ))}
    </div>
  );

  // --- Helper Components ---

  const NumericInput: React.FC<{ label: string; name: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: number; placeholder?: string; }> = ({ label, name, value, onChange, min, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input
            id={name}
            name={name}
            type="number"
            min={min}
            required
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-rentou-primary focus:border-rentou-primary"
        />
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
                                ? 'bg-rentou-primary text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600'
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
                    className="flex items-center text-gray-500 dark:text-gray-400 hover:text-rentou-primary transition-colors font-medium"
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
                className={`flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                  loading 
                    ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                    : 'bg-rentou-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rentou-primary'
                }`}
            >
                {loading 
                    ? (isEditing ? 'Salvando...' : 'Adicionando...') 
                    : (currentStep === formSteps.length ? 'Salvar Imóvel' : 'Próxima Etapa →')}
            </button>
        </div>
        
        {/* Botão de Cancelar */}
        <div className="text-center">
            <button
                type="button"
                onClick={() => router.push('/imoveis')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
            >
                Cancelar
            </button>
        </div>

      </form>
    </div>
  );
}
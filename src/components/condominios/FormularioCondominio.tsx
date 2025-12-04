'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { fetchAddressByCep } from '@/services/CepService';
import { adicionarCondominio, atualizarCondominio } from '@/services/CondominioService';
// IMPORTAR OS SERVIÇOS DE STORAGE
import { uploadCondominioPhotos, deleteFotoCondominio } from '@/services/StorageService'; 
import { Condominio, defaultCondominioData, InfraestruturaCondominio, FaseObra } from '@/types/condominio';
import { Icon } from '@/components/ui/Icon';
import {
    faBuilding, faMapMarkerAlt, faHardHat, faSwimmingPool, 
    faShieldAlt, faUsers, faCar, faCheckCircle, faSpinner, faImages,
    faArrowRight, faArrowLeft, faSave, faLeaf, faConciergeBell,
    faChild, faGlassCheers, faDog, faChartLine, faTrash, faGripVertical, faCloudUploadAlt
} from '@fortawesome/free-solid-svg-icons';

interface FormularioCondominioProps {
    initialData?: Condominio;
}

const steps = [
    { id: 1, title: 'Identidade & Local', icon: faMapMarkerAlt },
    { id: 2, title: 'DNA Construtivo', icon: faHardHat },
    { id: 3, title: 'Estrutura Física', icon: faBuilding },
    { id: 4, title: 'Lazer & Infra', icon: faSwimmingPool },
    { id: 5, title: 'Gestão & Mídia', icon: faUsers },
];

const MAX_PHOTOS = 30;

const InfraSection = ({ title, icon, items, data, onChange }: { title: string, icon: any, items: Array<keyof InfraestruturaCondominio>, data: InfraestruturaCondominio, onChange: (key: keyof InfraestruturaCondominio) => void }) => (
    <div className="mb-6">
        <h5 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase mb-3 flex items-center border-b border-gray-100 dark:border-zinc-700 pb-2">
            <Icon icon={icon} className="mr-2 text-rentou-primary" /> {title}
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((key) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border flex items-center ${
                        data[key]
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                    }`}
                >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${data[key] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-zinc-600'}`}>
                        {data[key] && <Icon icon={faCheckCircle} className="text-white w-2.5 h-2.5" />}
                    </div>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </button>
            ))}
        </div>
    </div>
);

export default function FormularioCondominio({ initialData }: FormularioCondominioProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    
    // Inicialização segura do estado
    const [formData, setFormData] = useState<Condominio>({
        ...defaultCondominioData,
        ...(initialData || {})
    } as Condominio);

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [isStepping, setIsStepping] = useState(false); 
    const [error, setError] = useState<string | null>(null);
    
    // Estado de Fotos melhorado: rastreia se é nova (file) ou existente (url)
    const [photos, setPhotos] = useState<{ file?: File, url: string, isNew: boolean }[]>(
        initialData?.fotos?.map(f => ({ url: f, isNew: false })) || []
    );
    // Lista de URLs antigas para deletar do storage ao salvar
    const [fotosAExcluir, setFotosAExcluir] = useState<string[]>([]);
    
    // Estado para Drag and Drop
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            if (parent === 'progressoObra') {
                setFormData(prev => ({
                    ...prev,
                    progressoObra: {
                        ...(prev.progressoObra || defaultCondominioData.progressoObra!),
                        [child]: Number(value)
                    }
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            const isCheckbox = type === 'checkbox';
            const finalValue = type === 'number' ? Number(value) : (isCheckbox ? (e.target as HTMLInputElement).checked : value);

            setFormData(prev => {
                const newState = {
                    ...prev,
                    [name]: finalValue
                };

                if (['numeroTorres', 'numeroAndares', 'unidadesPorAndar'].includes(name)) {
                    const torres = name === 'numeroTorres' ? Number(finalValue) : (prev.numeroTorres || 0);
                    const andares = name === 'numeroAndares' ? Number(finalValue) : (prev.numeroAndares || 0);
                    const unidades = name === 'unidadesPorAndar' ? Number(finalValue) : (prev.unidadesPorAndar || 0);

                    if (torres > 0 && andares > 0 && unidades > 0) {
                        newState.totalUnidades = torres * andares * unidades;
                    }
                }

                return newState;
            });
        }
    };

    const handleInfraChange = (key: keyof InfraestruturaCondominio) => {
        setFormData(prev => ({
            ...prev,
            infraestrutura: {
                ...prev.infraestrutura,
                [key]: !prev.infraestrutura[key]
            }
        }));
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            setCepLoading(true);
            try {
                const address = await fetchAddressByCep(cep);
                if (address) {
                    setFormData(prev => ({
                        ...prev,
                        endereco: {
                            ...prev.endereco,
                            logradouro: address.logradouro,
                            bairro: address.bairro,
                            cidade: address.localidade,
                            estado: address.uf,
                            cep: cep,
                            complemento: '',
                            numero: '',
                            pais: 'Brasil'
                        }
                    }));
                }
            } catch (err) {
                console.error("Erro CEP", err);
            } finally {
                setCepLoading(false);
            }
        }
    };

    // --- Lógica de Fotos (Upload, Delete, Drag & Drop) ---

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const remainingSlots = MAX_PHOTOS - photos.length;

            if (remainingSlots <= 0) {
                alert(`Limite máximo de ${MAX_PHOTOS} fotos atingido.`);
                return;
            }

            let filesToAdd = selectedFiles;
            if (selectedFiles.length > remainingSlots) {
                alert(`Apenas ${remainingSlots} fotos foram adicionadas para respeitar o limite de ${MAX_PHOTOS}.`);
                filesToAdd = selectedFiles.slice(0, remainingSlots);
            }

            const newPhotos = filesToAdd.map(file => ({
                file,
                url: URL.createObjectURL(file),
                isNew: true // Marca como nova para saber que precisa de upload
            }));
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const removePhoto = (indexToRemove: number) => {
        const photoToRemove = photos[indexToRemove];
        
        // Se for uma foto antiga (já salva no banco), marca para exclusão do Storage
        if (!photoToRemove.isNew) {
            setFotosAExcluir(prev => [...prev, photoToRemove.url]);
        }

        setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessário para permitir o drop
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null) return;

        const newPhotos = [...photos];
        const [draggedItem] = newPhotos.splice(draggedIndex, 1);
        newPhotos.splice(dropIndex, 0, draggedItem);

        setPhotos(newPhotos);
        setDraggedIndex(null);
    };

    // --- Fim Lógica de Fotos ---

    const handleNextStep = () => {
        if (isStepping) return;
        setIsStepping(true);
        setCurrentStep(prev => Math.min(steps.length, prev + 1));
        setTimeout(() => setIsStepping(false), 500); 
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (currentStep < steps.length) {
            handleNextStep();
            return;
        }

        if (isStepping) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Salva/Atualiza os dados básicos primeiro para garantir o ID
            let condominioId = initialData?.id;
            let dadosParaSalvar = { ...formData };

            if (!condominioId) {
                // Cria um novo documento para obter o ID
                const novoCondominio = await adicionarCondominio({ 
                    ...dadosParaSalvar, 
                    fotos: [] // Inicialmente sem fotos
                });
                condominioId = novoCondominio.id;
            }

            if (!condominioId) throw new Error("Falha ao obter ID do condomínio.");

            // 2. Upload das NOVAS fotos para o Storage
            const newFilesToUpload = photos.filter(p => p.isNew && p.file).map(p => p.file!);
            let uploadedUrls: string[] = [];

            if (newFilesToUpload.length > 0) {
                uploadedUrls = await uploadCondominioPhotos(newFilesToUpload, condominioId);
            }

            // 3. Exclui fotos antigas do Storage (Cleanup)
            if (fotosAExcluir.length > 0) {
                // Não esperamos falhas de exclusão bloquearem o salvamento
                Promise.allSettled(fotosAExcluir.map(url => deleteFotoCondominio(url)));
            }

            // 4. Monta o array final de URLs na ordem correta
            let finalPhotoUrls: string[] = [];
            let uploadIndex = 0;

            photos.forEach(photo => {
                if (photo.isNew) {
                    // Se é nova, pega a URL do upload recente
                    if (uploadedUrls[uploadIndex]) {
                        finalPhotoUrls.push(uploadedUrls[uploadIndex]);
                        uploadIndex++;
                    }
                } else {
                    // Se é antiga, mantém a URL existente
                    finalPhotoUrls.push(photo.url);
                }
            });

            // 5. Atualiza o documento com a lista final de URLs de fotos
            await atualizarCondominio(condominioId, { 
                ...dadosParaSalvar,
                fotos: finalPhotoUrls 
            });
            
            router.push('/condominios'); 
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao salvar condomínio');
            setLoading(false);
        }
    };

    // Renderização das etapas
    const renderStep = () => {
        switch (currentStep) {
            case 1: // Identidade
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Condomínio</label>
                                <input required name="nome" value={formData.nome || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white" placeholder="Ex: Grand Splendor Residence" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ (Opcional)</label>
                                <input name="cnpj" value={formData.cnpj || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white" placeholder="00.000.000/0001-00" />
                            </div>
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição Comercial</label>
                             <textarea name="descricao" rows={3} value={formData.descricao || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white" placeholder="Destaques do empreendimento..." />
                        </div>

                        <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                                <Icon icon={faMapMarkerAlt} className="mr-2 text-blue-500" /> Endereço
                            </h4>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1 relative">
                                    <label className="block text-xs text-gray-500 mb-1">CEP</label>
                                    <input 
                                        name="endereco.cep" 
                                        value={formData.endereco.cep || ''} 
                                        onChange={handleChange} 
                                        onBlur={handleCepBlur}
                                        className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white" 
                                    />
                                    {cepLoading && <Icon icon={faSpinner} spin className="absolute right-3 top-8 text-blue-500"/>}
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
                                    <input name="endereco.logradouro" value={formData.endereco.logradouro || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Número</label>
                                    <input name="endereco.numero" value={formData.endereco.numero || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                                    <input name="endereco.bairro" value={formData.endereco.bairro || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                                    <input name="endereco.cidade" value={formData.endereco.cidade || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Estado</label>
                                    <input name="endereco.estado" value={formData.endereco.estado || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            case 2: // DNA Construtivo & Lançamento
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center space-x-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                            <input 
                                type="checkbox" 
                                id="lancamento" 
                                name="lancamento" 
                                checked={!!formData.lancamento} 
                                onChange={handleChange}
                                className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500" 
                            />
                            <label htmlFor="lancamento" className="font-bold text-yellow-800 dark:text-yellow-400 cursor-pointer select-none">
                                Este empreendimento é um Lançamento?
                            </label>
                        </div>
                        
                        {formData.lancamento && (
                            <div className="p-5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                                    <Icon icon={faChartLine} className="mr-2 text-green-500" /> Status da Obra
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400">Fase Atual</label>
                                        <select name="faseObra" value={formData.faseObra || 'BREVE_LANCAMENTO'} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700 dark:text-white">
                                            <option value="BREVE_LANCAMENTO">Breve Lançamento</option>
                                            <option value="LANCAMENTO">Lançamento</option>
                                            <option value="EM_OBRA">Em Obras</option>
                                            <option value="PRONTO_PARA_MORAR">Pronto para Morar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400">Previsão de Entrega</label>
                                        <input type="date" name="dataEntrega" value={formData.dataEntrega || ''} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700 dark:text-white" />
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase text-gray-500">Percentual de Progresso (%)</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {['geral', 'fundacao', 'estrutura', 'alvenaria', 'acabamento'].map(stage => (
                                            <div key={stage}>
                                                <label className="block text-[10px] uppercase text-gray-500 mb-1">{stage}</label>
                                                <input 
                                                    type="number" 
                                                    min="0" max="100"
                                                    name={`progressoObra.${stage}`} 
                                                    value={(formData.progressoObra as any)?.[stage] || 0} 
                                                    onChange={handleChange} 
                                                    className="w-full p-1 text-center text-sm border rounded dark:bg-zinc-700 dark:text-white" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Construtora</label>
                                <input name="construtora" value={formData.construtora || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:text-white" placeholder="Ex: Cyrela, MRV" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Incorporadora</label>
                                <input name="incorporadora" value={formData.incorporadora || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:text-white" placeholder="Opcional" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ano de Construção</label>
                                <input type="number" name="anoConstrucao" value={formData.anoConstrucao || new Date().getFullYear()} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:text-white" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área Total Terreno (m²)</label>
                                <input type="number" name="areaTerrenoTotal" value={formData.areaTerrenoTotal || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:text-white" />
                            </div>
                        </div>
                    </div>
                );

            case 3: // Estrutura Física
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg text-center border border-blue-100 dark:border-zinc-700">
                                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Torres</label>
                                <input type="number" name="numeroTorres" value={formData.numeroTorres || 0} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-blue-300 focus:outline-none dark:text-white" />
                            </div>
                            <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg text-center border border-blue-100 dark:border-zinc-700">
                                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Andares</label>
                                <input type="number" name="numeroAndares" value={formData.numeroAndares || 0} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-blue-300 focus:outline-none dark:text-white" />
                            </div>
                            <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg text-center border border-blue-100 dark:border-zinc-700">
                                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Aptos/Andar</label>
                                <input type="number" name="unidadesPorAndar" value={formData.unidadesPorAndar || 0} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-blue-300 focus:outline-none dark:text-white" />
                            </div>
                             <div className="bg-gray-100 dark:bg-zinc-900 p-4 rounded-lg text-center border border-gray-200 dark:border-zinc-700">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Total Unidades</label>
                                {/* Campo readonly, mas permitimos edição se o usuário quiser sobrescrever, porém o cálculo automático vai sobrescrever se ele editar os outros campos */}
                                <input type="number" name="totalUnidades" value={formData.totalUnidades || 0} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-gray-300 focus:outline-none dark:text-white" />
                            </div>
                        </div>

                        <div className="p-5 border rounded-xl bg-white dark:bg-zinc-800">
                            <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4"><Icon icon={faBuilding} className="mr-2"/> Elevadores & Vagas</h4>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400">Sociais</label>
                                    <input type="number" name="elevadoresSociais" value={formData.elevadoresSociais || 0} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400">Serviço</label>
                                    <input type="number" name="elevadoresServico" value={formData.elevadoresServico || 0} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400">Vagas Visitantes</label>
                                    <input type="number" name="vagasVisitantes" value={formData.vagasVisitantes || 0} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700 dark:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4: // Lazer & Infra
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <InfraSection 
                            title="Lazer & Bem-Estar" icon={faGlassCheers} data={formData.infraestrutura} onChange={handleInfraChange}
                            items={['piscinaAdulto', 'piscinaInfantil', 'piscinaAquecida', 'piscinaRaia', 'saunaSeca', 'saunaUmida', 'spaHidromassagem', 'academia', 'espacoPilates', 'salaoJogos', 'cinema']} 
                        />
                        <InfraSection 
                            title="Esportes & Kids" icon={faChild} data={formData.infraestrutura} onChange={handleInfraChange}
                            items={['quadraPoliesportiva', 'quadraTenis', 'quadraSquash', 'campoFutebol', 'playground', 'brinquedoteca']} 
                        />
                         <InfraSection 
                            title="Social & Gourmet" icon={faGlassCheers} data={formData.infraestrutura} onChange={handleInfraChange}
                            items={['salaoFestas', 'salaoFestasInfantil', 'espacoGourmet', 'churrasqueira', 'fornoPizza']} 
                        />
                         <InfraSection 
                            title="Serviços & Conveniência" icon={faConciergeBell} data={formData.infraestrutura} onChange={handleInfraChange}
                            items={['mercadinho', 'lavanderiaColetiva', 'carWash', 'espacoBeleza', 'homeOffice', 'bicicletario', 'hobbyBox']} 
                        />
                         <InfraSection 
                            title="Pets" icon={faDog} data={formData.infraestrutura} onChange={handleInfraChange}
                            items={['petPlace', 'petCare']} 
                        />
                        <InfraSection 
                            title="Tecnologia & Sustentabilidade" icon={faLeaf} data={formData.infraestrutura} onChange={handleInfraChange}
                            items={['carregadorCarroEletrico', 'painelSolar', 'reusoAgua', 'geradorAreaComum', 'geradorElevadores', 'geradorTotal', 'acessoFacial', 'fechaduraBiometrica']} 
                        />
                    </div>
                );

            case 5: // Gestão & Mídia
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-5 border rounded-xl bg-white dark:bg-zinc-800 border-purple-100 dark:border-purple-900/30">
                            <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-4"><Icon icon={faShieldAlt} className="mr-2"/> Segurança & Portaria</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select name="tipoPortaria" value={formData.tipoPortaria || 'HUMANA_24H'} onChange={handleChange} className="p-3 border rounded-lg dark:bg-zinc-700 dark:text-white">
                                    <option value="HUMANA_24H">Portaria Humana 24h</option>
                                    <option value="HUMANA_DIURNA">Portaria Humana Diurna</option>
                                    <option value="REMOTA/VIRTUAL">Portaria Remota/Virtual</option>
                                    <option value="HIBRIDA">Híbrida</option>
                                    <option value="SEM_PORTARIA">Sem Portaria (Chave/Tag)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Administradora</label>
                                <input name="administradora" value={formData.administradora || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:text-white" placeholder="Ex: Lello" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Condomínio (Médio)</label>
                                <input type="number" name="valorCondominioMedio" value={formData.valorCondominioMedio || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:text-white" placeholder="R$ 800,00" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-700 dark:text-gray-200"><Icon icon={faImages} className="mr-2"/> Galeria do Condomínio</h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${photos.length >= MAX_PHOTOS ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300'}`}>
                                    {photos.length} / {MAX_PHOTOS}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-4 dark:text-gray-400">Arraste as fotos para organizar a ordem de exibição.</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {photos.map((p, i) => (
                                    <div 
                                        key={i} 
                                        draggable 
                                        onDragStart={() => handleDragStart(i)}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDrop={(e) => handleDrop(e, i)}
                                        className={`aspect-square bg-gray-100 dark:bg-zinc-900 rounded-lg overflow-hidden border relative group cursor-move transition-all ${draggedIndex === i ? 'opacity-50 ring-2 ring-blue-500' : 'border-gray-200 dark:border-zinc-700'}`}
                                    >
                                        <img src={p.url} className="w-full h-full object-cover" alt={`Foto ${i}`} />
                                        
                                        {/* Feedback Visual de Nova Foto */}
                                        {p.isNew && (
                                            <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 flex items-center">
                                                <Icon icon={faCloudUploadAlt} className="mr-1" /> Pendente
                                            </div>
                                        )}

                                        {/* Overlay com ações */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                                            <div className="self-end">
                                                <button 
                                                    type="button"
                                                    onClick={() => removePhoto(i)}
                                                    className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-transform hover:scale-110"
                                                    title="Excluir foto"
                                                >
                                                    <Icon icon={faTrash} className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="self-start">
                                                <div className="bg-black/50 text-white px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm flex items-center">
                                                    <Icon icon={faGripVertical} className="mr-1 opacity-70"/> {i + 1}º
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {photos.length < MAX_PHOTOS && (
                                    <label className="aspect-square bg-gray-50 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition hover:border-rentou-primary dark:hover:border-rentou-primary">
                                        <Icon icon={faImages} className="text-gray-400 text-3xl mb-2" />
                                        <span className="text-xs text-gray-500 font-medium">Adicionar Foto</span>
                                        <span className="text-[10px] text-gray-400 mt-1">Máx. {MAX_PHOTOS - photos.length} restantes</span>
                                        <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="mb-8">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-zinc-700 -z-10 rounded-full"></div>
                    <div 
                        className="absolute top-1/2 left-0 h-1 bg-rentou-primary transition-all duration-500 -z-10 rounded-full"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>
                    
                    {steps.map((step) => (
                        <div 
                            key={step.id} 
                            onClick={() => setCurrentStep(step.id)}
                            className={`flex flex-col items-center cursor-pointer group bg-white dark:bg-zinc-900 px-2`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                step.id <= currentStep 
                                ? 'bg-rentou-primary border-rentou-primary text-white shadow-lg scale-110' 
                                : 'bg-gray-50 border-gray-300 text-gray-400 group-hover:border-rentou-primary'
                            }`}>
                                <Icon icon={step.icon} className="w-4 h-4" />
                            </div>
                            <span className={`text-xs mt-2 font-medium transition-colors ${
                                step.id <= currentStep ? 'text-rentou-primary font-bold' : 'text-gray-400'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-gray-100 dark:border-zinc-700 p-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 pb-4 border-b dark:border-zinc-700">
                    {steps[currentStep - 1].title}
                </h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {renderStep()}

                    <div className="flex justify-between mt-8 pt-6 border-t dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={handlePrevStep}
                            disabled={currentStep === 1}
                            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition dark:text-gray-300 dark:border-zinc-600 dark:hover:bg-zinc-800"
                        >
                            <Icon icon={faArrowLeft} className="mr-2" /> Voltar
                        </button>

                        {currentStep < steps.length ? (
                            <button
                                type="button"
                                onClick={handleNextStep}
                                disabled={isStepping}
                                className="px-6 py-2.5 rounded-lg bg-rentou-primary text-white font-medium hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center"
                            >
                                Próximo <Icon icon={faArrowRight} className="ml-2" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading || isStepping}
                                className="px-8 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition flex items-center disabled:opacity-70"
                            >
                                {loading ? <Icon icon={faSpinner} spin className="mr-2"/> : <Icon icon={faSave} className="mr-2"/>}
                                Finalizar Cadastro
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { fetchAddressByCep } from '@/services/CepService';
import { adicionarCondominio, atualizarCondominio } from '@/services/CondominioService';
import { Condominio, defaultCondominioData, InfraestruturaCondominio } from '@/types/condominio';
import { Icon } from '@/components/ui/Icon';
import {
    faBuilding, faMapMarkerAlt, faHardHat, faSwimmingPool, 
    faShieldAlt, faUsers, faCar, faCheckCircle, faSpinner, faImages,
    faArrowRight, faArrowLeft, faSave, faLeaf, faConciergeBell,
    faChild, faGlassCheers, faDog
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
    const [formData, setFormData] = useState<Condominio>(initialData || { ...defaultCondominioData } as Condominio);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [photos, setPhotos] = useState<{ file?: File, url: string }[]>(initialData?.fotos.map(f => ({ url: f })) || []);

    // Handle Input genérico
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            const isCheckbox = type === 'checkbox';
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? Number(value) : (isCheckbox ? (e.target as HTMLInputElement).checked : value)
            }));
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

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newPhotos = Array.from(e.target.files).map(file => ({
                file,
                url: URL.createObjectURL(file)
            }));
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let finalData = { ...formData };
            
            if (initialData && initialData.id) {
                await atualizarCondominio(initialData.id, finalData);
            } else {
                await adicionarCondominio(finalData);
            }
            
            router.push('/imoveis'); 
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar condomínio');
        } finally {
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
                                <input required name="nome" value={formData.nome} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:border-zinc-600" placeholder="Ex: Grand Splendor Residence" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ (Opcional)</label>
                                <input name="cnpj" value={formData.cnpj} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700 dark:border-zinc-600" placeholder="00.000.000/0001-00" />
                            </div>
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
                                        value={formData.endereco.cep} 
                                        onChange={handleChange} 
                                        onBlur={handleCepBlur}
                                        className="w-full p-2 border rounded dark:bg-zinc-700" 
                                    />
                                    {cepLoading && <Icon icon={faSpinner} spin className="absolute right-3 top-8 text-blue-500"/>}
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
                                    <input name="endereco.logradouro" value={formData.endereco.logradouro} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Número</label>
                                    <input name="endereco.numero" value={formData.endereco.numero} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                                    <input name="endereco.bairro" value={formData.endereco.bairro} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                                    <input name="endereco.cidade" value={formData.endereco.cidade} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-500 mb-1">Estado</label>
                                    <input name="endereco.estado" value={formData.endereco.estado} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            case 2: // DNA Construtivo
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center space-x-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                            <input 
                                type="checkbox" 
                                id="lancamento" 
                                name="lancamento" 
                                checked={formData.lancamento} 
                                onChange={handleChange}
                                className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500" 
                            />
                            <label htmlFor="lancamento" className="font-bold text-yellow-800 dark:text-yellow-400 cursor-pointer select-none">
                                Este empreendimento é um Lançamento?
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Construtora</label>
                                <input name="construtora" value={formData.construtora} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700" placeholder="Ex: Cyrela, MRV, Plaenge" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Incorporadora (Opcional)</label>
                                <input name="incorporadora" value={formData.incorporadora || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700" placeholder="Caso diferente da construtora" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ano de Construção / Entrega</label>
                                <input type="number" name="anoConstrucao" value={formData.anoConstrucao} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área Total do Terreno (m²)</label>
                                <input type="number" name="areaTerrenoTotal" value={formData.areaTerrenoTotal || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700" placeholder="Ex: 5000" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Padrão de Acabamento</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {['POPULAR', 'ECONOMICO', 'MEDIO_PADRAO', 'ALTO_PADRAO', 'LUXO'].map(padrao => (
                                    <button
                                        key={padrao}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, padraoAcabamento: padrao as any }))}
                                        className={`p-2 rounded-md text-xs font-bold border transition-all ${
                                            formData.padraoAcabamento === padrao 
                                            ? 'bg-rentou-primary text-white border-rentou-primary' 
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-600'
                                        }`}
                                    >
                                        {padrao.replace('_', ' ')}
                                    </button>
                                ))}
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
                                <input type="number" name="numeroTorres" value={formData.numeroTorres} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-blue-300 focus:outline-none" />
                            </div>
                            <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg text-center border border-blue-100 dark:border-zinc-700">
                                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Andares (Méd.)</label>
                                <input type="number" name="numeroAndares" value={formData.numeroAndares} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-blue-300 focus:outline-none" />
                            </div>
                            <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg text-center border border-blue-100 dark:border-zinc-700">
                                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Aptos/Andar</label>
                                <input type="number" name="unidadesPorAndar" value={formData.unidadesPorAndar} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-blue-300 focus:outline-none" />
                            </div>
                             <div className="bg-gray-100 dark:bg-zinc-900 p-4 rounded-lg text-center border border-gray-200 dark:border-zinc-700">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Total Unidades</label>
                                <input type="number" name="totalUnidades" value={formData.totalUnidades} onChange={handleChange} className="w-full text-center text-xl font-bold bg-transparent border-b border-gray-300 focus:outline-none" />
                            </div>
                        </div>

                        <div className="p-5 border rounded-xl bg-white dark:bg-zinc-800">
                            <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4"><Icon icon={faBuilding} className="mr-2"/> Elevadores</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400">Sociais</label>
                                    <input type="number" name="elevadoresSociais" value={formData.elevadoresSociais} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400">Serviço/Carga</label>
                                    <input type="number" name="elevadoresServico" value={formData.elevadoresServico} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700" />
                                </div>
                            </div>
                        </div>
                        
                         <div className="p-5 border rounded-xl bg-white dark:bg-zinc-800">
                             <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4"><Icon icon={faCar} className="mr-2"/> Estacionamento Visitantes</h4>
                              <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400">Número de Vagas Externas/Visitantes</label>
                                <input type="number" name="vagasVisitantes" value={formData.vagasVisitantes} onChange={handleChange} className="w-full p-2 border rounded mt-1 dark:bg-zinc-700" />
                            </div>
                         </div>
                    </div>
                );

            case 4: // Lazer & Infra
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-[60vh] overflow-y-auto pr-2">
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
                                <select name="tipoPortaria" value={formData.tipoPortaria} onChange={handleChange} className="p-3 border rounded-lg dark:bg-zinc-700">
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
                                <input name="administradora" value={formData.administradora || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700" placeholder="Ex: Lello, Apsa" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Condomínio (Médio)</label>
                                <input type="number" name="valorCondominioMedio" value={formData.valorCondominioMedio || ''} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1 dark:bg-zinc-700" placeholder="R$ 800,00" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4"><Icon icon={faImages} className="mr-2"/> Fotos do Condomínio</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {photos.map((p, i) => (
                                    <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border relative">
                                        <img src={p.url} className="w-full h-full object-cover" alt={`Foto ${i}`} />
                                    </div>
                                ))}
                                <label className="aspect-square bg-gray-50 dark:bg-zinc-800 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition">
                                    <Icon icon={faImages} className="text-gray-400 text-2xl mb-2" />
                                    <span className="text-xs text-gray-500">Adicionar Foto</span>
                                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                </label>
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
            {/* STEPPER HEADER */}
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
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Icon icon={faArrowLeft} className="mr-2" /> Voltar
                        </button>

                        {currentStep < steps.length ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                                className="px-6 py-2.5 rounded-lg bg-rentou-primary text-white font-medium hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center"
                            >
                                Próximo <Icon icon={faArrowRight} className="ml-2" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
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
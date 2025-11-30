'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { adicionarNovoImovel, atualizarImovel, updateImovelFotos } from '@/services/ImovelService'; 
import { uploadImovelPhotos, deleteFotoImovel } from '@/services/StorageService'; 
// NOVO: Importa o serviço de Geocoding
import { fetchCoordinatesByAddress } from '@/services/GeocodingService';
// ATUALIZADO: Importar TODOS os novos tipos, incluindo Cômodos e Responsabilidade
import { Imovel, ImovelCategoria, ImovelFinalidade, NovoImovelData, EnderecoImovel, CondominioData, CozinhaData, SalaData, VarandaData, DispensaData, PiscinaPrivativaData, ResponsavelPagamento, PublicidadeConfig } from '@/types/imovel'; 
// CORREÇÃO DE IMPORTAÇÃO: Importar as listas corretas
import { IMÓVEIS_HIERARQUIA, COMODIDADES_RESIDENCIAIS, BENFEITORIAS_RURAIS } from '@/data/imovelHierarchy'; 
import { useAuthStore } from '@/hooks/useAuthStore';
// Importação do serviço de CEP
import { fetchAddressByCep, CepData } from '@/services/CepService'; 
import { Icon } from '@/components/ui/Icon'; // Importar Icon Componente
import { 
    faSave, faChevronRight, faChevronLeft, faCheckCircle, faImage, faHome, faTrash, faUsers, 
    faTag, faPlusCircle, faMinusCircle, faUtensils, faCouch, faBuilding, faShower, faToilet, 
    faWater, faBed, faArrowLeft, faMapMarkerAlt, faSpinner, faInfoCircle, faShieldAlt, 
    faArrowRight, faStar, faTractor 
} from '@fortawesome/free-solid-svg-icons'; 

interface FormularioImovelProps {
    initialData?: Imovel;
}

// Define os passos do formulário (ATUALIZADO)
const formSteps = [
    { id: 1, name: 'Classificação' },
    { id: 2, name: 'Estrutura & Cômodos' }, 
    { id: 3, name: 'Valores & Responsabilidade' }, 
    { id: 4, name: 'Mídia & Fotos' }, 
];

// --- NOVAS ESTRUTURAS DEFAULT PARA ARRAYS ---

// Item default para Cozinha (usado para inicializar ou adicionar novo)
const defaultCozinhaItem: CozinhaData = {
    tipo: 'FECHADA',
    nomeCustomizado: '', 
    possuiArmarios: false,
    area: 0
};

// Item default para Sala (usado para inicializar ou adicionar novo)
const defaultSalaItem: SalaData = {
    tipo: 'ESTAR',
    nomeCustomizado: '', 
    qtdAssentos: 1,
    area: 0
};

// Item default para Varanda (usado para inicializar ou adicionar novo)
const defaultVarandaItem: VarandaData = {
    tipo: 'SIMPLES',
    nomeCustomizado: '', 
    possuiChurrasqueira: false,
    temFechamentoVidro: false,
    area: 0
};

const defaultPublicidade: PublicidadeConfig = { publicadoRentou: true, publicadoPortaisExternos: false, mostrarEnderecoCompleto: false, mostrarNumero: false, statusPublicacao: 'RASCUNHO' };

// Estruturas default aninhadas (existentes)
const defaultEndereco: EnderecoImovel = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', pais: 'Brasil' };
const defaultCondominio: CondominioData = { possuiCondominio: false, nomeCondominio: '', portaria24h: false, areaLazer: false };
const defaultDispensa: DispensaData = { possuiDispensa: false, prateleirasEmbutidas: false };
const defaultPiscina: PiscinaPrivativaData = { possuiPiscina: false, tipo: 'AZULEJO', aquecida: false }; // NOVO

// MOCK DE CONDOMÍNIOS
const MOCK_CONDOMINIOS = [
    { id: 'c1', nome: 'Edifício Solar da Praça' },
    { id: 'c2', nome: 'Condomínio Alphaville I' },
    { id: 'c3', nome: 'Residencial Jardins' },
];

// --- DEFAULT DATA PRINCIPAL (ATUALIZADO COM OS NOVOS CAMPOS DE ARRAY) ---
const defaultFormData: NovoImovelData = {
    titulo: '',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Locação Residencial'], 
    endereco: defaultEndereco, 
    condominio: defaultCondominio, 
    quartos: 1,
    suites: 0, // NOVO
    banheiros: 1, 
    lavabos: 0, // NOVO
    banheirosServico: 0, // NOVO
    vagasGaragem: 0,
    areaTotal: 0, 
    areaUtil: 0, 
    areaTerreno: 0,
    andar: 1,
    
    piscinaPrivativa: defaultPiscina, // NOVO
    
    // MUDANÇA CRÍTICA: Inicializa com arrays vazios. O usuário deve adicionar.
    cozinhas: [], 
    salas: [],        
    varandas: [],                    
    dispensa: defaultDispensa,      

    descricaoLonga: '',
    caracteristicas: [], 
    aceitaAnimais: false,
    status: 'VAGO',
    valorAluguel: 0, 
    valorCondominio: 0, 
    valorIPTU: 0,
    dataDisponibilidade: new Date().toISOString().split('T')[0],
    
    custoCondominioIncluso: false,
    responsavelCondominio: 'LOCATARIO',
    custoIPTUIncluso: false,
    responsavelIPTU: 'LOCATARIO',
    seguros: [],

    fotos: [], 
    linkVideoTour: undefined,
    visitaVirtual360: false,
    publicidade: defaultPublicidade,
};


const isNumericField = (name: string): boolean => 
    ['quartos', 'suites', 'banheiros', 'lavabos', 'banheirosServico', 'vagasGaragem', 'areaTotal', 'areaUtil', 'areaTerreno', 
     'valorAluguel', 'valorCondominio', 'valorIPTU', 'andar'].includes(name);

// ATUALIZADO: Inicia o estado com a nova estrutura de ARRAY
const getInitialState = (initialData?: Imovel) => {
    const initialDataPayload = initialData || {} as Imovel;

    const initialFormData: NovoImovelData = {
        ...defaultFormData,
        ...(initialDataPayload as any),
        
        // Garante que os objetos aninhados sejam mesclados corretamente
        endereco: { ...defaultEndereco, ...(initialDataPayload.endereco || {}) },
        condominio: { ...defaultCondominio, ...(initialDataPayload.condominio || {}) },
        dispensa: { ...defaultDispensa, ...(initialDataPayload.dispensa || {}) },
        piscinaPrivativa: { ...defaultPiscina, ...(initialDataPayload.piscinaPrivativa || {}) }, // NOVO
        publicidade: { ...defaultPublicidade, ...(initialDataPayload.publicidade || {}) },
        
        // Prioriza os arrays do initialData. Se não existirem, usa arrays vazios.
        cozinhas: (initialDataPayload.cozinhas?.length > 0) ? initialDataPayload.cozinhas : [],
        salas: (initialDataPayload.salas?.length > 0) ? initialDataPayload.salas : [],
        varandas: (initialDataPayload.varandas?.length > 0) ? initialDataPayload.varandas : [],

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
    
    // Inclui novos campos de contagem na inicialização de inputs locais
    const numericFields = Object.keys(defaultFormData).filter(isNumericField);
    numericFields.forEach(keyString => {
        const numericValue = (initialFormData as any)[keyString] as number;
        initialLocalInputs[keyString] = String(numericValue === 0 ? '' : numericValue);
    });
    
    return { initialFormData, initialLocalInputs };
};


// --- COMPONENTES AUXILIARES DEFINIDOS ANTES DO EXPORT DEFAULT ---

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1 align-middle z-50">
        <Icon icon={faInfoCircle} className="w-3.5 h-3.5 text-gray-400 hover:text-rentou-primary cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
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
            className="h-4 w-4 text-rentou-primary border-gray-300 rounded focus:ring-rentou-primary focus:border-rentou-primary"
        />
        <div className="flex flex-col">
            <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
    </div>
);

const SelectResponsabilidade: React.FC<{ label: string, name: string, value: ResponsavelPagamento, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            {label}
            <Tooltip text="Se 'Locatário', ele paga o boleto. Se 'Proprietário', você paga (e pode cobrar no aluguel)." />
        </label>
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

const ComodidadesSelector: React.FC<{ selected: string[]; onSelect: (caracteristica: string) => void }> = ({ selected, onSelect }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comodidades/Atrativos</label>
        <div className="flex flex-wrap gap-2">
            {/* CORRIGIDO: Usando a lista importada do arquivo hierarchy */}
            {COMODIDADES_RESIDENCIAIS.map((feature: string) => (
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
// --- FIM COMPONENTES AUXILIARES ---

// --- COMPONENTES DE GRUPO DINÂMICO ---
// Componente de controle para adição/remoção (sem quebrar a estilização)
interface RoomGroupControlsProps {
    onAdd: () => void;
    onRemove: (index: number) => void;
    index: number;
    count: number;
}

const RoomGroupControls: React.FC<RoomGroupControlsProps> = ({ onAdd, onRemove, index, count }) => (
    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-zinc-700 mt-4">
        {count > 0 && (
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="flex items-center text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
            >
                <Icon icon={faMinusCircle} className="w-4 h-4 mr-1" /> Remover
            </button>
        )}
        {index === count - 1 && ( // Apenas o último item tem o botão Adicionar
            <button
                type="button"
                onClick={onAdd}
                className="flex items-center text-green-600 hover:text-green-800 transition-colors text-sm font-medium"
            >
                <Icon icon={faPlusCircle} className="w-4 h-4 mr-1" /> Adicionar Outro
            </button>
        )}
    </div>
);

// Sub-Formulário para Cozinhas (usado dentro do loop)
const CozinhaGroup: React.FC<{ item: CozinhaData, index: number, onChange: (name: string, value: any) => void, onAdd: () => void, onRemove: (index: number) => void, count: number }> = ({ item, index, onChange, onAdd, onRemove, count }) => {
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        onChange(name, type === 'checkbox' ? (e.target as HTMLInputElement).checked : value);
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-700">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                 <Icon icon={faUtensils} className="w-4 h-4 mr-2" /> {item.nomeCustomizado || `Cozinha ${index + 1}`}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`cozinha-${index}-tipo`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Cozinha</label>
                    <select id={`cozinha-${index}-tipo`} name="tipo" value={item.tipo || ''} onChange={handleLocalChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md">
                        <option value="" disabled>Selecione o Tipo...</option>
                        <option value="FECHADA">Fechada (Padrão)</option>
                        <option value="AMERICANA">Americana</option>
                        <option value="GOURMET">Gourmet</option>
                        <option value="ILHA">Com Ilha</option>
                        <option value="INTEGRADA">Integrada (Loft)</option>
                        <option value="INDUSTRIAL">Industrial</option>
                        <option value="DE_SERVICO">De Serviço (Secundária)</option>
                        <option value="COPA_COZINHA">Copa Cozinha</option>
                        <option value="OUTRA">Outra / Não Listada</option>
                    </select>
                </div>
                <div>
                    <label htmlFor={`cozinha-${index}-nome`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome (Ex: Gourmet)</label>
                    <input id={`cozinha-${index}-nome`} name="nomeCustomizado" type="text" value={item.nomeCustomizado || ''} onChange={handleLocalChange} placeholder={`Cozinha ${index + 1}`} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                </div>
            </div>
            
            {/* NOVO: Campo de Área */}
            <div className="grid grid-cols-2 gap-4 mt-2">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área (m²)</label>
                    <input type="number" name="area" value={item.area || ''} onChange={(e) => onChange('area', parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                 </div>
                 <div className="flex items-center pt-6">
                     <CheckboxInput 
                        label="Possui Armários Planejados?" 
                        name="possuiArmarios" 
                        checked={item.possuiArmarios || false} 
                        onChange={handleLocalChange} 
                    />
                 </div>
            </div>
            
            <RoomGroupControls onAdd={onAdd} onRemove={onRemove} index={index} count={count} />
        </div>
    );
};

// Sub-Formulário para Salas
const SalaGroup: React.FC<{ item: SalaData, index: number, onChange: (name: string, value: any) => void, onAdd: () => void, onRemove: (index: number) => void, count: number }> = ({ item, index, onChange, onAdd, onRemove, count }) => {
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        onChange(name, type === 'number' ? parseInt(value) : value);
    };

    return (
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-zinc-700/50">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                 <Icon icon={faCouch} className="w-4 h-4 mr-2" /> {item.nomeCustomizado || `Sala ${index + 1}`}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor={`sala-${index}-tipo`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Sala</label>
                    <select id={`sala-${index}-tipo`} name="tipo" value={item.tipo || ''} onChange={handleLocalChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md">
                        <option value="" disabled>Selecione o Tipo...</option>
                        <option value="ESTAR">Estar</option>
                        <option value="JANTAR">Jantar</option>
                        <option value="TV">TV / Home Theater</option>
                        <option value="ESCRITORIO">Escritório</option>
                        <option value="HOME_OFFICE">Home Office (Dedicado)</option>
                        <option value="CINEMA">Cinema (Dedicado)</option>
                        <option value="JOGOS">Jogos</option>
                        <option value="CONJUGADA">Conjugada (Estar/Jantar)</option>
                        <option value="OUTRA">Outra / Não Listada</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor={`sala-${index}-nome`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome (Ex: de Estar)</label>
                    <input id={`sala-${index}-nome`} name="nomeCustomizado" type="text" value={item.nomeCustomizado || ''} onChange={handleLocalChange} placeholder={`Sala ${index + 1}`} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
                 <div>
                     <label htmlFor={`sala-${index}-assentos`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacidade (Assentos Estimação)</label>
                     <input id={`sala-${index}-assentos`} name="qtdAssentos" type="text" value={item.qtdAssentos || 0} onChange={handleLocalChange} placeholder="4" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                 </div>
                 {/* NOVO: Campo de Área */}
                 <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área (m²)</label>
                     <input type="number" name="area" value={item.area || 0} onChange={(e) => onChange('area', parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                 </div>
            </div>

            <RoomGroupControls onAdd={onAdd} onRemove={onRemove} index={index} count={count} />
        </div>
    );
};

// Sub-Formulário para Varandas
const VarandaGroup: React.FC<{ item: VarandaData, index: number, onChange: (name: string, value: any) => void, onAdd: () => void, onRemove: (index: number) => void, count: number }> = ({ item, index, onChange, onAdd, onRemove, count }) => {
     const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        onChange(name, type === 'checkbox' ? (e.target as HTMLInputElement).checked : value);
    };
    
    return (
        <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-zinc-700/50">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                 <Icon icon={faBuilding} className="w-4 h-4 mr-2" /> {item.nomeCustomizado || `Varanda ${index + 1}`}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`varanda-${index}-tipo`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Varanda</label>
                    <select id={`varanda-${index}-tipo`} name="tipo" value={item.tipo || ''} onChange={handleLocalChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md">
                        <option value="" disabled>Selecione o Tipo...</option>
                        <option value="SIMPLES">Simples (Aberto)</option>
                        <option value="GOURMET">Gourmet (Com Infra)</option>
                        <option value="FECHADA">Fechada (Vidro/Reiki)</option>
                        <option value="TERRACO">Terraço</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor={`varanda-${index}-nome`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome (Ex: Social)</label>
                    <input id={`varanda-${index}-nome`} name="nomeCustomizado" type="text" value={item.nomeCustomizado || ''} onChange={handleLocalChange} placeholder={`Varanda ${index + 1}`} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                </div>
            </div>
            
             {/* NOVO: Campo de Área */}
             <div className="mt-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área (m²)</label>
                 <input type="number" name="area" value={item.area || ''} onChange={(e) => onChange('area', parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                 <CheckboxInput label="Possui Churrasqueira?" name="possuiChurrasqueira" checked={item.possuiChurrasqueira || false} onChange={handleLocalChange} description="Infraestrutura ou churrasqueira embutida." />
                 <CheckboxInput label="Fechamento de Vidro (Reiki)?" name="temFechamentoVidro" checked={item.temFechamentoVidro || false} onChange={handleLocalChange} description="Painéis deslizantes de vidro." />
            </div>

            <RoomGroupControls onAdd={onAdd} onRemove={onRemove} index={index} count={count} />
        </div>
    );
};
// --- FIM COMPONENTES DE GRUPO DINÂMICO ---


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
    
    // --- ESTADOS DE UI ADICIONADOS PARA FEEDBACK ---
    const [cepLoading, setCepLoading] = useState(false);
    const [cepSuccess, setCepSuccess] = useState(false);

    const { initialFormData, initialLocalInputs } = useMemo(() => getInitialState(initialData), [initialData]);

    const [localNumericInputs, setLocalNumericInputs] = useState<Record<string, string>>(initialLocalInputs);
    const [formData, setFormData] = useState<NovoImovelData>(initialFormData);
    
    // --- ESTADO DE GERENCIAMENTO DE FOTOS (Melhorado para ordenação) ---
    const [photoList, setPhotoList] = useState<{ url?: string, file?: File, isNew: boolean }[]>([]);
    const [fotosAExcluir, setFotosAExcluir] = useState<string[]>([]);
    const MAX_PHOTOS = 25;

    // Inicializa lista de fotos
    useEffect(() => {
        if (initialData?.fotos) {
            setPhotoList(initialData.fotos.map(url => ({ url, isNew: false })));
        }
    }, [initialData]);

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

    // --- CORRIGIDO: Lógica de Alteração Centralizada (Objetos Simples) ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const target = e.target;
        const isCheckbox = type === 'checkbox';
        
        // 1. Lida com campos aninhados (Objetos Simples: Endereço, Condomínio, Dispensa, PiscinaPrivativa)
        if (name.includes('.')) {
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

            // Tratamento para objetos aninhados (Condomínio, Dispensa, Endereço, PiscinaPrivativa)
             if (subKey && (mainKey === 'endereco' || mainKey === 'condominio' || mainKey === 'dispensa' || mainKey === 'piscinaPrivativa')) {
                 setFormData(prevData => ({
                    ...prevData,
                    [mainKey]: { 
                        ...(prevData[mainKey] as any), 
                        [subKey]: isCheckbox ? (target as HTMLInputElement).checked : value 
                    },
                }));
                return;
            }
        }

        // 2. Lida com campos no primeiro nível
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
    // --- FIM Lógica de Alteração Centralizada (Objetos Simples) ---

    // --- LÓGICA DE MANIPULAÇÃO DE ARRAYS (Cômodos Múltiplos) ---

    // Handler genérico para adicionar item
    const addRoom = useCallback((key: keyof NovoImovelData) => {
        setFormData(prevData => {
            let newItem: CozinhaData | SalaData | VarandaData;
            if (key === 'cozinhas') newItem = { ...defaultCozinhaItem, nomeCustomizado: '' }; // Nome customizado vazio para forçar preenchimento
            else if (key === 'salas') newItem = { ...defaultSalaItem, nomeCustomizado: '' }; 
            else if (key === 'varandas') newItem = { ...defaultVarandaItem, nomeCustomizado: '' }; 
            else return prevData;

            return {
                ...prevData,
                [key]: [...(prevData[key] as any[]), newItem],
            } as NovoImovelData;
        });
    }, []);
    
    // Handler genérico para remover item
    const removeRoom = useCallback((key: keyof NovoImovelData, index: number) => {
        setFormData(prevData => {
            const list = (prevData[key] as any[]).filter((_, i) => i !== index);
            return {
                ...prevData,
                [key]: list,
            } as NovoImovelData;
        });
    }, []);

    // Handler genérico para alterar item dentro do array
    const handleRoomChange = useCallback((key: keyof NovoImovelData, index: number, field: string, value: any) => {
         setFormData(prevData => {
            const list = [...(prevData[key] as any[])];
            const updatedItem = {
                ...list[index],
                [field]: value,
            };
            list[index] = updatedItem;
            return {
                ...prevData,
                [key]: list,
            } as NovoImovelData;
        });
    }, []);

    // --- FIM LÓGICA DE MANIPULAÇÃO DE ARRAYS ---


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

    // --- FUNÇÃO PARA BUSCAR ENDEREÇO POR CEP (Mantida e Melhorada) ---
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
            setCepLoading(true); // Feedback visual on
            setCepSuccess(false);
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
                    
                    setCepSuccess(true); // Feedback sucesso
                    // setError(`CEP ${localNumericInputs['endereco.cep']} encontrado! Logradouro, Bairro, Cidade/UF preenchidos automaticamente. Não se esqueça de adicionar o NÚMERO!`);
                    
                } else {
                    setError('CEP não encontrado ou inválido. Digite o endereço manualmente.');
                }
            } catch (err) {
                setError('Erro ao se comunicar com o serviço de CEP.');
            } finally {
                setLoading(false);
                setCepLoading(false); // Feedback off
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
    
    // --- Handlers de Foto (CORRIGIDOS COM ORDENAÇÃO) ---
    const getAvailableSlots = useCallback(() => {
        // Usa a nova lista unificada
        const totalPhotos = photoList.length;
        return MAX_PHOTOS - totalPhotos;
    }, [photoList]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Alias para manter compatibilidade com o nome antigo, mas usando a nova lógica
        handlePhotoUpload(e);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const available = getAvailableSlots();
            
            if (filesArray.length > available) {
                setError(`Você só pode adicionar mais ${available} fotos.`);
                e.target.value = ''; 
                return;
            }

            const newPhotos = filesArray.map(file => ({
                file,
                isNew: true,
                url: URL.createObjectURL(file)
            }));
            
            setPhotoList(prev => [...prev, ...newPhotos]);
            setNovasFotos(prev => [...prev, ...filesArray]); // Mantém sync
            
            e.target.value = ''; 
            setError(null);
        }
    };

    const handleRemoveNewPhoto = (index: number) => {
        // Adaptação: Na nova lógica, removePhoto funciona para ambos.
        // Mas se o índice vier da lista separada antiga, precisamos achar na nova.
        // Para segurança, usamos a nova função removePhoto que opera na lista unificada.
        removePhoto(index); 
    };
    
    const movePhoto = (index: number, direction: -1 | 1) => {
        const newPhotos = [...photoList];
        // Caso especial: Definir Capa (mover para index 0)
        if (direction === -index) {
             const item = newPhotos.splice(index, 1)[0];
             newPhotos.unshift(item);
        } else {
            if (index + direction < 0 || index + direction >= newPhotos.length) return;
            const temp = newPhotos[index];
            newPhotos[index] = newPhotos[index + direction];
            newPhotos[index + direction] = temp;
        }
        setPhotoList(newPhotos);
    };

    const removePhoto = (index: number) => {
        const item = photoList[index];
        if (!item.isNew && item.url) {
             // Marca para exclusão
             setFotosAExcluir(prev => [...prev, item.url!]);
        } else if (item.isNew && item.file) {
             // Remove da lista de uploads pendentes
             setNovasFotos(prev => prev.filter(f => f !== item.file));
        }
        // Remove visualmente
        setPhotoList(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleExistingPhoto = (url: string) => {
        // Wrapper para manter compatibilidade se chamado diretamente
        // Mas na nova UI usamos removePhoto
        setFotosAExcluir(prev => {
            if (prev.includes(url)) return prev.filter(u => u !== url); 
            return [...prev, url]; 
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
            // Se houver cômodos dinâmicos, verifica se o tipo foi selecionado.
            if (formData.cozinhas.some(c => !c.tipo) || formData.salas.some(s => !s.tipo) || formData.varandas.some(v => !v.tipo)) {
                 setError("Certifique-se de que o campo 'Tipo' está selecionado para todos os Cômodos dinâmicos adicionados.");
                 return;
             }
             if (formData.suites > formData.quartos) {
                 setError("O número de suítes não pode ser maior que o número total de quartos.");
                 return;
             }
        }

        // Consolidação de Valores Numéricos
        const numericFieldsToConsolidar: string[] = ['areaTotal', 'areaUtil', 'valorAluguel', 'valorCondominio', 'valorIPTU'];
        if (currentStep === 2) {
             numericFieldsToConsolidar.push('quartos', 'suites', 'banheiros', 'lavabos', 'banheirosServico', 'vagasGaragem', 'andar', 'areaTerreno'); 
        }
        
        numericFieldsToConsolidar.forEach(name => {
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
            // Cria um payload que pode incluir as novas coordenadas (latitude/longitude)
            let finalFormData: NovoImovelData & Partial<Pick<Imovel, 'latitude' | 'longitude'>> = { ...formData };
            
            // 1. CONSOLIDAÇÃO FINAL DE VALORES NUMÉRICOS
            const finalNumericFields = ['valorAluguel', 'valorCondominio', 'valorIPTU', 'quartos', 'suites', 'banheiros', 'lavabos', 'banheirosServico', 'vagasGaragem', 'areaTotal', 'areaUtil', 'areaTerreno', 'andar'];
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
            
            // FILTRA PROPRIEDADES vazias e arrays vazios (para não salvar lixo)
            finalFormData.cozinhas = finalFormData.cozinhas.filter(c => c.tipo);
            finalFormData.salas = finalFormData.salas.filter(s => s.tipo);
            finalFormData.varandas = finalFormData.varandas.filter(v => v.tipo);
            
            
            // 2. OBTENÇÃO DE COORDENADAS (GEOCODING) - SALVAMENTO PERSISTENTE
            let { latitude, longitude } = initialData || {};

            // Verifica se o endereço mudou (comparando campos chave)
            const addressChanged = isEditing && (
                initialData!.endereco.cep !== finalFormData.endereco.cep ||
                initialData!.endereco.numero !== finalFormData.endereco.numero ||
                initialData!.endereco.logradouro !== finalFormData.endereco.logradouro
            );
            
            // Se for um novo imóvel OU se o endereço mudou, ou se as coordenadas estiverem faltando, tentamos o Geocoding
            if (!isEditing || addressChanged || (!latitude || !longitude)) {
                const coords = await fetchCoordinatesByAddress(finalFormData.endereco);
                if (coords) {
                    latitude = coords.latitude;
                    longitude = coords.longitude;
                } else {
                    // Erro de Geocoding: Adiciona um aviso, mas continua com o save (sem coordenadas no DB)
                    console.warn("Falha no Geocoding. O mapa pode não ser exibido corretamente.");
                }
            }

            // Adiciona as coordenadas ao payload de submissão
            if (latitude !== undefined && longitude !== undefined) {
                finalFormData.latitude = latitude;
                finalFormData.longitude = longitude;
            }


            // 3. Cria ou atualiza o Imóvel no Firestore (sem a lista final de fotos)
            let result: Imovel;
            
            if (isEditing && initialData) {
                // Ao atualizar, o payload de update inclui as novas coordenadas (latitude/longitude)
                const updatePayload = {
                    ...finalFormData, 
                    fotos: initialData.fotos, // Mantém as fotos antigas por enquanto
                } as Imovel; 
                
                result = await atualizarImovel(initialData.id, updatePayload);
            } else {
                // Ao criar, o payload é NovoImovelData + as coordenadas
                result = await adicionarNovoImovel(finalFormData as NovoImovelData, proprietarioId);
            }
            
            // 4. Processa as fotos (excluir/upload)
            
            // A. Excluir fotos marcadas (se for edição)
            if (fotosAExcluir.length > 0 && isEditing) {
                const deletePromises = fotosAExcluir.map(url => deleteFotoImovel(url));
                await Promise.all(deletePromises);
            }
            
            // B. Upload de novas fotos
            // Filtra da photoList quem é novo
            const newFilesToUpload = photoList.filter(p => p.isNew).map(p => p.file!);
            let uploadedUrls: string[] = [];
            
            if (newFilesToUpload.length > 0) {
                 uploadedUrls = await uploadImovelPhotos(newFilesToUpload, result.smartId);
            }

            // 5. Atualiza o documento Imóvel no Firestore com a lista FINAL de URLs NA ORDEM CERTA
            // Reconstrói o array final de URLs baseando-se na ordem visual de photoList
            let finalPhotoUrls: string[] = [];
            let uploadIndex = 0;

            photoList.forEach(item => {
                if (item.isNew) {
                    // Pega a URL do array de uploads recém feitos
                    if (uploadedUrls[uploadIndex]) {
                        finalPhotoUrls.push(uploadedUrls[uploadIndex]);
                        uploadIndex++;
                    }
                } else if (item.url && !fotosAExcluir.includes(item.url)) {
                    // Mantém a URL antiga
                    finalPhotoUrls.push(item.url);
                }
            });

            // Atualiza se houve mudanças
            if (newFilesToUpload.length > 0 || fotosAExcluir.length > 0 || finalPhotoUrls.length !== initialData?.fotos?.length) {
                 await updateImovelFotos(result.id, finalPhotoUrls);
            }
            
            router.push(`/imoveis/${result.smartId}`); // Redireciona usando o Smart ID

        } catch (err: any) {
            console.error('Erro na operação de imóvel:', err);
            setError(`Falha ao ${isEditing ? 'atualizar' : 'adicionar'} o imóvel. Detalhe: ${err.message || 'Erro desconhecido.'}. **Verifique o console e o Geocoding!**`);
        } finally {
            setLoading(false);
        }
    };
    
    // NOVO: Componente Stepper Visual (Inserido conforme esboço)
    const ProgressIndicator = () => {
        const percentage = formSteps.length > 1 ? Math.round(((currentStep - 1) / (formSteps.length - 1)) * 100) : 100;

        return (
            <div className="mb-10 px-2 animate-in fade-in slide-in-from-top-5">
                <div className="flex justify-between relative mb-4">
                    {formSteps.map((step, index) => {
                        const isActive = step.id <= currentStep;
                        return (
                            <div 
                                key={step.id} 
                                className={`flex flex-col items-center z-10 transition-transform duration-300 ${isActive ? 'scale-105' : 'scale-100'} w-1/4`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 shadow-lg border-4 ${
                                    isActive ? 'bg-rentou-primary dark:bg-blue-600 border-white dark:border-zinc-800' : 'bg-gray-300 dark:bg-zinc-600 border-white dark:border-zinc-800'
                                }`}>
                                    {step.id < currentStep ? <Icon icon={faCheckCircle} className="w-5 h-5" /> : step.id}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wide mt-2 font-bold text-center ${isActive ? 'text-rentou-primary dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {step.name}
                                </span>
                            </div>
                        );
                    })}
                    {/* Linha de progresso fundo */}
                    <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 dark:bg-zinc-700 -z-10 transform -translate-y-1/2 mx-5">
                         <div 
                            className="h-full bg-rentou-primary dark:bg-blue-600 transition-all duration-500 ease-out" 
                            style={{ width: `${percentage}%` }}
                        ></div>
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

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in">
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

                        {/* --- SEÇÃO ENDEREÇO DETALHADO (Mantida + Feedback Visual) --- */}
                        <div className='space-y-4 p-4 border rounded-lg border-gray-200 dark:border-zinc-700'>
                             <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center mb-3">
                                <Icon icon={faHome} className="w-4 h-4 mr-2" /> Endereço Completo
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1 relative">
                                    <label htmlFor="endereco.cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CEP</label>
                                    <input
                                        id="endereco.cep"
                                        name="endereco.cep"
                                        type="text"
                                        value={localNumericInputs['endereco.cep'] || ''}
                                        onChange={handleChange}
                                        onBlur={handleCepBlur}
                                        required
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className={`mt-1 block w-full px-3 py-2 pr-10 border ${cepSuccess ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'} dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary`}
                                        disabled={loading}
                                    />
                                    {/* SPINNER E CHECK DE SUCESSO DO CEP */}
                                    <div className="absolute right-3 top-9 flex items-center pointer-events-none">
                                        {cepLoading && <Icon icon={faSpinner} spin className="text-blue-500" />}
                                        {cepSuccess && <Icon icon={faCheckCircle} className="text-green-500" />}
                                    </div>
                                </div>
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
                            
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
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

                            <div className="grid grid-cols-3 gap-4 mt-4">
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
                            {cepSuccess && <p className="text-xs text-green-600 font-medium flex items-center mt-2"><Icon icon={faCheckCircle} className="mr-1"/> Endereço localizado com sucesso.</p>}
                        </div>
                        {/* --- FIM: SEÇÃO ENDEREÇO DETALHADO --- */}

                        {/* --- OPÇÕES DE CONDOMÍNIO (MELHORADO COM SELECT E BOTÃO NOVO) --- */}
                         <div className='space-y-4 p-4 border border-blue-200 dark:border-blue-900/50 rounded-lg bg-blue-50 dark:bg-zinc-700/50'>
                             <h4 className="text-lg font-semibold text-rentou-primary dark:text-blue-400 mb-3 flex items-center">
                                <Icon icon={faBuilding} className="mr-2"/> Informações de Condomínio
                             </h4>
                             <CheckboxInput 
                                label="O imóvel está localizado em Condomínio/Edifício?" 
                                name="condominio.possuiCondominio" 
                                checked={formData.condominio?.possuiCondominio || false} 
                                onChange={handleChange} 
                            />
                            
                            {formData.condominio?.possuiCondominio && (
                                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                    {/* BUSCA INTELIGENTE DE CONDOMÍNIO */}
                                    <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecionar Condomínio Cadastrado</label>
                                        <div className="flex gap-2">
                                            <select 
                                                className="flex-1 p-2 border rounded-md text-sm"
                                                onChange={(e) => {
                                                    const selectedId = e.target.value;
                                                    if(selectedId === 'new') {
                                                        alert("Funcionalidade: Abrir modal de cadastro completo de condomínio (com fotos e infra).");
                                                        return;
                                                    }
                                                    const condo = MOCK_CONDOMINIOS.find(c => c.id === selectedId);
                                                    if(condo) {
                                                        setFormData(prev => ({
                                                            ...prev, 
                                                            condominio: { ...prev.condominio, nomeCondominio: condo.nome, condominioCadastradoId: condo.id }
                                                        }));
                                                    }
                                                }}
                                            >
                                                <option value="">Selecione um condomínio...</option>
                                                {MOCK_CONDOMINIOS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                                <option value="new">+ Cadastrar Novo Condomínio</option>
                                            </select>
                                            <button type="button" className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold uppercase shadow-sm" onClick={() => alert("Abrir modal de cadastro de condomínio")}>
                                                Novo
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="condominio.nomeCondominio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Condomínio/Edifício (Manual)</label>
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
                                maxLength={100}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary"
                            />
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-gray-500">Recomendado: 40-60 caracteres.</p>
                                <p className={`text-xs ${formData.titulo.length > 60 ? 'text-green-600' : 'text-gray-500'}`}>{formData.titulo.length}/100</p>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">2. Estrutura e Cômodos</h3>
                        
                        {/* LÓGICA RURAL VS URBANA */}
                        {formData.categoriaPrincipal === 'Rural' ? (
                            <div className="p-4 border-l-4 border-green-600 bg-green-50 dark:bg-green-900/20 rounded-r-lg mb-6 animate-in slide-in-from-left-2">
                                <h4 className="font-bold text-green-800 dark:text-green-300 flex items-center mb-4 text-lg">
                                    <Icon icon={faTractor} className="mr-2"/> Estrutura da Propriedade Rural
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        {renderNumericInput('areaTotal', 'Área Total (Hectares)', formData.areaTotal, 'Ex: 45.5')}
                                    </div>
                                    <div className="flex items-end pb-2">
                                         <CheckboxInput label="Possui Casa Sede?" name="possuiCasaSede" checked={false} onChange={() => {}} description="Marque se houver residência principal." />
                                    </div>
                                </div>

                                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Benfeitorias e Estruturas Rurais</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white dark:bg-zinc-800 rounded border border-gray-200">
                                    {(BENFEITORIAS_RURAIS || []).map(item => (
                                        <label key={item} className="flex items-center space-x-2 text-sm cursor-pointer p-1 hover:bg-gray-50 rounded">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.caracteristicas.includes(item)} 
                                                onChange={() => handleCaracteristicaChange(item)} 
                                                className="rounded text-green-600 border-gray-300 focus:ring-green-500" 
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ESTRUTURA URBANA PADRÃO */
                            <>
                                {/* Linha: Contagens de Quartos/Banheiros (ATUALIZADO) */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                     {/* Quartos */}
                                     <div>
                                        {renderNumericInput('quartos', 'Quartos (Total)', formData.quartos, '1')}
                                    </div>
                                    {/* Suítes (NOVO) */}
                                    <div>
                                        {renderNumericInput('suites', 'Suítes', formData.suites, '0')}
                                    </div>
                                    {/* Banheiros (NOVO) */}
                                    <div>
                                        {renderNumericInput('banheiros', 'Banheiros (Social)', formData.banheiros, '1')}
                                    </div>
                                    {/* Lavabos (NOVO) */}
                                    <div>
                                        {renderNumericInput('lavabos', 'Lavabos', formData.lavabos, '0')}
                                    </div>
                                     {/* Banheiros de Serviço (NOVO) */}
                                    <div>
                                        {renderNumericInput('banheirosServico', 'Banheiro de Serviço', formData.banheirosServico, '0')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                                    {/* Vagas Garagem */}
                                    <div>
                                        {renderNumericInput('vagasGaragem', 'Vagas Garagem', formData.vagasGaragem, '0')}
                                    </div>
                                    {/* Andar (Condicional) */}
                                    {formData.categoriaPrincipal === 'Residencial' && formData.tipoDetalhado.includes('Apartamento') ? (
                                        <div>
                                            {renderNumericInput('andar', 'Andar', formData.andar || 0, 'Ex: 5')}
                                        </div>
                                    ) : (
                                        <div className='hidden md:block'></div>
                                    )}
                                    {/* Área Total */}
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                            Área Total (m²) <Tooltip text="Área construída + áreas comuns proporcionais."/>
                                        </label>
                                        <input id="areaTotal" name="areaTotal" type="text" value={localNumericInputs['areaTotal']} onChange={handleChange} onBlur={handleBlur} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                    </div>
                                     {/* Área Útil */}
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                            Área Útil (m²) <Tooltip text="Área interna privativa (vassourável)."/>
                                        </label>
                                        <input id="areaUtil" name="areaUtil" type="text" value={localNumericInputs['areaUtil']} onChange={handleChange} onBlur={handleBlur} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                    </div>
                                </div>
                                {/* Área Terreno (Novo) */}
                                <div className="grid grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                            Área Terreno (m²) <Tooltip text="Tamanho total do lote."/>
                                        </label>
                                        <input id="areaTerreno" name="areaTerreno" type="text" value={localNumericInputs['areaTerreno']} onChange={handleChange} onBlur={handleBlur} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {/* --- Piscina Privativa (NOVO) --- */}
                        <div className="space-y-4 p-4 border rounded-lg border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-zinc-700/50">
                             <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center">
                                <Icon icon={faWater} className="w-4 h-4 mr-2" /> Piscina Privativa do Imóvel
                            </h4>
                             <CheckboxInput 
                                label="O imóvel possui piscina privativa?" 
                                name="piscinaPrivativa.possuiPiscina" 
                                checked={formData.piscinaPrivativa?.possuiPiscina || false} 
                                onChange={handleChange} 
                            />
                            {formData.piscinaPrivativa.possuiPiscina && (
                                <div className="grid grid-cols-2 gap-4 mt-2 animate-in fade-in">
                                     <div>
                                        <label htmlFor="piscinaPrivativa.tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Revestimento</label>
                                        <select id="piscinaPrivativa.tipo" name="piscinaPrivativa.tipo" value={formData.piscinaPrivativa.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-600/70 dark:text-white rounded-md">
                                            <option value="AZULEJO">Azulejo</option>
                                            <option value="VINIL">Vinil</option>
                                            <option value="FIBRA">Fibra</option>
                                            <option value="NATURAL">Natural / Biológica</option>
                                        </select>
                                    </div>
                                    <CheckboxInput 
                                        label="É Aquecida?" 
                                        name="piscinaPrivativa.aquecida" 
                                        checked={formData.piscinaPrivativa?.aquecida || false} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            )}
                        </div>
                        {/* --- FIM: Piscina Privativa --- */}

                        
                        {/* --- DETALHES DE CÔMODOS (ARRAYS DINÂMICOS) --- */}
                        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detalhes de Cômodos Dinâmicos</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Adicione instâncias para cada cozinha, sala e varanda para máxima compatibilidade com portais.</p>

                            {/* Adicionar Cozinha (Botão forçado se o array estiver vazio) */}
                            {formData.cozinhas.length === 0 && (
                                <button type="button" onClick={addRoom.bind(null, 'cozinhas')} className="w-full text-left p-3 rounded-lg text-sm font-medium bg-rentou-primary text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center">
                                    <Icon icon={faPlusCircle} className="w-4 h-4 mr-2" /> Adicionar Primeira Cozinha
                                </button>
                            )}
                            
                            {/* Detalhes da Cozinha (Loop) */}
                            <div className="space-y-4">
                                {formData.cozinhas.map((item, index) => (
                                    <CozinhaGroup 
                                        key={`coz-${index}`} 
                                        item={item} 
                                        index={index} 
                                        onChange={handleRoomChange.bind(null, 'cozinhas', index)} 
                                        onAdd={addRoom.bind(null, 'cozinhas')}
                                        onRemove={removeRoom.bind(null, 'cozinhas', index)}
                                        count={formData.cozinhas.length}
                                    />
                                ))}
                            </div>
                            
                            {/* Detalhes da Sala (Loop) */}
                            <div className="space-y-4">
                                {formData.salas.length === 0 && formData.cozinhas.length > 0 && (
                                     <button type="button" onClick={addRoom.bind(null, 'salas')} className="w-full text-left p-3 rounded-lg text-sm font-medium bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 transition flex items-center justify-center">
                                        <Icon icon={faPlusCircle} className="w-4 h-4 mr-2" /> Adicionar Primeira Sala
                                     </button>
                                )}
                                {formData.salas.map((item, index) => (
                                    <SalaGroup 
                                        key={`sala-${index}`} 
                                        item={item} 
                                        index={index} 
                                        onChange={handleRoomChange.bind(null, 'salas', index)} 
                                        onAdd={addRoom.bind(null, 'salas')}
                                        onRemove={removeRoom.bind(null, 'salas', index)}
                                        count={formData.salas.length}
                                    />
                                ))}
                            </div>
                            
                            {/* Detalhes da Varanda (Loop) */}
                             <div className="space-y-4">
                                {formData.varandas.length === 0 && formData.salas.length > 0 && (
                                     <button type="button" onClick={addRoom.bind(null, 'varandas')} className="w-full text-left p-3 rounded-lg text-sm font-medium bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 transition flex items-center justify-center">
                                        <Icon icon={faPlusCircle} className="w-4 h-4 mr-2" /> Adicionar Varanda/Terraço
                                     </button>
                                )}
                                {formData.varandas.map((item, index) => (
                                    <VarandaGroup 
                                        key={`varanda-${index}`} 
                                        item={item} 
                                        index={index} 
                                        onChange={handleRoomChange.bind(null, 'varandas', index)} 
                                        onAdd={addRoom.bind(null, 'varandas')}
                                        onRemove={removeRoom.bind(null, 'varandas', index)}
                                        count={formData.varandas.length}
                                    />
                                ))}
                            </div>
                            
                            {/* Dispensa (Única - Mantida) */}
                            <div className='p-4 border rounded-lg bg-gray-50 dark:bg-zinc-700 mt-6'>
                                <CheckboxInput 
                                    label="Possui Dispensa Embutida?" 
                                    name="dispensa.possuiDispensa" 
                                    checked={formData.dispensa.possuiDispensa || false} 
                                    onChange={handleChange} 
                                    description="Espaço de armazenamento dedicado (dispensa/despensa)."
                                />
                                {formData.dispensa.possuiDispensa && (
                                     <div className='mt-4'>
                                        <CheckboxInput 
                                            label="Possui prateleiras embutidas?" 
                                            name="dispensa.prateleirasEmbutidas" 
                                            checked={formData.dispensa.prateleirasEmbutidas || false} 
                                            onChange={handleChange} 
                                        />
                                     </div>
                                )}
                            </div>


                        </div>
                        {/* --- FIM: DETALHES DE CÔMODOS (ARRAYS) --- */}
                        
                        {/* Seletor de Comodidades */}
                        <div className='pt-4 border-t border-gray-100 dark:border-zinc-700'>
                            <ComodidadesSelector selected={formData.caracteristicas} onSelect={handleCaracteristicaChange} />
                        </div>
                    </div>
                );
            case 3:
                 // ... (Conteúdo da Etapa 3 - Valores e Responsabilidade - permanece o mesmo)
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">3. Valores e Responsabilidade</h3>
                        
                        {/* Linha: Valor Aluguel e Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Valor Aluguel */}
                             <div>
                                <label htmlFor="valorAluguel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor do Aluguel (R$)</label>
                                <input id="valorAluguel" name="valorAluguel" type="text" required value={localNumericInputs['valorAluguel'] || ''} onChange={handleChange} onBlur={handleBlur} placeholder="3500.00" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary font-bold text-lg" />
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
                        
                        {/* --- DETALHES DE RESPONSABILIDADE FINANCEIRA (Mantida) --- */}
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

                            {/* SEGUROS (NOVO) */}
                            <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h4 className="font-bold flex items-center text-blue-800 dark:text-blue-300">
                                    <Icon icon={faShieldAlt} className="mr-2"/> Seguros (Obrigatórios e Opcionais)
                                </h4>
                                <div className="space-y-3 mt-3">
                                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-3 rounded border border-gray-200 dark:border-zinc-600 shadow-sm">
                                        <div className="flex-1">
                                            <span className="block text-sm font-bold text-gray-800 dark:text-white">Seguro Incêndio</span>
                                            <span className="text-xs text-gray-500">Obrigatório por lei (Lei do Inquilinato).</span>
                                        </div>
                                        <input type="number" placeholder="R$ Valor" className="w-24 p-1 border rounded text-sm dark:bg-zinc-700 dark:border-zinc-600" />
                                        <select className="text-sm p-1 border rounded bg-gray-50 dark:bg-zinc-700 dark:border-zinc-600">
                                            <option value="INQUILINO">Pago pelo Inquilino</option>
                                            <option value="PROPRIETARIO">Pago pelo Proprietário</option>
                                        </select>
                                    </div>
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
                return (
                    <div className="space-y-6 animate-in fade-in">
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
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                        <Icon icon={faImage} className="w-4 h-4 mr-2" /> Galeria de Fotos (Máx. {MAX_PHOTOS})
                                    </h4>
                                    <p className={`text-sm font-medium ${getAvailableSlots() === 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                        Slots disponíveis: {getAvailableSlots()}. Arraste ou use as setas para ordenar.
                                    </p>
                                </div>
                                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rentou-primary hover:bg-blue-700 transition-colors cursor-pointer">
                                    <Icon icon={faImage} className="w-4 h-4 mr-2" />
                                    + Adicionar Fotos
                                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={loading || getAvailableSlots() <= 0}/>
                                </label>
                            </div>
                            
                            {/* GALERIA DE FOTOS (COM ORDENAÇÃO) */}
                            {photoList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {photoList.map((photo, index) => (
                                        <div key={index} className={`relative group aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border-2 shadow-sm transition-all ${index === 0 ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-gray-200 hover:border-blue-500'}`}>
                                            <img src={photo.url} className="w-full h-full object-cover" alt="Imóvel" />
                                            
                                            {/* Controls Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                                <div className="flex justify-between w-full">
                                                    {index === 0 ? (
                                                        <span className="text-yellow-400 text-xs font-bold bg-black/80 px-2 py-1 rounded flex items-center"><Icon icon={faStar} className="mr-1"/> Capa</span>
                                                    ) : (
                                                        <button type="button" onClick={() => movePhoto(index, -index)} className="text-gray-300 hover:text-yellow-400 text-xs font-medium bg-black/50 px-2 rounded hover:bg-black/80" title="Definir como Capa">Definir Capa</button>
                                                    )}
                                                    <button type="button" onClick={() => removePhoto(index)} className="text-white hover:text-red-400 bg-red-600/80 p-1.5 rounded-full hover:bg-red-700 transition-colors"><Icon icon={faTrash} className="w-3 h-3"/></button>
                                                </div>
                                                
                                                <div className="flex justify-center gap-4 text-white pb-1">
                                                    <button type="button" disabled={index === 0} onClick={() => movePhoto(index, -1)} className="p-1.5 hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"><Icon icon={faArrowLeft} /></button>
                                                    <button type="button" disabled={index === photoList.length - 1} onClick={() => movePhoto(index, 1)} className="p-1.5 hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"><Icon icon={faArrowRight} /></button>
                                                </div>
                                            </div>
                                            {index === 0 && <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center py-2 font-bold">Foto Principal</div>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="col-span-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-zinc-900/50">
                                    <Icon icon={faImage} className="w-10 h-10 mb-2 opacity-50" />
                                    <span className="text-sm">Nenhuma foto adicionada ainda.</span>
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
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Link Voltar: Foi o ponto do erro. Agora usa faArrowLeft importado. */}
            <Link href="/imoveis" className="text-rentou-primary hover:underline font-medium text-sm flex items-center">
                <Icon icon={faArrowLeft} className="w-3 h-3 mr-2" />
                Voltar para Lista de Imóveis
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 border-b pb-4">
                {formTitle}
            </h1>

            <form onSubmit={handleSubmit} className="p-8 bg-white dark:bg-zinc-800 shadow-2xl rounded-xl border border-gray-100 dark:border-zinc-700">
                
                {error && (
                    <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
                        {error}
                    </p>
                )}
                
                <ProgressIndicator />
                {renderStepContent()}
                
                {/* --- Navigation Buttons --- */}
                <div className="pt-6 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center mt-6">
                    
                    {/* Botão Voltar */}
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-rentou-primary transition-colors font-medium cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
                        >
                             <Icon icon={faChevronLeft} className="w-3 h-3 mr-2" />
                            Anterior
                        </button>
                    ) : <div />}
                    
                    <div className={currentStep === 1 ? 'flex-1' : 'flex-grow'}></div> {/* Espaçador */}

                    {/* Botão Próximo/Salvar */}
                    <button
                        type={currentStep === formSteps.length ? 'submit' : 'button'}
                        onClick={currentStep < formSteps.length ? handleNextStep : undefined} 
                        disabled={loading}
                        className={`w-full md:w-auto flex justify-center py-3 px-8 border border-transparent rounded-md shadow-lg text-sm font-bold text-white transition-colors cursor-pointer ${
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
};
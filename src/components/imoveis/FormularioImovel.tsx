'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { adicionarNovoImovel, atualizarImovel, updateImovelFotos } from '@/services/ImovelService'; 
import { uploadImovelPhotos, deleteFotoImovel } from '@/services/StorageService'; 
import { fetchCoordinatesByAddress } from '@/services/GeocodingService';
import { 
    Imovel, ImovelCategoria, ImovelFinalidade, NovoImovelData, EnderecoImovel, CondominioData, 
    CozinhaData, SalaData, VarandaData, DispensaData, PiscinaPrivativaData, ResponsavelPagamento, 
    PublicidadeConfig, ConstrucaoExternaData, RegrasAnimaisData, DetalhesVagaData, AcabamentoData, 
    CaracteristicasExternasData, DocumentacaoData 
} from '@/types/imovel'; 
import { IMÓVEIS_HIERARQUIA, COMODIDADES_RESIDENCIAIS, BENFEITORIAS_RURAIS } from '@/data/imovelHierarchy'; 
import { useAuthStore } from '@/hooks/useAuthStore';
import { fetchAddressByCep } from '@/services/CepService'; 
import { Icon } from '@/components/ui/Icon'; 
import { 
    faSave, faChevronRight, faChevronLeft, faCheckCircle, faImage, faHome, faTrash, 
    faPlusCircle, faMinusCircle, faUtensils, faCouch, faBuilding, 
    faWater, faArrowLeft, faSpinner, faInfoCircle, faShieldAlt, 
    faArrowRight, faStar, faTractor, faWarehouse, faPaw, faDog, faCat, faCar, faSun, faFileContract,
    faRoad, faHammer, faCloudUploadAlt, faGripVertical, faRulerCombined, faBed, faBath, faToilet, faLayerGroup, faCheck, faBolt, faWheelchair, faBoxOpen
} from '@fortawesome/free-solid-svg-icons'; 

interface FormularioImovelProps {
    initialData?: Imovel;
}

const formSteps = [
    { id: 1, name: 'Classificação' },
    { id: 2, name: 'Estrutura & Cômodos' }, 
    { id: 3, name: 'Detalhes & Acabamentos' }, 
    { id: 4, name: 'Valores & Documentação' }, 
    { id: 5, name: 'Mídia & Fotos' }, 
];

// --- DEFAULTS ---

const defaultCozinhaItem: CozinhaData = { tipo: 'FECHADA', nomeCustomizado: '', possuiArmarios: false, area: 0 };
const defaultSalaItem: SalaData = { tipo: 'ESTAR', nomeCustomizado: '', qtdAssentos: 1, area: 0 };
const defaultVarandaItem: VarandaData = { tipo: 'SIMPLES', nomeCustomizado: '', possuiChurrasqueira: false, temFechamentoVidro: false, area: 0 };
const defaultConstrucaoExternaItem: ConstrucaoExternaData = { tipo: 'EDICULA', nomeCustomizado: '', area: 0, possuiBanheiro: false };

const defaultRegrasAnimais: RegrasAnimaisData = { permiteGatos: true, permiteCaes: true, outrosAnimais: false, portePequeno: true, porteMedio: true, porteGrande: false };
const defaultPublicidade: PublicidadeConfig = { publicadoRentou: true, publicadoPortaisExternos: false, mostrarEnderecoCompleto: false, mostrarNumero: false, statusPublicacao: 'RASCUNHO' };

const defaultEndereco: EnderecoImovel = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', pais: 'Brasil' };
const defaultCondominio: CondominioData = { possuiCondominio: false, nomeCondominio: '', portaria24h: false, areaLazer: false };
const defaultDispensa: DispensaData = { possuiDispensa: false, prateleirasEmbutidas: false };
const defaultPiscina: PiscinaPrivativaData = { possuiPiscina: false, tipo: 'AZULEJO', aquecida: false };

// NOVOS DEFAULTS EXPANDIDOS
const defaultVagas: DetalhesVagaData = { tipoCobertura: 'COBERTA', tipoManobra: 'LIVRE', tipoUso: 'INDIVIDUAL', demarcada: true, escriturada: false, paralela: true };
const defaultAcabamentos: AcabamentoData = { 
    pisoSala: 'PORCELANATO', pisoQuartos: 'LAMINADO', pisoCozinha: 'PORCELANATO', pisoBanheiros: 'CERAMICA',
    teto: 'GESSO_REBAIXADO', esquadrias: 'ALUMINIO',
};
const defaultExternos: CaracteristicasExternasData = { 
    posicaoSolar: 'SOL_DA_MANHA', posicaoImovel: 'FRENTE', vista: 'LIVRE', 
    nivelBarulho: 'SILENCIOSO', tipoRua: 'ASFALTADA', deEsquina: false 
};
const defaultDoc: DocumentacaoData = { 
    possuiEscritura: true, registroCartorio: true, isentoIPTU: false, 
    aceitaFinanciamento: true, aceitaFGTS: false, aceitaPermuta: false, situacaoLegal: 'REGULAR' 
};

const MOCK_CONDOMINIOS = [
    { id: 'c1', nome: 'Edifício Solar da Praça' },
    { id: 'c2', nome: 'Condomínio Alphaville I' },
    { id: 'c3', nome: 'Residencial Jardins' },
];

const defaultFormData: NovoImovelData = {
    titulo: '',
    categoriaPrincipal: 'Residencial', 
    tipoDetalhado: 'Apartamento Padrão', 
    finalidades: ['Locação Residencial'], 
    endereco: defaultEndereco, 
    condominio: defaultCondominio, 
    infraestruturaCondominio: [],
    
    // Áreas e Terreno
    areaTotal: 0, areaUtil: 0, areaTerreno: 0,
    dimensoesTerreno: { frente: 0, fundos: 0, lateralDireita: 0, lateralEsquerda: 0, topografia: 'PLANO' },
    areaMediaQuartos: 0, areaMediaSuites: 0, areaTotalBanheiros: 0, areaExternaPrivativa: 0, areaQuintal: 0,

    // Estrutura
    quartos: 1, suites: 0, banheiros: 1, lavabos: 0, banheirosServico: 0, 
    vagasGaragem: 0, detalhesVaga: defaultVagas,
    andar: 1, totalAndaresNoPredio: 0, unidadesPorAndar: 0, elevadores: 0,
    possuiCasaSede: false,
    piscinaPrivativa: defaultPiscina, 
    
    // Arrays
    cozinhas: [], salas: [], varandas: [], dispensa: defaultDispensa, construcoesExternas: [],

    // Qualitativo
    descricaoLonga: '',
    caracteristicas: [], 
    estadoConservacao: 'USADO',
    tipoConstrucao: 'ALVENARIA',
    acabamentos: defaultAcabamentos,
    dadosExternos: defaultExternos,
    
    aceitaAnimais: false,
    detalhesAnimais: defaultRegrasAnimais, 

    // Valores
    status: 'VAGO',
    valorAluguel: 0, valorCondominio: 0, valorIPTU: 0,
    custoCondominioIncluso: false, responsavelCondominio: 'LOCATARIO',
    custoIPTUIncluso: false, responsavelIPTU: 'LOCATARIO',
    dataDisponibilidade: new Date().toISOString().split('T')[0],
    
    // Seguros & Docs
    seguros: [],
    seguroIncendioObrigatorio: true, 
    segurosOpcionais: { fiancaLocaticia: false, danosEletricos: false, vendaval: false, conteudo: false },
    documentacao: defaultDoc,

    // Mídia
    fotos: [], linkVideoTour: undefined, visitaVirtual360: false, publicidade: defaultPublicidade,
};

const isNumericField = (name: string): boolean => 
    ['quartos', 'suites', 'banheiros', 'lavabos', 'banheirosServico', 'vagasGaragem', 'areaTotal', 'areaUtil', 'areaTerreno', 
     'valorAluguel', 'valorCondominio', 'valorIPTU', 'andar', 'totalAndaresNoPredio', 'unidadesPorAndar', 'elevadores',
     'areaMediaQuartos', 'areaMediaSuites', 'areaTotalBanheiros', 'areaExternaPrivativa', 'areaQuintal',
     'dimensoesTerreno.frente', 'dimensoesTerreno.fundos'].includes(name) || name.startsWith('dimensoesTerreno.');

const getInitialState = (initialData?: Imovel) => {
    const initialDataPayload = initialData || {} as Imovel;

    const initialFormData: NovoImovelData = {
        ...defaultFormData,
        ...(initialDataPayload as any),
        
        endereco: { ...defaultEndereco, ...(initialDataPayload.endereco || {}) },
        condominio: { ...defaultCondominio, ...(initialDataPayload.condominio || {}) },
        dispensa: { ...defaultDispensa, ...(initialDataPayload.dispensa || {}) },
        piscinaPrivativa: { ...defaultPiscina, ...(initialDataPayload.piscinaPrivativa || {}) }, 
        publicidade: { ...defaultPublicidade, ...(initialDataPayload.publicidade || {}) },
        
        detalhesAnimais: { ...defaultRegrasAnimais, ...(initialDataPayload.detalhesAnimais || {}) },
        segurosOpcionais: { ...defaultFormData.segurosOpcionais, ...(initialDataPayload.segurosOpcionais || {}) },
        
        // NOVOS OBJETOS COMPLEXOS
        detalhesVaga: { ...defaultVagas, ...(initialDataPayload.detalhesVaga || {}) },
        acabamentos: { ...defaultAcabamentos, ...(initialDataPayload.acabamentos || {}) },
        dadosExternos: { ...defaultExternos, ...(initialDataPayload.dadosExternos || {}) },
        documentacao: { ...defaultDoc, ...(initialDataPayload.documentacao || {}) },
        dimensoesTerreno: { ...defaultFormData.dimensoesTerreno, ...(initialDataPayload.dimensoesTerreno || {}) },

        cozinhas: (initialDataPayload.cozinhas?.length > 0) ? initialDataPayload.cozinhas : [],
        salas: (initialDataPayload.salas?.length > 0) ? initialDataPayload.salas : [],
        varandas: (initialDataPayload.varandas?.length > 0) ? initialDataPayload.varandas : [],
        construcoesExternas: (initialDataPayload.construcoesExternas?.length > 0) ? initialDataPayload.construcoesExternas : [],

        // Garantias
        categoriaPrincipal: initialDataPayload.categoriaPrincipal || defaultFormData.categoriaPrincipal,
        tipoDetalhado: initialDataPayload.tipoDetalhado || defaultFormData.tipoDetalhado,
        finalidades: initialDataPayload.finalidades || defaultFormData.finalidades,
        dataDisponibilidade: initialDataPayload.dataDisponibilidade || defaultFormData.dataDisponibilidade,
        andar: initialDataPayload.andar || 0,
        fotos: initialDataPayload.fotos || [], 
    } as NovoImovelData;

    const initialLocalInputs: Record<string, string> = {};
    initialLocalInputs['endereco.cep'] = initialFormData.endereco.cep ? initialFormData.endereco.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : ''; 
    
    // Helper recursivo para preencher inputs numéricos aninhados se necessário, 
    // mas aqui faremos direto para os campos conhecidos
    const numericFields = Object.keys(defaultFormData).filter(k => isNumericField(k));
    // Adiciona subcampos manuais
    ['dimensoesTerreno.frente', 'dimensoesTerreno.fundos'].forEach(k => numericFields.push(k));

    return { initialFormData, initialLocalInputs };
};

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 align-middle z-50">
        <Icon icon={faInfoCircle} className="w-3.5 h-3.5 text-gray-400 hover:text-rentou-primary cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
    </div>
);

const CheckboxInput: React.FC<{ label: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; description?: string; icon?: any; }> = ({ label, name, checked, onChange, description, icon }) => (
    <div className="flex items-center space-x-3 h-full">
        <input
            id={name}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 text-rentou-primary border-gray-300 rounded focus:ring-rentou-primary focus:border-rentou-primary cursor-pointer"
        />
        <div className="flex flex-col">
            <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center cursor-pointer select-none">
                {icon && <Icon icon={icon} className="mr-2 text-gray-500" />}
                {label}
            </label>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
        </div>
    </div>
);

// ATUALIZADO: Aceita tooltip
const SelectResponsabilidade: React.FC<{ label: string, name: string, value: ResponsavelPagamento, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, tooltip?: string }> = ({ label, name, value, onChange, tooltip }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-1">
            {label}
            {tooltip && <Tooltip text={tooltip} />}
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
    <div className="bg-blue-50/30 dark:bg-zinc-800/30 p-4 rounded-lg border border-blue-100 dark:border-zinc-700">
        {/* CORREÇÃO: Ícone adicionado e título realçado */}
        <label className="text-xl font-bold text-rentou-primary dark:text-blue-400 mb-4 flex items-center border-b border-gray-200 dark:border-zinc-600 pb-2">
            <Icon icon={faStar} className="w-5 h-5 mr-2 text-yellow-500" />
            Comodidades e Atrativos
        </label>
        <div className="flex flex-wrap gap-2">
            {COMODIDADES_RESIDENCIAIS.map((feature: string) => {
                const isSelected = selected.includes(feature);
                return (
                    <button
                        key={feature}
                        type="button" 
                        onClick={() => onSelect(feature)}
                        className={`py-2 px-3 pl-4 pr-4 text-sm font-medium rounded-full transition-all duration-200 border flex items-center gap-2
                            ${isSelected 
                                ? 'bg-blue-50 border-rentou-primary text-rentou-primary shadow-sm dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300' 
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-600 dark:hover:bg-zinc-700'}
                        `}
                    >
                        {isSelected && <Icon icon={faCheck} className="w-3 h-3" />}
                        {feature}
                    </button>
                );
            })}
        </div>
    </div>
);

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
        {index === count - 1 && ( 
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
                 <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área (m²)</label>
                     <input type="number" name="area" value={item.area || 0} onChange={(e) => onChange('area', parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md" />
                 </div>
            </div>

            <RoomGroupControls onAdd={onAdd} onRemove={onRemove} index={index} count={count} />
        </div>
    );
};

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

const ConstrucaoExternaGroup: React.FC<{ item: ConstrucaoExternaData, index: number, onChange: (name: string, value: any) => void, onAdd: () => void, onRemove: (index: number) => void, count: number }> = ({ item, index, onChange, onAdd, onRemove, count }) => {
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
       const { name, value, type } = e.target;
       onChange(name, type === 'checkbox' ? (e.target as HTMLInputElement).checked : value);
   };
   
   return (
       <div className="p-4 border rounded-lg bg-orange-50 dark:bg-zinc-700/50 border-orange-200">
           <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                <Icon icon={faWarehouse} className="w-4 h-4 mr-2" /> {item.nomeCustomizado || `Construção ${index + 1}`}
           </h4>
           
           <div className="grid grid-cols-2 gap-4">
               <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                   <select name="tipo" value={item.tipo || ''} onChange={handleLocalChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-600/70 dark:text-white">
                       <option value="EDICULA">Edícula</option>
                       <option value="CHURRASQUEIRA_COBERTA">Churrasqueira Coberta</option>
                       <option value="SAUNA">Sauna</option>
                       <option value="CASA_HOSPEDES">Casa de Hóspedes</option>
                       <option value="OFICINA">Oficina/Ateliê</option>
                       <option value="OUTRO">Outro</option>
                   </select>
               </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição/Nome</label>
                   <input name="nomeCustomizado" type="text" value={item.nomeCustomizado || ''} onChange={handleLocalChange} placeholder="Ex: Área Gourmet" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-700 dark:text-white" />
               </div>
           </div>
           
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área (m²)</label>
                    <input type="number" name="area" value={item.area || ''} onChange={(e) => onChange('area', parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-700 dark:text-white" />
               </div>
               <div className="flex items-center pt-6">
                    <CheckboxInput label="Possui Banheiro?" name="possuiBanheiro" checked={item.possuiBanheiro || false} onChange={handleLocalChange} />
               </div>
           </div>

           <RoomGroupControls onAdd={onAdd} onRemove={onRemove} index={index} count={count} />
       </div>
   );
};

export default function FormularioImovel({ initialData }: FormularioImovelProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const isEditing = !!initialData;
    const formTitle = isEditing ? 'Editar Imóvel' : 'Novo Imóvel';
    
    const [cepLoading, setCepLoading] = useState(false);
    const [cepSuccess, setCepSuccess] = useState(false);

    // Estado para Drag and Drop
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const { initialFormData, initialLocalInputs } = useMemo(() => getInitialState(initialData), [initialData]);

    const [localNumericInputs, setLocalNumericInputs] = useState<Record<string, string>>(initialLocalInputs);
    const [formData, setFormData] = useState<NovoImovelData>(initialFormData);
    const [photoList, setPhotoList] = useState<{ url?: string, file?: File, isNew: boolean }[]>([]);
    const [fotosAExcluir, setFotosAExcluir] = useState<string[]>([]);
    const MAX_PHOTOS = 30;

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

    // HANDLER UNIVERSAL
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const target = e.target;
        const isCheckbox = type === 'checkbox';
        
        // Lógica para campos aninhados (ex: detalhesVaga.tipo)
        if (name.includes('.')) {
            const parts = name.split('.');
            const mainKey = parts[0] as keyof NovoImovelData; 
            const subKey = parts[1];

            // CEP handler
            if (name === 'endereco.cep') {
                let cleanedValue = value.replace(/\D/g, '').slice(0, 8);
                let formattedValue = cleanedValue.length > 5 ? `${cleanedValue.slice(0, 5)}-${cleanedValue.slice(5)}` : cleanedValue;
                setLocalNumericInputs(prev => ({ ...prev, [name]: formattedValue }));
                setFormData(prevData => ({ ...prevData, endereco: { ...prevData.endereco, cep: cleanedValue } }));
                return;
            }

            // Numeric Nested
            if (isNumericField(name)) {
                 const numericValue = parseFloat(value) || 0;
                 setFormData(prevData => ({
                    ...prevData,
                    [mainKey]: { ...(prevData[mainKey] as any), [subKey]: numericValue }
                }));
                return;
            }

            // Generic Nested Update
            setFormData(prevData => ({
                ...prevData,
                [mainKey]: { 
                    ...(prevData[mainKey] as any), 
                    [subKey]: isCheckbox ? (target as HTMLInputElement).checked : value 
                },
            }));
            return;
        }

        // Top Level Numeric
        if (isNumericField(name)) {
            setLocalNumericInputs(prev => ({ ...prev, [name]: value }));
            return;
        }
        
        // Top Level Boolean/String
        setFormData((prevData: NovoImovelData) => ({
            ...prevData,
            [name]: isCheckbox ? (target as HTMLInputElement).checked : value,
        }));
    }, []); 

    const addRoom = useCallback((key: keyof NovoImovelData) => {
        setFormData(prevData => {
            let newItem: any;
            if (key === 'cozinhas') newItem = { ...defaultCozinhaItem, nomeCustomizado: '' }; 
            else if (key === 'salas') newItem = { ...defaultSalaItem, nomeCustomizado: '' }; 
            else if (key === 'varandas') newItem = { ...defaultVarandaItem, nomeCustomizado: '' }; 
            else if (key === 'construcoesExternas') newItem = { ...defaultConstrucaoExternaItem };
            else return prevData;

            return {
                ...prevData,
                [key]: [...(prevData[key] as any[]), newItem],
            } as NovoImovelData;
        });
    }, []);
    
    const removeRoom = useCallback((key: keyof NovoImovelData, index: number) => {
        setFormData(prevData => {
            const list = (prevData[key] as any[]).filter((_, i) => i !== index);
            return {
                ...prevData,
                [key]: list,
            } as NovoImovelData;
        });
    }, []);

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

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanCep = value.replace(/\D/g, '');
        
        setFormData(prevData => ({
            ...prevData,
            endereco: { ...prevData.endereco, cep: cleanCep },
        }));
        
        if (cleanCep.length === 8) {
            setLoading(true);
            setCepLoading(true); 
            setCepSuccess(false);
            setError(null);

            try {
                const addressData = await fetchAddressByCep(cleanCep); 

                if (addressData) {
                    setFormData(prevData => ({
                        ...prevData,
                        endereco: { 
                            ...prevData.endereco, 
                            logradouro: addressData.logradouro,
                            bairro: addressData.bairro,
                            cidade: addressData.localidade,
                            estado: addressData.uf,
                        },
                    }));
                    
                    setCepSuccess(true); 
                    
                } else {
                    setError('CEP não encontrado ou inválido. Digite o endereço manualmente.');
                }
            } catch (err) {
                setError('Erro ao se comunicar com o serviço de CEP.');
            } finally {
                setLoading(false);
                setCepLoading(false); 
            }
        } else if (cleanCep.length > 0 && cleanCep.length < 8) {
             setError('O CEP deve ter 8 dígitos.');
        } else {
             setError(null);
        }
    };

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
    
    const getAvailableSlots = useCallback(() => {
        const totalPhotos = photoList.length;
        return MAX_PHOTOS - totalPhotos;
    }, [photoList]);

    // --- FUNÇÕES DRAG AND DROP ---
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnter = (index: number) => {
        if (draggedIndex === null || draggedIndex === index) return;
        const newPhotoList = [...photoList];
        const draggedItem = newPhotoList[draggedIndex];
        newPhotoList.splice(draggedIndex, 1);
        newPhotoList.splice(index, 0, draggedItem);
        setPhotoList(newPhotoList);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            
            e.target.value = ''; 
            setError(null);
        }
    };

    const handleRemoveNewPhoto = (index: number) => {
        removePhoto(index); 
    };
    
    const movePhoto = (index: number, direction: number) => {
        const newPhotos = [...photoList];
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
             setFotosAExcluir(prev => [...prev, item.url!]);
        } else if (item.isNew && item.file) {
        }
        setPhotoList(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleExistingPhoto = (url: string) => {
        setFotosAExcluir(prev => {
            if (prev.includes(url)) return prev.filter(u => u !== url); 
            return [...prev, url]; 
        });
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault(); 
        setError(null);
        
        if (currentStep === 1) {
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
        if (currentStep === 2) {
            if (formData.cozinhas.some(c => !c.tipo) || formData.salas.some(s => !s.tipo) || formData.varandas.some(v => !v.tipo)) {
                 setError("Certifique-se de que o campo 'Tipo' está selecionado para todos os Cômodos dinâmicos adicionados.");
                 return;
             }
             if (formData.suites > formData.quartos) {
                 setError("O número de suítes não pode ser maior que o número total de quartos.");
                 return;
             }
        }

        const numericFieldsToConsolidar: string[] = ['areaTotal', 'areaUtil', 'valorAluguel', 'valorCondominio', 'valorIPTU', 'areaMediaQuartos', 'areaMediaSuites', 'areaTotalBanheiros', 'areaExternaPrivativa', 'areaQuintal'];
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
            let finalFormData: NovoImovelData & Partial<Pick<Imovel, 'latitude' | 'longitude'>> = { ...formData };
            
            const finalNumericFields = ['valorAluguel', 'valorCondominio', 'valorIPTU', 'quartos', 'suites', 'banheiros', 'lavabos', 'banheirosServico', 'vagasGaragem', 'areaTotal', 'areaUtil', 'areaTerreno', 'andar', 'areaMediaQuartos', 'areaMediaSuites', 'areaTotalBanheiros', 'areaExternaPrivativa', 'areaQuintal'];
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
            
            finalFormData.cozinhas = finalFormData.cozinhas.filter(c => c.tipo);
            finalFormData.salas = finalFormData.salas.filter(s => s.tipo);
            finalFormData.varandas = finalFormData.varandas.filter(v => v.tipo);
            
            let { latitude, longitude } = initialData || {};

            const addressChanged = isEditing && (
                initialData!.endereco.cep !== finalFormData.endereco.cep ||
                initialData!.endereco.numero !== finalFormData.endereco.numero ||
                initialData!.endereco.logradouro !== finalFormData.endereco.logradouro
            );
            
            if (!isEditing || addressChanged || (!latitude || !longitude)) {
                const coords = await fetchCoordinatesByAddress(finalFormData.endereco);
                if (coords) {
                    latitude = coords.latitude;
                    longitude = coords.longitude;
                } else {
                    console.warn("Falha no Geocoding. O mapa pode não ser exibido corretamente.");
                }
            }

            if (latitude !== undefined && longitude !== undefined) {
                finalFormData.latitude = latitude;
                finalFormData.longitude = longitude;
            }

            let result: Imovel;
            
            if (isEditing && initialData) {
                const updatePayload = {
                    ...finalFormData, 
                    fotos: initialData.fotos, 
                } as Imovel; 
                
                result = await atualizarImovel(initialData.id, updatePayload);
            } else {
                result = await adicionarNovoImovel(finalFormData as NovoImovelData, proprietarioId);
            }
            
            if (fotosAExcluir.length > 0 && isEditing) {
                const deletePromises = fotosAExcluir.map(url => deleteFotoImovel(url));
                await Promise.all(deletePromises);
            }
            
            const newFilesToUpload = photoList.filter(p => p.isNew).map(p => p.file!);
            let uploadedUrls: string[] = [];
            
            if (newFilesToUpload.length > 0) {
                 uploadedUrls = await uploadImovelPhotos(newFilesToUpload, result.smartId);
            }

            let finalPhotoUrls: string[] = [];
            let uploadIndex = 0;

            photoList.forEach(item => {
                if (item.isNew) {
                    if (uploadedUrls[uploadIndex]) {
                        finalPhotoUrls.push(uploadedUrls[uploadIndex]);
                        uploadIndex++;
                    }
                } else if (item.url && !fotosAExcluir.includes(item.url)) {
                    finalPhotoUrls.push(item.url);
                }
            });

            if (newFilesToUpload.length > 0 || fotosAExcluir.length > 0 || finalPhotoUrls.length !== initialData?.fotos?.length) {
                 await updateImovelFotos(result.id, finalPhotoUrls);
            }
            
            router.push(`/imoveis/${result.smartId}`); 

        } catch (err: any) {
            console.error('Erro na operação de imóvel:', err);
            setError(`Falha ao ${isEditing ? 'atualizar' : 'adicionar'} o imóvel. Detalhe: ${err.message || 'Erro desconhecido.'}. **Verifique o console e o Geocoding!**`);
        } finally {
            setLoading(false);
        }
    };
    
    // ATUALIZADO: Stepper "Sticky" com correção de sobreposição
    const ProgressIndicator = () => {
        const percentage = formSteps.length > 1 ? Math.round(((currentStep - 1) / (formSteps.length - 1)) * 100) : 100;

        return (
            // CORREÇÃO: top-24 (aprox 96px) para garantir que fique ABAIXO do menu, z-30 para não cobrir dropdowns
            <div className="mb-10 pt-4 px-2 animate-in fade-in slide-in-from-top-5 sticky top-24 z-30 bg-white/95 backdrop-blur-sm border-b pb-4 dark:bg-zinc-900/90 dark:border-zinc-700 shadow-sm rounded-b-lg -mx-6 -mt-6 px-8">
                <div className="flex justify-between relative mb-2 px-4">
                    {formSteps.map((step) => {
                        const isActive = step.id <= currentStep;
                        // Permite voltar clicando em etapas anteriores
                        const isClickable = step.id < currentStep; 
                        return (
                            <div 
                                key={step.id} 
                                onClick={() => isClickable ? setCurrentStep(step.id) : null}
                                className={`flex flex-col items-center z-10 transition-transform duration-300 w-1/5 ${isActive ? 'scale-105' : 'scale-100'} ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                            >
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 shadow-lg border-4 ${
                                    isActive ? 'bg-rentou-primary dark:bg-blue-600 border-white dark:border-zinc-800 ring-2 ring-offset-2 ring-blue-100 dark:ring-offset-zinc-900 dark:ring-blue-900' : 'bg-gray-300 dark:bg-zinc-600 border-white dark:border-zinc-800'
                                }`}>
                                    {step.id < currentStep ? <Icon icon={faCheckCircle} className="w-4 h-4 md:w-5 md:h-5" /> : step.id}
                                </div>
                                <span className={`text-[9px] md:text-[10px] uppercase tracking-wide mt-2 font-bold text-center ${isActive ? 'text-rentou-primary dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {step.name}
                                </span>
                            </div>
                        );
                    })}
                    {/* Linha de progresso ajustada para não "vazar" */}
                    <div className="absolute top-4 md:top-5 left-[10%] right-[10%] h-1 bg-gray-200 dark:bg-zinc-700 -z-10 transform -translate-y-1/2">
                         <div 
                            className="h-full bg-rentou-primary dark:bg-blue-600 transition-all duration-500 ease-out rounded-full" 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    };

    // ATUALIZADO: Suporte a 'info' (tooltip) e 'icon'
    const renderNumericInput = (name: string, label: string, currentValue: number, placeholder?: string, info?: string, icon?: any) => {
        const getDisplayValue = (name: string, currentValue: number) => {
            const localValue = localNumericInputs[name];
            return localValue !== undefined ? localValue : (currentValue === 0 ? '' : String(currentValue));
        };
        
        return (
            <div className='relative'>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-1">
                    {label}
                    {/* Tooltip de ajuda restaurada */}
                    {info && <Tooltip text={info} />}
                </label>
                <div className="relative rounded-md shadow-sm">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon icon={icon} className="text-gray-400 w-4 h-4" />
                        </div>
                    )}
                    <input
                        id={name}
                        name={name}
                        type="text" 
                        required
                        value={getDisplayValue(name, currentValue)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={`block w-full py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary ${icon ? 'pl-10' : 'px-3'}`}
                    />
                </div>
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
                        
                        {formData.categoriaPrincipal === 'Rural' ? (
                            <div className="p-4 border-l-4 border-green-600 bg-green-50 dark:bg-green-900/20 rounded-r-lg mb-6 animate-in slide-in-from-left-2">
                                <h4 className="font-bold text-green-800 dark:text-green-300 flex items-center mb-4 text-lg">
                                    <Icon icon={faTractor} className="mr-2"/> Estrutura da Propriedade Rural
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        {renderNumericInput('areaTotal', 'Área Total (Hectares)', formData.areaTotal, 'Ex: 45.5', undefined, faRulerCombined)}
                                    </div>
                                    <div className="flex items-end pb-2">
                                         <CheckboxInput 
                                            label="Possui Casa Sede?" 
                                            name="possuiCasaSede" 
                                            checked={formData.possuiCasaSede || false} 
                                            onChange={handleChange} 
                                            description="Marque se houver residência principal." 
                                        />
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
                                {/* CARD: Dimensões e Áreas */}
                                <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center border-b pb-2">
                                        <Icon icon={faRulerCombined} className="mr-2 text-blue-500"/> Dimensões e Áreas (m²)
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                                         {renderNumericInput('areaTotal', 'Área Total', formData.areaTotal, '0', 'Área construída + comum.', faRulerCombined)}
                                         {renderNumericInput('areaUtil', 'Área Útil', formData.areaUtil, '0', 'Área privativa do imóvel.', faRulerCombined)}
                                         {renderNumericInput('areaTerreno', 'Área Terreno', formData.areaTerreno, '0', 'Área total do lote.', faRulerCombined)}
                                         {renderNumericInput('areaExternaPrivativa', 'Área Externa', formData.areaExternaPrivativa || 0, '0', undefined, faSun)}
                                         {renderNumericInput('areaQuintal', 'Quintal', formData.areaQuintal || 0, '0', undefined, faSun)}
                                    </div>
                                </div>

                                {/* CARD: Composição e Lazer Privativo */}
                                <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center border-b pb-2">
                                        <Icon icon={faLayerGroup} className="mr-2 text-blue-500"/> Composição do Imóvel
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mb-6">
                                         <div>{renderNumericInput('quartos', 'Quartos', formData.quartos, '1', undefined, faBed)}</div>
                                         <div>{renderNumericInput('suites', 'Suítes', formData.suites, '0', undefined, faBed)}</div>
                                         <div>{renderNumericInput('banheiros', 'Banheiros', formData.banheiros, '1', undefined, faBath)}</div>
                                         <div>{renderNumericInput('lavabos', 'Lavabos', formData.lavabos, '0', undefined, faToilet)}</div>
                                    </div>

                                    {/* SEÇÃO GARAGEM DENTRO DO CARD DE COMPOSIÇÃO */}
                                    <div className="bg-blue-50/50 dark:bg-zinc-700/30 rounded-lg p-4 border border-blue-100 dark:border-zinc-600">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-1/3">
                                                {renderNumericInput('vagasGaragem', 'Vagas Garagem', formData.vagasGaragem, '0', undefined, faCar)}
                                            </div>
                                            {formData.categoriaPrincipal === 'Residencial' && formData.tipoDetalhado.includes('Apartamento') && (
                                                <div className="w-1/3">
                                                    {renderNumericInput('andar', 'Andar', formData.andar || 0, 'Ex: 5', undefined, faBuilding)}
                                                </div>
                                            )}
                                        </div>

                                        {/* DETALHES DA GARAGEM (MOVIDO DA ETAPA 3) */}
                                        {formData.vagasGaragem > 0 && (
                                            <div className="mt-4 pt-3 border-t border-blue-200 dark:border-zinc-600 animate-in slide-in-from-top-2">
                                                <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-3">Detalhes da Vaga</h5>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                    <select name="detalhesVaga.tipoCobertura" value={formData.detalhesVaga?.tipoCobertura} onChange={handleChange} className="w-full p-2 text-xs border rounded bg-white dark:bg-zinc-800 dark:text-white">
                                                        <option value="COBERTA">Vaga Coberta</option>
                                                        <option value="DESCOBERTA">Vaga Descoberta</option>
                                                        <option value="MISTA">Mista</option>
                                                    </select>
                                                    <select name="detalhesVaga.tipoManobra" value={formData.detalhesVaga?.tipoManobra} onChange={handleChange} className="w-full p-2 text-xs border rounded bg-white dark:bg-zinc-800 dark:text-white">
                                                        <option value="LIVRE">Vaga Livre (Sem manobra)</option>
                                                        <option value="PRESA">Vaga Presa (Gaveta)</option>
                                                        <option value="MISTA">Algumas presas</option>
                                                    </select>
                                                    <select name="detalhesVaga.tipoUso" value={formData.detalhesVaga?.tipoUso} onChange={handleChange} className="w-full p-2 text-xs border rounded bg-white dark:bg-zinc-800 dark:text-white">
                                                        <option value="INDIVIDUAL">Vaga Fixa/Individual</option>
                                                        <option value="ROTATIVA">Rotativa</option>
                                                        <option value="COMPARTILHADA">Compartilhada</option>
                                                    </select>
                                                </div>

                                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                    <CheckboxInput label="Vaga Escriturada" name="detalhesVaga.escriturada" checked={formData.detalhesVaga?.escriturada || false} onChange={handleChange} icon={faFileContract} />
                                                    <CheckboxInput label="Carregador Elétrico" name="detalhesVaga.carregadorCarroEletrico" checked={(formData.detalhesVaga as any)?.carregadorCarroEletrico || false} onChange={handleChange} icon={faBolt} />
                                                    <CheckboxInput label="Vaga Acessível" name="detalhesVaga.acessivel" checked={(formData.detalhesVaga as any)?.acessivel || false} onChange={handleChange} icon={faWheelchair} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {/* --- DETALHES DE CÔMODOS (ARRAYS DINÂMICOS) --- */}
                        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detalhes de Cômodos Dinâmicos</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Adicione instâncias para cada cozinha, sala e varanda para máxima compatibilidade com portais.</p>

                            {formData.cozinhas.length === 0 && (
                                <button type="button" onClick={addRoom.bind(null, 'cozinhas')} className="w-full text-left p-3 rounded-lg text-sm font-medium bg-rentou-primary text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center">
                                    <Icon icon={faPlusCircle} className="w-4 h-4 mr-2" /> Adicionar Primeira Cozinha
                                </button>
                            )}
                            
                            <div className="space-y-4">
                                {formData.cozinhas.map((item, index) => (
                                    <CozinhaGroup key={`coz-${index}`} item={item} index={index} onChange={handleRoomChange.bind(null, 'cozinhas', index)} onAdd={addRoom.bind(null, 'cozinhas')} onRemove={removeRoom.bind(null, 'cozinhas', index)} count={formData.cozinhas.length}/>
                                ))}
                            </div>
                            
                            <div className="space-y-4">
                                {formData.salas.length === 0 && formData.cozinhas.length > 0 && (
                                     <button type="button" onClick={addRoom.bind(null, 'salas')} className="w-full text-left p-3 rounded-lg text-sm font-medium bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 transition flex items-center justify-center">
                                        <Icon icon={faPlusCircle} className="w-4 h-4 mr-2" /> Adicionar Primeira Sala
                                     </button>
                                )}
                                {formData.salas.map((item, index) => (
                                    <SalaGroup key={`sala-${index}`} item={item} index={index} onChange={handleRoomChange.bind(null, 'salas', index)} onAdd={addRoom.bind(null, 'salas')} onRemove={removeRoom.bind(null, 'salas', index)} count={formData.salas.length}/>
                                ))}
                            </div>
                            
                             <div className="space-y-4">
                                {formData.varandas.length === 0 && formData.salas.length > 0 && (
                                     <button type="button" onClick={addRoom.bind(null, 'varandas')} className="w-full text-left p-3 rounded-lg text-sm font-medium bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 transition flex items-center justify-center">
                                        <Icon icon={faPlusCircle} className="w-4 h-4 mr-2" /> Adicionar Varanda/Terraço
                                     </button>
                                )}
                                {formData.varandas.map((item, index) => (
                                    <VarandaGroup key={`varanda-${index}`} item={item} index={index} onChange={handleRoomChange.bind(null, 'varandas', index)} onAdd={addRoom.bind(null, 'varandas')} onRemove={removeRoom.bind(null, 'varandas', index)} count={formData.varandas.length}/>
                                ))}
                            </div>

                            {/* --- DISPENSA (MOVIDA PARA CÁ) --- */}
                            <div className='p-4 border rounded-lg bg-gray-50 dark:bg-zinc-700 mt-2'>
                                <div className="flex items-center mb-2">
                                    <Icon icon={faBoxOpen} className="mr-2 text-gray-500"/>
                                    <h5 className="font-medium text-sm text-gray-700 dark:text-gray-200">Área de Armazenamento</h5>
                                </div>
                                <CheckboxInput label="Possui Dispensa Embutida?" name="dispensa.possuiDispensa" checked={formData.dispensa.possuiDispensa || false} onChange={handleChange} description="Espaço de armazenamento dedicado (dispensa/despensa)."/>
                                {formData.dispensa.possuiDispensa && (
                                     <div className='mt-4 pl-6 border-l-2 border-gray-300 dark:border-zinc-600'>
                                        <CheckboxInput label="Possui prateleiras embutidas?" name="dispensa.prateleirasEmbutidas" checked={formData.dispensa.prateleirasEmbutidas || false} onChange={handleChange}/>
                                     </div>
                                )}
                            </div>

                            <h4 className="text-lg font-semibold mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700 flex items-center">
                                <Icon icon={faWarehouse} className="mr-2"/> Construções Externas & Edículas
                            </h4>
                            <div className="space-y-4">
                                {formData.construcoesExternas.map((item, index) => (
                                    <ConstrucaoExternaGroup key={`ext-${index}`} item={item} index={index} onChange={handleRoomChange.bind(null, 'construcoesExternas', index)} onAdd={addRoom.bind(null, 'construcoesExternas')} onRemove={removeRoom.bind(null, 'construcoesExternas', index)} count={formData.construcoesExternas.length} />
                                ))}
                                <button type="button" onClick={addRoom.bind(null, 'construcoesExternas')} className="w-full p-3 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 font-bold text-sm flex justify-center items-center transition-colors">
                                    <Icon icon={faPlusCircle} className="mr-2"/> Adicionar Edícula / Construção Externa
                                </button>
                            </div>
                        </div>

                        {/* --- Piscina Privativa (MOVIDA PARA CÁ - DEPOIS DE CONSTRUÇÕES EXTERNAS) --- */}
                        <div className="space-y-4 p-4 border rounded-lg border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-zinc-700/50 mt-6">
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
                                            <option value="FIBRA">Fibra de Vidro</option>
                                            <option value="PASTILHA">Pastilha</option>
                                            <option value="PEDRA_NATURAL">Pedra Natural (Hijau/Hitam)</option>
                                            <option value="CONCRETO">Concreto Armado</option>
                                            <option value="AREIA_COMPACTADA">Areia Compactada</option>
                                            <option value="NATURAL">Natural / Biológica</option>
                                            <option value="OUTRO">Outro</option>
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
                        
                        <div className='pt-4 border-t border-gray-100 dark:border-zinc-700'>
                            <ComodidadesSelector selected={formData.caracteristicas} onSelect={handleCaracteristicaChange} />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-8 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">3. Detalhes, Acabamentos e Diferenciais</h3>
                        
                        {/* Estado do Imóvel & Materiais */}
                        <div className="p-4 bg-gray-50 dark:bg-zinc-800 border rounded-lg border-gray-200 dark:border-zinc-700">
                            <h4 className="font-bold mb-3 flex items-center text-gray-700 dark:text-gray-300">
                                <Icon icon={faHammer} className="mr-2"/> Estado e Estrutura
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Estado de Conservação</label>
                                    <select name="estadoConservacao" value={formData.estadoConservacao} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="EM_CONSTRUCAO">Em Construção / Na Planta</option>
                                        <option value="NOVO">Novo (Nunca Habitado)</option>
                                        <option value="REFORMADO">Reformado</option>
                                        <option value="USADO">Usado (Bom Estado)</option>
                                        <option value="NECESSITA_REFORMA">Necessita Reforma</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo de Construção</label>
                                    <select name="tipoConstrucao" value={formData.tipoConstrucao} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="ALVENARIA">Alvenaria Convencional</option>
                                        <option value="STEEL_FRAME">Steel Frame</option>
                                        <option value="DRYWALL">Drywall / Gesso</option>
                                        <option value="MISTA">Mista</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Informações Externas */}
                        <div className="border p-4 rounded-lg bg-white dark:bg-zinc-800 border-yellow-200 dark:border-yellow-900/30">
                            <h4 className="font-bold mb-4 flex items-center text-yellow-700 dark:text-yellow-500"><Icon icon={faSun} className="mr-2"/> Posição, Sol e Rua</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Posição Solar</label>
                                    <select name="dadosExternos.posicaoSolar" value={formData.dadosExternos?.posicaoSolar} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="SOL_DA_MANHA">Sol da Manhã (Leste)</option>
                                        <option value="SOL_DA_TARDE">Sol da Tarde (Oeste)</option>
                                        <option value="NORTE">Norte (Sol o dia todo)</option>
                                        <option value="SUL">Sul (Pouco sol)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Posição da Unidade</label>
                                    <select name="dadosExternos.posicaoImovel" value={formData.dadosExternos?.posicaoImovel} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="FRENTE">Frente</option>
                                        <option value="FUNDOS">Fundos</option>
                                        <option value="LATERAL">Lateral</option>
                                        <option value="INTERNO">Interno</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Vista</label>
                                    <select name="dadosExternos.vista" value={formData.dadosExternos?.vista} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="LIVRE">Vista Livre</option>
                                        <option value="CIDADE">Vista Cidade</option>
                                        <option value="MAR">Vista Mar</option>
                                        <option value="MONTANHA">Vista Montanha</option>
                                        <option value="JARDIM">Vista Jardim</option>
                                        <option value="PAREDE">Vista Parede/Devassada</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Tipo de Rua</label>
                                    <select name="dadosExternos.tipoRua" value={formData.dadosExternos?.tipoRua} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="ASFALTADA">Asfaltada</option>
                                        <option value="PARALELEPIPEDO">Paralelepípedo</option>
                                        <option value="TERRA">Terra</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Barulho</label>
                                    <select name="dadosExternos.nivelBarulho" value={formData.dadosExternos?.nivelBarulho} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="SILENCIOSO">Silencioso</option>
                                        <option value="RUA_TRANQUILA">Rua Tranquila</option>
                                        <option value="MODERADO">Moderado</option>
                                        <option value="MOVIMENTADO">Movimentado</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <CheckboxInput label="É imóvel de esquina?" name="dadosExternos.deEsquina" checked={formData.dadosExternos?.deEsquina || false} onChange={handleChange} />
                                </div>
                            </div>
                            
                            {(formData.categoriaPrincipal === 'Terrenos' || formData.categoriaPrincipal === 'Residencial') && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-700">
                                    <label className="block text-xs font-bold mb-2 uppercase text-gray-500">Dimensões do Terreno</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Frente (m)</label><input type="number" name="dimensoesTerreno.frente" value={formData.dimensoesTerreno?.frente} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600"/></div>
                                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Fundos (m)</label><input type="number" name="dimensoesTerreno.fundos" value={formData.dimensoesTerreno?.fundos} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600"/></div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-600 dark:text-gray-400">Topografia</label>
                                            <select name="dimensoesTerreno.topografia" value={formData.dimensoesTerreno?.topografia} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                                <option value="PLANO">Plano</option>
                                                <option value="ACLIVE">Aclive (Sobe)</option>
                                                <option value="DECLIVE">Declive (Desce)</option>
                                                <option value="IRREGULAR">Irregular</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Acabamentos Detalhados */}
                        <div className="border p-4 rounded-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                            <h4 className="font-bold mb-3 flex items-center text-gray-600 dark:text-gray-300"><Icon icon={faHome} className="mr-2"/> Acabamentos e Pisos</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-gray-500">Piso da Sala</label>
                                    <select name="acabamentos.pisoSala" value={formData.acabamentos?.pisoSala} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="PORCELANATO">Porcelanato</option>
                                        <option value="LAMINADO">Laminado</option>
                                        <option value="TACO_MADEIRA">Taco / Madeira</option>
                                        <option value="CERAMICA">Cerâmica</option>
                                        <option value="TABUA_CORRIDA">Tábua Corrida</option>
                                        <option value="CIMENTO_QUEIMADO">Cimento Queimado</option>
                                        <option value="OUTRO">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-gray-500">Piso dos Quartos</label>
                                    <select name="acabamentos.pisoQuartos" value={formData.acabamentos?.pisoQuartos} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="LAMINADO">Laminado</option>
                                        <option value="PORCELANATO">Porcelanato</option>
                                        <option value="VINILICO">Vinílico</option>
                                        <option value="TACO_MADEIRA">Taco / Madeira</option>
                                        <option value="CARPETE">Carpete</option>
                                        <option value="OUTRO">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-gray-500">Piso Cozinha</label>
                                    <select name="acabamentos.pisoCozinha" value={formData.acabamentos?.pisoCozinha} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="PORCELANATO">Porcelanato</option>
                                        <option value="GRANITO">Granito</option>
                                        <option value="CERAMICA">Cerâmica</option>
                                        <option value="CIMENTO_QUEIMADO">Cimento Queimado</option>
                                        <option value="OUTRO">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-gray-500">Piso Banheiros</label>
                                    <select name="acabamentos.pisoBanheiros" value={formData.acabamentos?.pisoBanheiros} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="CERAMICA">Cerâmica</option>
                                        <option value="PORCELANATO">Porcelanato</option>
                                        <option value="GRANITO">Granito</option>
                                        <option value="PASTILHA">Pastilha</option>
                                        <option value="MARMORE">Mármore</option>
                                        <option value="OUTRO">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-gray-500">Acabamento Teto</label>
                                    <select name="acabamentos.teto" value={formData.acabamentos?.teto} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="GESSO_REBAIXADO">Gesso Rebaixado</option>
                                        <option value="LAJE">Laje</option>
                                        <option value="SANCAS">Sancas de Gesso</option>
                                        <option value="MADEIRA">Forro Madeira</option>
                                        <option value="APARENTE">Aparente / Industrial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-gray-500">Esquadrias</label>
                                    <select name="acabamentos.esquadrias" value={formData.acabamentos?.esquadrias} onChange={handleChange} className="w-full p-2 border rounded text-sm dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                        <option value="ALUMINIO">Alumínio</option>
                                        <option value="PVC">PVC</option>
                                        <option value="MADEIRA">Madeira</option>
                                        <option value="BLINDEX">Vidro Temperado (Blindex)</option>
                                        <option value="FERRO">Ferro</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">4. Valores e Documentação</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Aluguel (R$)</label><input name="valorAluguel" type="text" value={localNumericInputs['valorAluguel'] || ''} onChange={handleChange} onBlur={handleBlur} className="w-full p-2 border rounded font-bold dark:bg-zinc-700 dark:text-white dark:border-zinc-600"/></div>
                            <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Condomínio (R$)</label><input name="valorCondominio" type="text" value={localNumericInputs['valorCondominio'] || ''} onChange={handleChange} onBlur={handleBlur} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white dark:border-zinc-600"/></div>
                            <div><label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">IPTU Mensal (R$)</label><input name="valorIPTU" type="text" value={localNumericInputs['valorIPTU'] || ''} onChange={handleChange} onBlur={handleBlur} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white dark:border-zinc-600"/></div>
                        </div>

                        {/* Documentação Completa */}
                        <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r-lg">
                            <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center"><Icon icon={faFileContract} className="mr-2"/> Documentação e Condições</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <CheckboxInput label="Possui Escritura Definitiva?" name="documentacao.possuiEscritura" checked={formData.documentacao?.possuiEscritura || false} onChange={handleChange} />
                                <CheckboxInput label="Registrado em Cartório (RGI)?" name="documentacao.registroCartorio" checked={formData.documentacao?.registroCartorio || false} onChange={handleChange} />
                            </div>
                            
                            <h5 className="text-sm font-bold text-gray-600 dark:text-gray-400 mt-2 mb-2">Aceita na Negociação:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <CheckboxInput label="Aceita Financiamento?" name="documentacao.aceitaFinanciamento" checked={formData.documentacao?.aceitaFinanciamento || false} onChange={handleChange} />
                                <CheckboxInput label="Aceita FGTS?" name="documentacao.aceitaFGTS" checked={formData.documentacao?.aceitaFGTS || false} onChange={handleChange} />
                                <CheckboxInput label="Aceita Permuta?" name="documentacao.aceitaPermuta" checked={formData.documentacao?.aceitaPermuta || false} onChange={handleChange} />
                            </div>
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Situação Legal Atual</label>
                                <select name="documentacao.situacaoLegal" value={formData.documentacao?.situacaoLegal} onChange={handleChange} className="w-full p-2 border rounded dark:bg-zinc-700 dark:text-white dark:border-zinc-600">
                                    <option value="REGULAR">Regular / Livre de Ônus</option>
                                    <option value="ALIENADO">Alienado (Financiado)</option>
                                    <option value="INVENTARIO">Em Inventário</option>
                                    <option value="USUFRUTO">Com Usufruto</option>
                                    <option value="LEILAO">De Leilão</option>
                                    <option value="OUTRO">Outra</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Responsabilidade dos Custos Fixos</h4>
                            
                            {/* RESTAURADO: Layout com Grid/Caixas igual ao Print 1 e botões de ajuda */}
                            <div className="border border-gray-200 dark:border-zinc-600 rounded-md p-4">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Custo do Condomínio</h4>
                                <div className="grid md:grid-cols-2 gap-4">
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
                                        tooltip="Se 'Locatário', ele paga o boleto. Se 'Proprietário', você paga (e pode cobrar no aluguel)."
                                    />
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-zinc-600 rounded-md p-4">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Custo do IPTU</h4>
                                <div className="grid md:grid-cols-2 gap-4">
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
                                        tooltip="Se 'Locatário', ele paga o boleto. Se 'Proprietário', você paga (e pode cobrar no aluguel)."
                                    />
                                </div>
                            </div>

                            {/* Seguros */}
                            <div className="border border-blue-200 dark:border-blue-800 rounded-md p-4 bg-blue-50 dark:bg-blue-900/10">
                                <h4 className="font-bold text-blue-700 dark:text-blue-300 flex items-center mb-3">
                                    <Icon icon={faShieldAlt} className="mr-2"/> Seguros
                                </h4>
                                
                                <div className="mb-4 bg-white dark:bg-zinc-800 p-3 rounded shadow-sm border-l-4 border-green-500">
                                    <CheckboxInput 
                                        label="Seguro Incêndio (Obrigatório por Lei)" 
                                        name="seguroIncendioObrigatorio" 
                                        checked={formData.seguroIncendioObrigatorio} 
                                        onChange={handleChange} 
                                        description="Item obrigatório na locação (Lei do Inquilinato)."
                                    />
                                </div>

                                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Seguros Opcionais / Adicionais</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <CheckboxInput label="Fiança Locatícia" name="segurosOpcionais.fiancaLocaticia" checked={formData.segurosOpcionais?.fiancaLocaticia || false} onChange={handleChange} />
                                    <CheckboxInput label="Danos Elétricos" name="segurosOpcionais.danosEletricos" checked={formData.segurosOpcionais?.danosEletricos || false} onChange={handleChange} />
                                    <CheckboxInput label="Vendaval" name="segurosOpcionais.vendaval" checked={formData.segurosOpcionais?.vendaval || false} onChange={handleChange} />
                                    <CheckboxInput label="Conteúdo / Móveis" name="segurosOpcionais.conteudo" checked={formData.segurosOpcionais?.conteudo || false} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-semibold text-rentou-primary dark:text-blue-400">5. Mídia e Fotos do Anúncio</h3>
                        
                        <div>
                            <label htmlFor="descricaoLonga" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição Detalhada para Anúncio</label>
                            <textarea id="descricaoLonga" name="descricaoLonga" rows={4} required value={formData.descricaoLonga} onChange={handleChange} placeholder="Descreva o imóvel em detalhes, destacando os pontos fortes e a vizinhança." className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:border-rentou-primary" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                             <div>
                                <label htmlFor="linkVideoTour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link do Vídeo Tour (Opcional)</label>
                                <input id="linkVideoTour" name="linkVideoTour" type="url" value={formData.linkVideoTour || ''} onChange={handleChange} placeholder="Ex: https://youtube.com/watch?v=tour" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white rounded-md shadow-sm focus:ring-rentou-primary focus:focus:border-rentou-primary" />
                            </div>
                             <CheckboxInput label="Visita Virtual 360º Disponível" name="visitaVirtual360" checked={formData.visitaVirtual360} onChange={handleChange} description="Marque se você possui um link para tour virtual 360º." />
                        </div>

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
                            
                            {photoList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {photoList.map((photo, index) => (
                                        <div 
                                            key={index} 
                                            className={`relative group aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border-2 shadow-sm transition-all ${index === 0 ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-gray-200 hover:border-blue-500'} ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                            // DRAG AND DROP IMPLEMENTADO
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragEnter={() => handleDragEnter(index)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                        >
                                            <img src={photo.url} className="w-full h-full object-cover pointer-events-none" alt="Imóvel" />
                                            
                                            {/* FEEDBACK VISUAL DE UPLOAD */}
                                            {photo.isNew && (
                                                <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 flex items-center">
                                                    <Icon icon={faCloudUploadAlt} className="mr-1" /> Pendente
                                                </div>
                                            )}

                                            {/* Ícone de Drag (Feedback visual) */}
                                            <div className="absolute top-2 right-2 text-white/70 bg-black/30 p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Icon icon={faGripVertical} />
                                            </div>

                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                                <div className="flex justify-end w-full pt-6">
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
                
                <div className="pt-6 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center mt-6">
                    
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
                    
                    <div className={currentStep === 1 ? 'flex-1' : 'flex-grow'}></div> 

                    <button
                        type="submit"
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
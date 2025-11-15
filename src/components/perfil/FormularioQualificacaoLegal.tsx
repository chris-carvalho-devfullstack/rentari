// src/components/perfil/FormularioQualificacaoLegal.tsx

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { QualificacaoPF, QualificacaoPJ, EnderecoCompleto, Usuario } from '@/types/usuario';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { faSave, faIdCard, faBuildingColumns, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

// --- FUNÇÕES DE FORMATAÇÃO GLOBAL (MOVIDAS PARA CÁ PARA EVITAR O ReferenceError) ---

/**
 * Formata CPF (11 dígitos) para o padrão 000.000.000-00.
 */
const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length > 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    if (cleaned.length > 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    if (cleaned.length > 3) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    return cleaned;
};

/**
 * Formata CNPJ (14 dígitos) para o padrão 00.000.000/0000-00.
 */
const formatCnpj = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 14);
    if (cleaned.length > 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
    if (cleaned.length > 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
    if (cleaned.length > 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    if (cleaned.length > 2) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    return cleaned;
};


// --- Componentes Auxiliares de UI ---

const Input = ({ label, name, type = 'text', value, onChange, required = false, placeholder = '', disabled = false, className = '' }: any) => (
    <div className="flex flex-col mb-4">
        <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}{required && <span className="text-red-500">*</span>}</label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            className={`mt-1 p-2 border border-gray-300 rounded-md focus:ring-rentou-primary focus:border-rentou-primary dark:bg-zinc-700 dark:text-white ${className}`}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
        />
    </div>
);

const Select = ({ label, name, value, onChange, options, required = false }: any) => (
    <div className="flex flex-col mb-4">
        <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}{required && <span className="text-red-500">*</span>}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-rentou-primary focus:border-rentou-primary dark:bg-zinc-700 dark:text-white"
            required={required}
        >
            <option value="" disabled>Selecione...</option>
            {options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

// --- Componente do Formulário de Endereço ---
interface EnderecoFormProps {
    endereco: EnderecoCompleto;
    onChange: (name: string, value: string) => void;
    prefix: string; // Ex: 'endereco' ou 'representante.endereco'
}

const EnderecoForm: React.FC<EnderecoFormProps> = ({ endereco, onChange, prefix }) => {
    
    // Funções de formatação de CEP (simples)
    const formatCep = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 8);
        if (cleaned.length > 5) {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
        }
        return cleaned;
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange(`${prefix}.${name.split('.').pop()}`, value);
    };

    return (
        <div className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-700/50 mb-6 space-y-2">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                <Icon icon={faBuildingColumns} className="w-4 h-4 mr-2" /> Endereço Contratual
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="CEP" 
                    name="cep"
                    value={formatCep(endereco.cep)} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(`${prefix}.cep`, e.target.value.replace(/\D/g, '').slice(0, 8))} 
                    required 
                    placeholder="00000-000"
                    maxLength={9}
                />
                 <Input 
                    label="Logradouro (Rua, Av.)" 
                    name="logradouro"
                    value={endereco.logradouro} 
                    onChange={handleChange} 
                    required 
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <Input 
                    label="Número" 
                    name="numero"
                    value={endereco.numero} 
                    onChange={handleChange} 
                    required 
                />
                <Input 
                    label="Complemento" 
                    name="complemento"
                    value={endereco.complemento || ''} 
                    onChange={handleChange} 
                />
                 <Input 
                    label="Bairro" 
                    name="bairro"
                    value={endereco.bairro} 
                    onChange={handleChange} 
                    required 
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Cidade" 
                    name="cidade"
                    value={endereco.cidade} 
                    onChange={handleChange} 
                    required 
                />
                <Select 
                    label="Estado (UF)" 
                    name="estado"
                    value={endereco.estado} 
                    onChange={handleChange} 
                    options={['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']} // Simplificado
                    required 
                />
            </div>
        </div>
    );
};

// --- Componente do Formulário PF ---
interface FormProps {
    data: QualificacaoPF | QualificacaoPJ;
    setData: React.Dispatch<React.SetStateAction<QualificacaoPF | QualificacaoPJ | null>>;
}

const FormPF: React.FC<FormProps> = ({ data, setData }) => {
    const pfData = data as QualificacaoPF;
    const isMarried = pfData.estadoCivil === 'Casado(a)' || pfData.estadoCivil === 'União Estável';
    
    // Função genérica para atualizar campos PF (não aninhados)
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(prev => ({
            ...(prev as QualificacaoPF),
            [name]: value
        }));
    }, [setData]);

    // Função para atualizar campos aninhados (Endereco, Conjuge)
    const handleNestedChange = useCallback((name: string, value: string) => {
        // Ex: endereco.cep, conjuge.nomeCompleto
        const [field, subfield] = name.split('.');

        setData(prev => {
            const prevPF = prev as QualificacaoPF;
            
            if (field === 'endereco') {
                return {
                    ...prevPF,
                    endereco: {
                        ...prevPF.endereco,
                        [subfield]: value
                    }
                };
            }
            if (field === 'conjuge') {
                 // Inicializa conjuge se for null e for campo obrigatório de casado
                const currentConjuge = prevPF.conjuge || { nomeCompleto: '', cpf: '', rg: '', regimeDeBens: prevPF.regimeDeBens || '' };
                return {
                    ...prevPF,
                    conjuge: {
                        ...currentConjuge,
                        [subfield]: value
                    }
                };
            }
            return prev;
        });
    }, [setData]);
    
    return (
        <div className="mt-6">
            <h3 className="text-xl font-bold text-rentou-primary dark:text-blue-400 mb-4">Qualificação: Pessoa Física</h3>
            <Input label="Nome Completo" name="nomeCompleto" value={pfData.nomeCompleto} onChange={handleChange} required />
            <Input label="CPF" name="cpf" value={formatCpf(pfData.cpf)} onChange={handleChange} required disabled />
            <Input label="Nacionalidade" name="nacionalidade" value={pfData.nacionalidade} onChange={handleChange} required />
            
            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Estado Civil"
                    name="estadoCivil"
                    value={pfData.estadoCivil}
                    onChange={handleChange}
                    options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']}
                    required
                />
                {isMarried && (
                    <Input label="Regime de Bens" name="regimeDeBens" value={pfData.regimeDeBens || ''} onChange={handleChange} required={isMarried} placeholder="Ex: Comunhão Parcial" />
                )}
            </div>

            <Input label="Profissão" name="profissao" value={pfData.profissao} onChange={handleChange} required />
            <Input label="Data de Nascimento" name="dataNascimento" type="date" value={pfData.dataNascimento} onChange={handleChange} required />
            
            <div className="grid grid-cols-3 gap-4">
                <Input label="RG Número" name="rgNumero" value={pfData.rgNumero} onChange={handleChange} required />
                <Input label="RG Órgão Exp." name="rgOrgaoExpedidor" value={pfData.rgOrgaoExpedidor} onChange={handleChange} required />
                <Select 
                    label="RG UF" 
                    name="rgUF" 
                    value={pfData.rgUF} 
                    onChange={handleChange} 
                    options={['SP', 'RJ', 'MG', 'BA', 'DF', 'RS', 'SC', 'PR', 'GO', 'PE', 'CE']} // Simplificado
                    required 
                />
            </div>
            
            <EnderecoForm 
                endereco={pfData.endereco} 
                onChange={handleNestedChange} 
                prefix="endereco"
            />
            
            {isMarried && (
                <div className="p-4 border border-blue-200 dark:border-blue-900/50 rounded-lg bg-blue-50 dark:bg-zinc-700 mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Dados do Cônjuge (Obrigatório)</h4>
                    <Input label="Nome Completo Cônjuge" name="nomeCompleto" value={pfData.conjuge?.nomeCompleto || ''} onChange={(e: any) => handleNestedChange('conjuge.nomeCompleto', e.target.value)} required />
                    <Input label="CPF Cônjuge" name="cpf" value={pfData.conjuge?.cpf || ''} onChange={(e: any) => handleNestedChange('conjuge.cpf', e.target.value)} required />
                    <Input label="RG Cônjuge" name="rg" value={pfData.conjuge?.rg || ''} onChange={(e: any) => handleNestedChange('conjuge.rg', e.target.value)} required />
                </div>
            )}
        </div>
    );
};

// --- Componente do Formulário PJ ---
const FormPJ: React.FC<FormProps> = ({ data, setData }) => {
    const pjData = data as QualificacaoPJ;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(prev => ({
            ...(prev as QualificacaoPJ),
            [name]: value
        }));
    }, [setData]);

    const handleNestedChange = useCallback((name: string, value: string) => {
        const [field, subfield] = name.split('.');

        setData(prev => {
            const prevPJ = prev as QualificacaoPJ;
            
            if (field === 'endereco') {
                return {
                    ...prevPJ,
                    endereco: {
                        ...prevPJ.endereco,
                        [subfield]: value
                    }
                };
            }
            // Lógica para representante (aninhado dentro de PJ)
            if (field === 'representante') {
                return {
                    ...prevPJ,
                    representante: {
                        ...prevPJ.representante,
                        [subfield]: value
                    }
                };
            }
            return prev;
        });
    }, [setData]);
    
    return (
        <div className="mt-6">
            <h3 className="text-xl font-bold text-rentou-primary dark:text-blue-400 mb-4">Qualificação: Pessoa Jurídica</h3>
            
            <Input label="Razão Social" name="razaoSocial" value={pjData.razaoSocial} onChange={handleChange} required />
            <Input label="CNPJ" name="cnpj" value={formatCnpj(pjData.cnpj)} onChange={handleChange} required disabled />
            <Input label="Nome Fantasia (Opcional)" name="nomeFantasia" value={pjData.nomeFantasia || ''} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Inscrição Estadual (Opcional)" name="inscricaoEstadual" value={pjData.inscricaoEstadual || ''} onChange={handleChange} />
                <Input label="Inscrição Municipal (Opcional)" name="inscricaoMunicipal" value={pjData.inscricaoMunicipal || ''} onChange={handleChange} />
            </div>

            <EnderecoForm 
                endereco={pjData.endereco} 
                onChange={handleNestedChange} 
                prefix="endereco"
            />

            <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-zinc-700 mt-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Qualificação do Representante Legal</h4>
                 <Input label="Nome Completo Repr." name="nomeCompleto" value={pjData.representante.nomeCompleto} onChange={(e: any) => handleNestedChange('representante.nomeCompleto', e.target.value)} required />
                 <Input label="CPF Repr." name="cpf" value={pjData.representante.cpf} onChange={(e: any) => handleNestedChange('representante.cpf', e.target.value)} required />
            </div>

            <Input label="Base Legal da Representação" name="baseDeRepresentacao" value={pjData.baseDeRepresentacao} onChange={handleChange} required placeholder="Ex: Contrato Social / Estatuto / Procuração" />
        </div>
    );
};


// --- Componente Principal: FormularioQualificacaoLegal ---
export default function FormularioQualificacaoLegal() {
    const { user, updateUser } = useAuthStore();
    const router = useRouter();
    const [documento, setDocumento] = useState(user?.documentoIdentificacao?.replace(/\D/g, '') || user?.cpf || ''); // CPF/CNPJ limpo inicial
    const [data, setData] = useState<QualificacaoPF | QualificacaoPJ | null>(user?.qualificacao || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Constante para inicialização de endereço
    const initialEndereco: EnderecoCompleto = useMemo(() => ({ 
        cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' 
    }), []);

    // Lógica para inicializar PF ou PJ com base no documento
    const initializeQualificacao = useCallback((docType: 'PF' | 'PJ', docValue: string) => {
        if (docType === 'PF') {
            setData({
                documentoTipo: 'PF',
                nomeCompleto: user?.nome || '',
                cpf: docValue,
                nacionalidade: 'Brasileiro(a)',
                estadoCivil: 'Solteiro(a)',
                profissao: '',
                dataNascimento: '',
                rgNumero: '',
                rgOrgaoExpedidor: '',
                rgUF: '',
                endereco: initialEndereco,
            } as QualificacaoPF);
        } else if (docType === 'PJ') {
            setData({
                documentoTipo: 'PJ',
                razaoSocial: '',
                cnpj: docValue,
                endereco: initialEndereco,
                representante: {
                    nomeCompleto: '', nacionalidade: 'Brasileiro(a)', estadoCivil: 'Solteiro(a)', profissao: '',
                    rgNumero: '', rgOrgaoExpedidor: '', rgUF: '', cpf: '',
                },
                baseDeRepresentacao: '',
            } as QualificacaoPJ);
        }
    }, [user, initialEndereco]);


    // Efeito para inicializar o formulário se o usuário já tiver a qualificação salva
    useEffect(() => {
        if (user?.qualificacao) {
            setData(user.qualificacao);
            setDocumento((user.qualificacao as any).cpf || (user.qualificacao as any).cnpj || '');
        } else if (documento) {
            const cleanDoc = documento.replace(/\D/g, '');
            // Tenta adivinhar o tipo de documento inicial do usuário (se veio do cadastro simples)
            if (cleanDoc.length === 11) {
                initializeQualificacao('PF', cleanDoc);
            } else if (cleanDoc.length === 14) {
                 initializeQualificacao('PJ', cleanDoc);
            }
        }
    }, [user, initializeQualificacao]);


    // Lógica de Detecção Automática CPF/CNPJ (ao digitar)
    const handleDocumentoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleaned = value.replace(/\D/g, '').slice(0, 14);
        setDocumento(cleaned); // Salva o valor limpo

        if (cleaned.length === 11) {
            if (!data || data.documentoTipo !== 'PF' || (data as QualificacaoPF).cpf !== cleaned) {
                initializeQualificacao('PF', cleaned);
                setError(null);
            }
        } else if (cleaned.length === 14) {
            if (!data || data.documentoTipo !== 'PJ' || (data as QualificacaoPJ).cnpj !== cleaned) {
                initializeQualificacao('PJ', cleaned);
                setError(null);
            }
        } else if (cleaned.length > 0) {
            setError('Documento inválido. Digite 11 dígitos para CPF ou 14 para CNPJ.');
            setData(null);
        } else {
            setError(null);
            setData(null);
        }
    }, [data, initializeQualificacao]);
    
    // Calcula o valor a ser exibido no input (formatado)
    const displayDocument = useMemo(() => {
        const cleaned = documento.replace(/\D/g, '');
        if (cleaned.length === 11) { // PF
            return formatCpf(cleaned);
        }
        if (cleaned.length === 14) { // PJ
            return formatCnpj(cleaned);
        }
        return cleaned;
    }, [documento]);
    

    // Função de Submissão
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!data) {
            setError('Selecione e preencha um CPF ou CNPJ válido.');
            return;
        }
        
        // Adicionar validação mais robusta aqui (ex: verificar campos obrigatórios do objeto 'data')

        setLoading(true);
        try {
            // O payload é o objeto QualificacaoPF ou QualificacaoPJ completo
            await updateUser(data); 
            
            alert('Qualificação Contratual salva com sucesso!');
            router.push('/perfil');
        } catch (error) {
            console.error('Erro ao salvar qualificação:', error);
            setError('Houve um erro ao salvar os dados. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/perfil" className="text-rentou-primary hover:underline font-medium text-sm flex items-center">
                <Icon icon={faArrowLeft} className="w-3 h-3 mr-2" />
                Voltar para Meu Perfil
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 border-b pb-4">
                Qualificação Contratual Legal
            </h1>

            <form onSubmit={handleSubmit} className="p-8 bg-white dark:bg-zinc-800 shadow-2xl rounded-xl border border-gray-100 dark:border-zinc-700">
                
                {error && (
                    <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
                        {error}
                    </p>
                )}
                
                {/* 1. Campo de Detecção Inicial */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Icon icon={faIdCard} className="w-5 h-5 mr-3 text-rentou-primary" />
                    Documento de Identificação Principal
                </h2>
                
                <Input 
                    label="CPF ou CNPJ (Somente Números)" 
                    name="documentoIdentificacao"
                    value={displayDocument} 
                    onChange={handleDocumentoChange} 
                    required 
                    placeholder="Digite 11 dígitos para CPF ou 14 para CNPJ"
                    maxLength={18} // Para permitir a digitação com máscara
                />
                
                {/* 2. Renderização Condicional do Formulário Específico */}
                {data?.documentoTipo === 'PF' && (
                    <FormPF data={data} setData={setData} />
                )}
                
                {data?.documentoTipo === 'PJ' && (
                    <FormPJ data={data} setData={setData} />
                )}
                
                {/* Botão de Submissão */}
                <button 
                    type="submit"
                    disabled={!data || loading}
                    className={`w-full py-3 mt-8 flex items-center justify-center text-white font-semibold rounded-md transition-colors ${
                        !data || loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-rentou-primary hover:bg-blue-700'
                    }`}
                >
                    <Icon icon={faSave} className={`h-5 w-5 mr-3 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Salvando Qualificação...' : 'Salvar Qualificação Contratual'}
                </button>
            </form>
        </div>
    );
};
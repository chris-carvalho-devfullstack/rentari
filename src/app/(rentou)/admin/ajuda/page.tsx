// src/app/(rentou)/admin/ajuda/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { 
    faBook, faArrowLeft, faShieldAlt, faUsers, faMoneyBillWave, 
    faChevronDown, faChevronUp, faSearch, faLifeRing
} from '@fortawesome/free-solid-svg-icons';

// Componente de Card de Manual
const ManualCard = ({ title, description, icon, href, color }: { title: string, description: string, icon: any, href: string, color: string }) => (
    <Link href={href} className="group block h-full">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 hover:shadow-md hover:border-rentou-primary/50 transition-all h-full flex flex-col">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon icon={icon} className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-rentou-primary transition-colors">
                {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed flex-grow">
                {description}
            </p>
            <div className="mt-4 text-sm font-medium text-rentou-primary flex items-center">
                Ler documentação <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </div>
    </Link>
);

// Componente de Item de FAQ (Accordion)
const FaqItem = ({ question, answer }: { question: string, answer: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-zinc-700 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 text-left flex justify-between items-center focus:outline-none group"
            >
                <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-rentou-primary transition-colors">
                    {question}
                </span>
                <Icon icon={isOpen ? faChevronUp : faChevronDown} className="w-4 h-4 text-gray-400" />
            </button>
            {isOpen && (
                <div className="pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed animate-in fade-in slide-in-from-top-1">
                    {answer}
                </div>
            )}
        </div>
    );
};

export default function CentralAjudaPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-zinc-700">
                <div>
                    <Link href="/admin" className="text-sm font-medium text-rentou-primary hover:underline flex items-center mb-2">
                        <Icon icon={faArrowLeft} className="w-3 h-3 mr-2" /> Voltar para Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <Icon icon={faLifeRing} className="w-8 h-8 mr-3 text-red-500" />
                        Central de Ajuda Master
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Documentação técnica, guias operacionais e perguntas frequentes para administradores.
                    </p>
                </div>
            </div>

            {/* Seção 1: Biblioteca de Manuais */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                    <Icon icon={faBook} className="w-5 h-5 mr-2 text-blue-600" />
                    Manuais Técnicos & Operacionais
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Auditoria (JÁ EXISTENTE) */}
                    <ManualCard 
                        title="Auditoria de Cache & Custos"
                        description="Entenda como funciona o sistema de 'Safe Miss', como economizar com a API do Mapbox e interpretar os logs de HIT/BYPASS."
                        icon={faShieldAlt}
                        href="/admin/ajuda/auditoria-manual" // Link para a página que criamos antes
                        color="bg-green-500"
                    />

                    {/* Card 2: Exemplo Futuro */}
                    <ManualCard 
                        title="Gestão de Usuários & Perfis"
                        description="Guia completo sobre permissões, verificação de documentos de proprietários e moderação de contas."
                        icon={faUsers}
                        href="#" // Placeholder
                        color="bg-purple-500"
                    />

                    {/* Card 3: Exemplo Futuro */}
                    <ManualCard 
                        title="Fluxo Financeiro"
                        description="Como auditar repasses, entender as taxas da plataforma e resolver disputas de pagamento via Stripe/Pagar.me."
                        icon={faMoneyBillWave}
                        href="#" // Placeholder
                        color="bg-yellow-500"
                    />
                </div>
            </section>

            {/* Seção 2: FAQ Geral */}
            <section className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Icon icon={faSearch} className="w-5 h-5 mr-2 text-gray-400" />
                        Perguntas Frequentes (FAQ Master)
                    </h2>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                    <FaqItem 
                        question="O que fazer se um imóvel não aparece no mapa?"
                        answer={
                            <span>
                                Primeiro, verifique no painel se o imóvel possui <strong>Latitude</strong> e <strong>Longitude</strong> cadastradas. 
                                Se estiverem zeradas, o sistema de Geocoding falhou. Edite o imóvel e tente salvar o endereço novamente para forçar uma nova busca de coordenadas.
                            </span>
                        }
                    />
                    <FaqItem 
                        question="Como funciona o sistema de Cache do Mapbox?"
                        answer="O sistema salva os dados de escolas e hospitais na Cloudflare por 30 dias. Durante esse período, não pagamos nada pelas visualizações. Consulte o 'Manual de Auditoria' acima para detalhes técnicos."
                    />
                    <FaqItem 
                        question="Posso excluir um usuário Admin?"
                        answer="Por segurança, a exclusão de Admins só pode ser feita diretamente no banco de dados (Firebase Console) ou por um Super Admin. O painel atual permite apenas suspender o acesso."
                    />
                    <FaqItem 
                        question="O que significa o status 'BYPASS' na auditoria?"
                        answer="Significa que o sistema de proteção funcionou! Ele detectou que não havia cache e impediu que seu servidor gastasse dinheiro buscando dados reais apenas para um teste."
                    />
                </div>
            </section>

        </div>
    );
}
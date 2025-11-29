// src/app/(rentou)/admin/ajuda/auditoria-manual/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { 
    faBook, faShieldAlt, faArrowLeft, faServer, faBolt, faQuestionCircle, 
    faCheckCircle, faExclamationTriangle, faGlobeAmericas 
} from '@fortawesome/free-solid-svg-icons';

export default function ManualAuditoriaPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header com Navegação */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-zinc-700">
                <div>
                    {/* ATUALIZADO: Volta para a Central de Ajuda */}
                    <Link href="/admin/ajuda" className="text-sm font-medium text-rentou-primary hover:underline flex items-center mb-2">
                        <Icon icon={faArrowLeft} className="w-3 h-3 mr-2" /> Voltar para Central de Ajuda
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <Icon icon={faBook} className="w-8 h-8 mr-3 text-blue-600" />
                        Manual de Auditoria e Economia de Custos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Mapbox & Cloudflare: Entenda o sistema de Cache Inteligente.
                    </p>
                </div>
            </div>

            {/* 1. O Conceito */}
            <section className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                    <Icon icon={faServer} className="w-6 h-6 mr-3 text-purple-600" />
                    1. O Conceito: "Cache Inteligente"
                </h2>
                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                        Para mostrar escolas, hospitais e transporte perto de cada imóvel, nós precisamos consultar o <strong>Mapbox</strong>. Cada consulta custa dinheiro.
                        Para evitar pagar pela mesma informação duas vezes, criamos um <strong>Hub de Cache usando a Cloudflare</strong>:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-rentou-primary">
                        <li><strong>A Regra dos 30 Dias:</strong> Quando alguém acessa um imóvel pela primeira vez, nós buscamos os dados no Mapbox e salvamos uma cópia na nuvem (Cloudflare) por 30 dias.</li>
                        <li><strong>Acesso Gratuito:</strong> As próximas milhares de pessoas que acessarem esse mesmo imóvel receberão a cópia salva instantaneamente. <strong>Custo Zero.</strong></li>
                        <li><strong>Tiered Cache (Cache Global):</strong> Se alguém acessa de São Paulo e depois outra pessoa acessa de Nova York, nosso sistema é inteligente o suficiente para compartilhar a cópia salva entre essas regiões, maximizando a economia.</li>
                    </ul>
                </div>
            </section>

            {/* 2. Como Funciona a Auditoria */}
            <section className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                    <Icon icon={faShieldAlt} className="w-6 h-6 mr-3 text-green-600" />
                    2. Como Funciona a Auditoria "Custo Zero"?
                </h2>
                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                        No seu Painel Admin, você verá um botão <strong>"Auditar Sem Custos"</strong>. Ele usa uma tecnologia exclusiva chamada <em>Safe Mode</em> (Modo Seguro).
                        O objetivo é responder à pergunta: <em>"A Cloudflare já tem esse imóvel salvo?"</em> sem gastar dinheiro se a resposta for "Não".
                    </p>
                    
                    <div className="bg-gray-50 dark:bg-zinc-900 p-5 rounded-lg border-l-4 border-rentou-primary mt-4">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">O Fluxo da Auditoria:</h4>
                        <ol className="list-decimal pl-5 space-y-2 text-sm">
                            <li>O sistema pergunta à Cloudflare: "Você tem o cache do imóvel X?"</li>
                            <li><strong>Se Tiver (HIT):</strong> A Cloudflare entrega o arquivo. Confirmamos que está rápido e economizando.</li>
                            <li><strong>Se Não Tiver (MISS):</strong> A Cloudflare avisa o nosso servidor.</li>
                            <li className="pl-4 border-l-2 border-gray-300 dark:border-zinc-700 my-1">
                                <span className="block text-xs uppercase font-bold text-gray-500">Normalmente:</span> 
                                O servidor baixaria os dados do Mapbox (gerando custo).
                            </li>
                            <li className="pl-4 border-l-2 border-rentou-primary my-1 bg-blue-50 dark:bg-blue-900/20 py-1 pr-2 rounded-r">
                                <span className="block text-xs uppercase font-bold text-rentou-primary">Modo Auditoria:</span> 
                                O servidor bloqueia a chamada ao Mapbox e retorna um aviso "MISS (Safe)".
                            </li>
                        </ol>
                        <p className="mt-4 font-semibold text-green-600 dark:text-green-400">
                            Resultado: Você pode auditar 10.000 imóveis quantas vezes quiser. Se eles não estiverem no cache, você paga R$ 0,00.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Tabela de Status */}
            <section className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                    <Icon icon={faCheckCircle} className="w-6 h-6 mr-3 text-blue-500" />
                    3. Entendendo os Status da Auditoria
                </h2>
                
                <div className="overflow-hidden border border-gray-200 dark:border-zinc-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-zinc-900">
                            <tr>
                                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">O que significa?</th>
                                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">O que aconteceu?</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700 bg-white dark:bg-zinc-800">
                            <tr>
                                <td className="px-6 py-4 font-bold text-green-600 bg-green-50 dark:bg-green-900/20">HIT</td>
                                <td className="px-6 py-4 font-semibold">Sucesso Total.</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">O arquivo foi entregue pela memória da Cloudflare. Não houve custo e o carregamento foi instantâneo.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">MISS (Safe) <br/><span className="text-xs font-normal text-gray-500">ou BYPASS</span></td>
                                <td className="px-6 py-4 font-semibold">Sem Cache (Protegido).</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">A Cloudflare não tinha o arquivo ou foi instruída a ignorar. O sistema de segurança (x-audit-mode) impediu a cobrança do Mapbox.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20">MISS</td>
                                <td className="px-6 py-4 font-semibold">Criação de Cache.</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Raro na auditoria. O sistema decidiu baixar os dados reais. Gerou 1 custo, mas agora o cache está "quente".</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 4. Detalhes Técnicos e Fenômenos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Detalhes Técnicos */}
                <section className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 h-full">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                        <Icon icon={faBolt} className="w-5 h-5 mr-3 text-yellow-500" />
                        4. Detalhes Técnicos (Interativo)
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">Clique sobre o status na tabela para ver:</p>
                    <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-gray-100">CF-Cache-Status:</span>
                            <span>O veredito oficial da Cloudflare.</span>
                        </li>
                        <li className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-gray-100">Age (Idade):</span>
                            <span>Há quantos segundos esse arquivo está salvo. (Ex: Age: 3600 = 1 hora).</span>
                        </li>
                        <li className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-gray-100">Ray ID:</span>
                            <span>Identificador único. O final do código indica a cidade do servidor (ex: GIG = Rio, GRU = SP). Ajuda a entender diferenças regionais.</span>
                        </li>
                        <li className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-gray-100">Latência:</span>
                            <div className="mt-1 flex gap-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    &lt; 100ms (Excelente)
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    &gt; 500ms (Lento/Origem)
                                </span>
                            </div>
                        </li>
                    </ul>
                </section>

                {/* Fenômenos Distribuídos */}
                <section className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 h-full">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                        <Icon icon={faGlobeAmericas} className="w-5 h-5 mr-3 text-blue-400" />
                        5. Fenômenos de Infraestrutura
                    </h2>
                    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                            <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">O Caso dos "Dois Servidores"</h4>
                            <p className="text-xs text-gray-500 italic mb-2">(Auditoria Geral vs Individual)</p>
                            <p>
                                <strong>Sintoma:</strong> Na lista dá BYPASS, mas no teste individual dá HIT.<br/>
                                <strong>Causa:</strong> Você caiu em servidores diferentes da rede global (ex: Rio vs São Paulo).<br/>
                                <strong>Conclusão:</strong> O sistema está funcionando. Onde tem cache, entrega. Onde não tem, protege.
                            </p>
                        </div>
                        <div className="border-t border-gray-100 dark:border-zinc-700 pt-4">
                            <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">O Fenômeno da "Auto-Correção"</h4>
                            <p>
                                <strong>Sintoma:</strong> Status MISS (Verde) vira HIT ao atualizar.<br/>
                                <strong>Causa:</strong> O primeiro acesso foi o "nascimento" do cache. O segundo comprova que a operação deu certo.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* FAQ e Dica de Ouro */}
            <section className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                    <Icon icon={faQuestionCircle} className="w-6 h-6 mr-3 text-gray-400" />
                    Perguntas Frequentes (FAQ)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">P: Por que vejo MISS mas o usuário vê HIT?</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">R: A Cloudflare é mundial. Seu servidor de auditoria pode não ter o arquivo ainda, mas o do usuário já tem. O Tiered Cache resolve isso sozinho.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">P: O Cache expira?</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">R: Sim, dura 30 dias. Após isso, o primeiro visitante renova os dados automaticamente.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">P: Mudar preço quebra o cache?</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">R: Não. Os POIs dependem apenas da Latitude/Longitude. O cache continua válido mesmo editando o anúncio.</p>
                    </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-start shadow-sm">
                    <Icon icon={faExclamationTriangle} className="w-6 h-6 mr-4 text-yellow-500 mt-1" />
                    <div>
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">Dica de Ouro</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 leading-relaxed">
                            Confie no status <strong>HIT</strong>. Se você vir a barra verde crescendo no seu painel, significa que sua infraestrutura está pagando por si mesma e a experiência do usuário está ultra-rápida.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
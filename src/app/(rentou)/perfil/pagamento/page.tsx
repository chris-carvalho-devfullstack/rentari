// src/app/(rentou)/perfil/pagamento/page.tsx
'use client';

import Link from 'next/link';
import FormularioDadosBancarios from '@/components/perfil/FormularioDadosBancarios';
import { Icon } from '@/components/ui/Icon';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

/**
 * @fileoverview Página de Edição de Dados Bancários e PIX do Proprietário.
 */
export default function EditarDadosBancariosPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Link href="/perfil" className="text-rentou-primary hover:underline font-medium text-sm flex items-center">
                <Icon icon={faArrowLeft} className="w-3 h-3 mr-2" />
                Voltar para Meu Perfil
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 border-b pb-4">
                Edição Financeira e PIX
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Mantenha seus dados bancários e chave PIX atualizados para garantir o repasse correto e rápido dos aluguéis.
            </p>

            <FormularioDadosBancarios />
            
        </div>
    );
}
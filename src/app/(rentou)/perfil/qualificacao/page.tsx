// src/app/(rentou)/perfil/qualificacao/page.tsx
'use client';

import React from 'react';
import FormularioQualificacaoLegal from '@/components/perfil/FormularioQualificacaoLegal';
import { Metadata } from 'next';

// Nota: A Metadata deve ser definida em um layout.tsx ou com um export se for 'use client'. 
// Para este exemplo, definimos no formato de export para manter a simplicidade.
// A remoção do export Metadata aqui é intencional, pois o arquivo não é um layout.

/**
 * @fileoverview Página para preenchimento da qualificação legal completa (PF/PJ).
 */
export default function QualificacaoPage() {
    return (
        <div className="space-y-6">
            <FormularioQualificacaoLegal />
        </div>
    );
}
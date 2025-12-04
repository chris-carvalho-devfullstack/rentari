'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import FormularioCondominio from '@/components/condominios/FormularioCondominio';
import { buscarCondominioPorId } from '@/services/CondominioService';
import { Condominio } from '@/types/condominio';

export default function EditarCondominioPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [initialData, setInitialData] = useState<Condominio | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            buscarCondominioPorId(id)
                .then((data) => {
                    if(data) setInitialData(data);
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Editar Condomínio</h1>
            <FormularioCondominio initialData={initialData} />
        </div>
    );
}
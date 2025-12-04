import FormularioCondominio from '@/components/condominios/FormularioCondominio';

export default function NovoCondominioPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Cadastrar Novo Condomínio
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Adicione detalhes completos sobre a estrutura, lazer e gestão para valorizar os imóveis deste empreendimento.
                </p>
            </div>
            
            <FormularioCondominio />
        </div>
    );
}
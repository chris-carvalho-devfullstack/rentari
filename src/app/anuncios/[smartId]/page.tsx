// src/app/anuncios/[smartId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchImovelPorSmartId } from '@/services/ImovelService';
import { fetchCoordinatesByAddress, fetchBairroGeoJsonLimits } from '@/services/GeocodingService';
import AnuncioDetalheClient from '@/components/anuncios/AnuncioDetalheClient';

export const runtime = 'edge';

// CORREÇÃO CRÍTICA: No Next.js 15, 'params' é uma Promise e deve ser tipada como tal.
type Props = {
    params: Promise<{ smartId: string }>;
};

// 1. GERAÇÃO DE METADADOS DINÂMICOS (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Aguarda a resolução dos parâmetros (obrigatório no Next.js 15)
    const { smartId } = await params;
    
    const imovel = await fetchImovelPorSmartId(smartId);
    
    if (!imovel) {
        return {
            title: 'Imóvel não encontrado | Rentou',
        };
    }

    const title = `${imovel.titulo} | Rentou`;
    // Resumo para a descrição: Tipo, Bairro, Quartos, Preço
    const description = `${imovel.tipoDetalhado} em ${imovel.endereco.bairro}, ${imovel.endereco.cidade}. ${imovel.quartos} quartos, ${imovel.areaUtil}m². Aluguel: R$ ${imovel.valorAluguel.toLocaleString('pt-BR')}.`;
    const imageUrl = imovel.fotos[0] || 'https://rentou.com.br/og-image-default.jpg';

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: imovel.titulo,
                },
            ],
            type: 'website',
            locale: 'pt_BR',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
}

// 2. COMPONENTE SERVIDOR (SSR)
export default async function AnuncioDetalhePage({ params }: Props) {
    // Aguarda a resolução dos parâmetros antes de usar
    const { smartId } = await params;
    
    // Busca de dados no lado do servidor (Sem Loading Spinner para o usuário, HTML já vem pronto)
    const imovel = await fetchImovelPorSmartId(smartId);

    if (!imovel || imovel.status !== 'ANUNCIADO') {
        notFound(); // Retorna página 404 padrão do Next.js
    }

    // --- LÓGICA DE GEOCODING (Convertida para Server-Side) ---
    // Verifica se já tem coordenadas válidas
    const hasValidCoords = (imovel.latitude && imovel.longitude && (imovel.latitude !== 0 || imovel.longitude !== 0));

    if (!hasValidCoords) {
        const coords = await fetchCoordinatesByAddress(imovel.endereco);
        if (coords) {
            imovel.latitude = coords.latitude;
            imovel.longitude = coords.longitude;
        } else {
            // Fallback padrão se falhar
            imovel.latitude = -23.55052;
            imovel.longitude = -46.633307;
        }
    }
    // --- FIM LÓGICA DE GEOCODING ---

    // Busca limites do bairro (GeoJSON) no Servidor para passar pronto ao cliente
    let bairroGeoJson = null;
    if (imovel.endereco.bairro) {
        bairroGeoJson = await fetchBairroGeoJsonLimits(imovel.endereco.bairro, imovel.endereco.cidade, imovel.endereco.estado);
    }

    // 3. DADOS ESTRUTURADOS (JSON-LD) PARA GOOGLE
    // Isso "ensina" ao Google sobre o preço, localização e título do imóvel
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: imovel.titulo,
        description: imovel.descricaoLonga,
        image: imovel.fotos,
        address: {
            '@type': 'PostalAddress',
            streetAddress: `${imovel.endereco.logradouro}, ${imovel.endereco.numero}`,
            addressLocality: imovel.endereco.cidade,
            addressRegion: imovel.endereco.estado,
            postalCode: imovel.endereco.cep,
            addressCountry: 'BR',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: imovel.latitude,
            longitude: imovel.longitude,
        },
        offers: {
            '@type': 'Offer',
            price: imovel.valorAluguel,
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
        },
    };

    return (
        <>
            {/* Injeção de JSON-LD (Invisível ao usuário, visível ao Google) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            {/* Renderização do Componente Cliente com Dados Prontos */}
            <AnuncioDetalheClient 
                imovel={imovel} 
                bairroGeoJson={bairroGeoJson} 
            />
        </>
    );
}
// src/data/broadbandStats.ts

export interface CityBroadbandData {
    avgSpeed: string;
    technology: string;
    providers: string[];
    bestFor: string[];
}

// DADOS REAIS DE MERCADO (Base: Relatórios Anatel/MinhaConexão 2024/25)
export const BROADBAND_DATABASE: Record<string, CityBroadbandData> = {
    // --- SUDESTE ---
    "São Paulo": {
        avgSpeed: "480Mb",
        technology: "Fibra/Coaxial",
        providers: ["Vivo Fibra", "Claro", "Tim Ultra", "Algar"],
        bestFor: ["Home Office", "Streaming 4K", "Jogos Competitivos"]
    },
    "Rio de Janeiro": {
        avgSpeed: "350Mb",
        technology: "Fibra Óptica",
        providers: ["Oi Fibra", "Claro", "Vivo", "PredialNet"],
        bestFor: ["Videochamadas", "Streaming HD", "Múltiplos Dispositivos"]
    },
    "Belo Horizonte": {
        avgSpeed: "410Mb",
        technology: "Fibra Pura",
        providers: ["Vivo", "Claro", "Oi", "Blink Telecom"],
        bestFor: ["Trabalho Remoto", "Downloads Pesados"]
    },
    "Vitória": {
        avgSpeed: "380Mb",
        technology: "Fibra Óptica",
        providers: ["Vivo", "Claro", "Loga", "Sumicity"],
        bestFor: ["Streaming", "Navegação Rápida"]
    },

    // --- SUL (Forte presença de provedores regionais premiados) ---
    "Curitiba": {
        avgSpeed: "520Mb",
        technology: "Fibra Óptica",
        providers: ["Ligga (Copel)", "Claro", "Vivo", "Oi"],
        bestFor: ["Gamers", "Criadores de Conteúdo", "Estabilidade"]
    },
    "Florianópolis": {
        avgSpeed: "490Mb",
        technology: "Fibra Óptica",
        providers: ["Unifique", "Claro", "Vivo", "Oi"],
        bestFor: ["Trabalho Remoto", "Upload Alto"]
    },
    "Porto Alegre": {
        avgSpeed: "460Mb",
        technology: "Fibra/Coaxial",
        providers: ["Claro", "Vivo", "Oi", "Tim"],
        bestFor: ["Streaming 8K", "Jogos Online"]
    },

    // --- CENTRO-OESTE ---
    "Brasília": {
        avgSpeed: "470Mb",
        technology: "Fibra Óptica",
        providers: ["Claro", "Vivo", "Oi", "Sky Fibra"],
        bestFor: ["Governo Digital", "Videoconferências"]
    },
    "Goiânia": {
        avgSpeed: "400Mb",
        technology: "Fibra Óptica",
        providers: ["Claro", "Vivo", "Algar", "Oi"],
        bestFor: ["Estudos", "Streaming"]
    },
    "Cuiabá": {
        avgSpeed: "350Mb",
        technology: "Fibra Óptica",
        providers: ["Claro", "Vivo", "Oi"],
        bestFor: ["Navegação", "Redes Sociais"]
    },
    "Campo Grande": {
        avgSpeed: "360Mb",
        technology: "Fibra Óptica",
        providers: ["Claro", "Vivo", "Oi"],
        bestFor: ["Home Office", "TV via Streaming"]
    },

    // --- NORDESTE (Destaque para Brisanet) ---
    "Recife": {
        avgSpeed: "380Mb",
        technology: "Fibra Óptica",
        providers: ["Brisanet", "Claro", "Vivo", "Oi"],
        bestFor: ["Conexão Estável", "Vídeos"]
    },
    "Salvador": {
        avgSpeed: "340Mb",
        technology: "Fibra/Coaxial",
        providers: ["Claro", "Vivo", "Oi"],
        bestFor: ["Redes Sociais", "Streaming Musical"]
    },
    "Fortaleza": {
        avgSpeed: "420Mb",
        technology: "Fibra Óptica",
        providers: ["Brisanet", "Claro", "Vivo", "Multiplay"],
        bestFor: ["Gamers", "Downloads"]
    },
    "Natal": {
        avgSpeed: "400Mb",
        technology: "Fibra Óptica",
        providers: ["Brisanet", "Cabo Telecom", "Claro"],
        bestFor: ["Qualidade de Serviço", "Streaming"]
    },

    // --- NORTE ---
    "Manaus": {
        avgSpeed: "280Mb",
        technology: "Fibra/Rádio",
        providers: ["Claro", "Vivo", "Tim", "Provedores Locais"],
        bestFor: ["Navegação Básica", "Comunicação"]
    },
    "Belém": {
        avgSpeed: "300Mb",
        technology: "Fibra Óptica",
        providers: ["Claro", "Vivo", "Oi"],
        bestFor: ["Estudos", "Vídeos HD"]
    },

    // --- FALLBACK ---
    "DEFAULT": {
        avgSpeed: "300Mb",
        technology: "Fibra/Cabo",
        providers: ["Vivo", "Claro", "Provedores Locais"],
        bestFor: ["Navegação", "Streaming Full HD"]
    }
};
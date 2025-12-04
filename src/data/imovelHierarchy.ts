// src/data/imovelHierarchy.ts

/**
 * Estrutura de metadados de imóveis, baseada nas categorias e finalidades do mercado.
 * Contém a hierarquia completa para classificação e listas auxiliares de atributos.
 */
export const IMÓVEIS_HIERARQUIA = [
  {
    "categoria": "Residencial",
    "prefixoID": "RS",
    "tipos": [
      // Prioridade: Locação Residencial em primeiro
      { 
        "nome": "Casa", 
        "subtipos": ["Térrea", "Sobrado", "Geminada", "Condomínio Fechado", "Alto Padrão", "De Vila", "Modular / Pré-moldada", "Container"], 
        "finalidade": ["Locação Residencial", "Venda", "Locação Temporada"] 
      },
      { 
        "nome": "Apartamento", 
        // ADICIONADO: "Alto Padrão"
        "subtipos": ["Padrão", "Alto Padrão", "Studio", "Kitnet / Quitinete", "Garden", "Duplex", "Triplex", "Cobertura", "Loft"], 
        "finalidade": ["Locação Residencial", "Venda", "Locação Temporada"] 
      },
      { 
        "nome": "Condomínio Horizontal", 
        "subtipos": ["Padrão", "Alto Padrão"], 
        "finalidade": ["Locação Residencial", "Venda"] 
      },
      { 
        "nome": "Flat", 
        "subtipos": ["Flat", "Apart-Hotel"], 
        "finalidade": ["Locação Residencial", "Locação Temporada"] 
      },
      { 
        "nome": "Moradia Estudantil", 
        "subtipos": ["República", "Moradia Estudantil"], 
        "finalidade": ["Locação Residencial"] 
      },
      { 
        "nome": "Tiny House", 
        "subtipos": ["Móvel", "Fixa"], 
        "finalidade": ["Locação Residencial", "Venda"] 
      }
    ]
  },
  {
    "categoria": "Comercial",
    "prefixoID": "CM",
    "tipos": [
      { "nome": "Sala / Conjunto Comercial", "subtipos": ["Sala Individual", "Conjunto de Salas", "Laje Corporativa", "Coworking"], "finalidade": ["Venda", "Locação Comercial", "Locação Coworking"] },
      { "nome": "Loja / Ponto", "subtipos": ["Rua", "Shopping / Galeria", "Quiosque", "Box"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Galpão / Armazém", "subtipos": ["Comercial", "Industrial", "Logístico", "Armazém", "Depósito"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Prédio / Andar Comercial", "subtipos": ["Prédio Inteiro", "Andar Comercial"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Imóvel Equipado", "subtipos": ["Consultório", "Clínica", "Restaurante", "Salão de Beleza", "Oficina", "Lava-rápido"], "finalidade": ["Locação Comercial"] }
    ]
  },
  {
    "categoria": "Terrenos",
    "prefixoID": "TR",
    "tipos": [
      { "nome": "Terreno", "subtipos": ["Residencial", "Comercial", "Industrial", "Misto", "Para Incorporação"], "finalidade": ["Venda", "Permuta", "Locação Comercial"] },
      { "nome": "Lote", "subtipos": ["Em Loteamento", "Em Condomínio Fechado"], "finalidade": ["Venda", "Permuta"] }
    ]
  },
  {
    "categoria": "Rural",
    "prefixoID": "RU",
    "tipos": [
      // Mantido todas as opções de Locação e Arrendamento.
      { "nome": "Fazenda", "subtipos": ["Pecuária", "Agricultura", "Mista", "Haras", "Reflorestamento"], "finalidade": ["Venda", "Arrendamento Rural", "Locação Temporada", "Porteira Fechada"] },
      { "nome": "Sítio", "subtipos": ["Lazer", "Produtivo"], "finalidade": ["Locação Residencial", "Venda", "Locação Temporada", "Arrendamento Rural"] },
      { "nome": "Chácara", "subtipos": ["Lazer", "Residencial", "Produção"], "finalidade": ["Locação Residencial", "Venda", "Locação Temporada"] },
      { "nome": "Terra Agrícola", "subtipos": ["Cultivo", "Pastagem", "Reflorestamento"], "finalidade": ["Venda", "Arrendamento Rural", "Locação Comercial"] },
      { "nome": "Outras Áreas Rurais", "subtipos": ["Rancho", "Estância", "Gleba", "Mineração", "Pesqueiro"], "finalidade": ["Venda", "Arrendamento Rural", "Locação Comercial"] }
    ]
  },
  {
    "categoria": "Imóveis Especiais",
    "prefixoID": "ES",
    "tipos": [
      { "nome": "Educação", "subtipos": ["Escola", "Faculdade", "Creche"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Saúde / Hotelaria", "subtipos": ["Hospital", "Casa de Repouso", "Hotel", "Motel", "Pousada"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Entretenimento", "subtipos": ["Igreja / Templo", "Teatro / Cinema", "Centro de Eventos", "Estacionamento", "Clube"], "finalidade": ["Venda", "Locação Comercial"] }
    ]
  }
];

// --- MAPAS DE CARACTERÍSTICAS POR CATEGORIA (INTELIGÊNCIA DE DADOS) ---

export const FEATURES_RESIDENCIAL = [
    'Piscina Privativa', 'Churrasqueira', 'Varanda Gourmet', 'Ar Condicionado', 
    'Mobiliado', 'Semi-mobiliado', 'Armários Embutidos', 'Closet', 'Hidromassagem', 
    'Lareira', 'Jardim de Inverno', 'Escritório / Home Office', 'Cozinha Americana', 
    'Despensa', 'Lavabo', 'Depósito Privativo', 'Aquecimento a Gás', 'Energia Solar',
    'Fechadura Digital', 'Automação Residencial', 'Vista Panorâmica', 'Vista para o Mar',
    'Acessibilidade (PCD)', 'Entrada de Serviço Independente', 'Portaria 24h', 
    'Academia', 'Salão de Festas', 'Elevador', 'Playground'
];

export const FEATURES_COMERCIAL = [
    'Piso Elevado', 'Forro Modular', 'Ar Condicionado Central', 'Gerador Privativo', 
    'Estacionamento Rotativo', 'Recepção', 'Copa', 'Vestiário', 'Mezanino', 
    'Divisórias', 'Catracas Eletrônicas', 'Sala de Reunião', 'Auditório',
    'Fibra Óptica', 'Cabeamento Estruturado', 'Sistema de Alarme', 'Câmeras de Segurança',
    'Acessibilidade (PCD)', 'Elevador', 'Heliponto'
];

export const FEATURES_INDUSTRIAL = [ // Galpões e Logística
    'Docas / Carga e Descarga', 'Plataforma Niveladora', 'Pé Direito Alto (+6m)', 
    'Piso de Alta Resistência', 'Ponte Rolante', 'Cabine Primária', 'Energia Trifásica',
    'Pátio de Manobra', 'Entrada para Caminhões', 'Cross-docking', 'Guarita Blindada',
    'Sprinklers (J4)', 'Hidrantes', 'Vestiário Funcionários', 'Refeitório',
    'Balança Rodoviária', 'Câmara Fria'
];

export const FEATURES_RURAL = [ // Exclusivo para categoria Rural
    'Casa Sede', 'Casa de Caseiro', 'Casa de Hóspedes', 
    'Curral', 'Paiol', 'Galpão Agrícola', 'Silo', 'Estábulo / Baias', 
    'Cerca / Alambrado', 'Piquetes', 'Brete / Tronco', 'Balança Rodoviária',
    'Poço Artesiano', 'Mina D\'água', 'Açude / Lago', 'Rio / Córrego', 'Represa',
    'Roda D\'água', 'Energia Elétrica (Monofásica)', 'Energia Elétrica (Trifásica)',
    'Transformador Próprio', 'Gerador Rural', 'Internet Rural', 
    'Horta', 'Pomar', 'Apiário', 'Tanque de Piscicultura', 'Área de Pastagem', 'Mata Nativa'
];

export const FEATURES_TERRENOS = [
    'Murado', 'Cercado', 'Terraplanado', 'Aterrado', 'Limpo / Desmatado',
    'Rua Asfaltada', 'Guias e Sarjetas', 'Iluminação Pública', 
    'Rede de Água', 'Rede de Esgoto', 'Energia Elétrica', 'Gás Encanado',
    'Poço Artesiano', 'Fossa Séptica', 'Arborizado', 'Vista Panorâmica',
    'Topografia Plana', 'Topografia Aclive', 'Topografia Declive'
];

export const FEATURES_ESPECIAIS = [ // Hotéis, Escolas, Hospitais
    'Cozinha Industrial', 'Refeitório', 'Auditório / Teatro', 'Quadra Poliesportiva',
    'Piscina Semi-olímpica', 'Estacionamento de Grande Porte', 'Gerador de Energia',
    'Sistema de Incêndio Completo', 'Elevador de Maca', 'Gás Encanado Industrial',
    'Isolamento Acústico', 'Ar Condicionado Central', 'Recepção Hoteleira',
    'Lavanderia Industrial', 'Área de Carga e Descarga'
];

export const INFRAESTRUTURA_CONDOMINIO = [
    'Portaria 24h', 'Segurança Armada', 'Monitoramento por Câmeras', 'Controle de Acesso Facial',
    'Piscina Coletiva', 'Piscina Aquecida', 'Piscina Infantil', 'Sauna', 'Academia / Fitness',
    'Salão de Festas', 'Salão de Jogos', 'Playground', 'Brinquedoteca', 'Quadra Poliesportiva',
    'Quadra de Tênis', 'Campo de Futebol', 'Churrasqueira Coletiva', 'Espaço Gourmet',
    'Coworking', 'Mercado / Conveniência', 'Lavanderia Coletiva', 'Pet Place / Dog Park',
    'Bicicletário', 'Carregador de Carro Elétrico', 'Gerador de Energia', 'Elevador', 'Zelador'
];

// --- HELPER FUNCTION PARA O FORMULÁRIO ---

export const getFeaturesByCategory = (categoria: string, tipoDetalhado: string): string[] => {
    if (categoria === 'Rural') return FEATURES_RURAL;
    if (categoria === 'Terrenos') return FEATURES_TERRENOS;
    if (categoria === 'Imóveis Especiais') return FEATURES_ESPECIAIS;
    
    if (categoria === 'Comercial') {
        // Se for do tipo Galpão/Industrial, retorna a lista industrial + comercial
        if (tipoDetalhado.includes('Galpão') || tipoDetalhado.includes('Industrial') || tipoDetalhado.includes('Armazém')) {
            // Remove duplicatas se houver
            return Array.from(new Set([...FEATURES_COMERCIAL, ...FEATURES_INDUSTRIAL]));
        }
        return FEATURES_COMERCIAL;
    }
    
    // Default: Residencial (Casas, Aptos, Flats)
    return FEATURES_RESIDENCIAL;
};

// MANTIDO PARA COMPATIBILIDADE LEGADA (SE NECESSÁRIO EM OUTROS ARQUIVOS)
export const COMODIDADES_RESIDENCIAIS = FEATURES_RESIDENCIAL;
export const BENFEITORIAS_RURAIS = FEATURES_RURAL;
export const CARACTERISTICAS_COMERCIAIS = FEATURES_COMERCIAL;
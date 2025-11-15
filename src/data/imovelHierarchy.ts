// src/data/imovelHierarchy.ts

/**
 * Estrutura de metadados de imóveis, baseada nas categorias e finalidades do mercado.
 */
export const IMÓVEIS_HIERARQUIA = [
  {
    "categoria": "Residencial",
    "prefixoID": "RS",
    "tipos": [
      // Prioridade: Locação Residencial em primeiro
      { "nome": "Casa", "subtipos": ["Térrea", "Sobrado", "Geminada", "Condomínio Fechado", "Alto Padrão", "De Vila", "Modular / Pré-moldada", "Container"], "finalidade": ["Locação Residencial", "Venda", "Locação Temporada"] },
      { "nome": "Apartamento", "subtipos": ["Padrão", "Studio", "Kitnet / Quitinete", "Garden", "Duplex", "Triplex", "Cobertura", "Loft"], "finalidade": ["Locação Residencial", "Venda", "Locação Temporada"] },
      { "nome": "Condomínio Horizontal", "subtipos": ["Padrão", "Alto Padrão"], "finalidade": ["Locação Residencial", "Venda"] },
      { "nome": "Flat", "subtipos": ["Flat", "Apart-Hotel"], "finalidade": ["Locação Residencial", "Locação Temporada"] },
      { "nome": "Moradia Estudantil", "subtipos": ["República", "Moradia Estudantil"], "finalidade": ["Locação Residencial"] },
      { "nome": "Tiny House", "subtipos": ["Móvel", "Fixa"], "finalidade": ["Locação Residencial", "Venda"] }
    ]
  },
  {
    "categoria": "Comercial",
    "prefixoID": "CM",
    "tipos": [
      { "nome": "Sala / Conjunto Comercial", "subtipos": ["Sala Individual", "Conjunto de Salas"], "finalidade": ["Venda", "Locação Comercial", "Locação Coworking"] },
      { "nome": "Loja / Ponto", "subtipos": ["Rua", "Shopping / Galeria", "Quiosque", "Box"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Galpão / Armazém", "subtipos": ["Comercial", "Industrial", "Armazém", "Depósito"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Prédio / Andar Comercial", "subtipos": ["Prédio Inteiro", "Andar Comercial"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Imóvel Equipado", "subtipos": ["Consultório", "Clínica", "Restaurante", "Salão de Beleza", "Oficina", "Lava-rápido"], "finalidade": ["Locação Comercial"] }
    ]
  },
  {
    "categoria": "Terrenos",
    "prefixoID": "TR",
    "tipos": [
      { "nome": "Terreno", "subtipos": ["Residencial", "Comercial", "Industrial", "Para Incorporação"], "finalidade": ["Venda", "Permuta"] },
      { "nome": "Lote", "subtipos": ["Em Loteamento", "Em Condomínio Fechado"], "finalidade": ["Venda"] }
    ]
  },
  {
    "categoria": "Rural",
    "prefixoID": "RU",
    "tipos": [
      // Alterado: Inclui todas as opções de Locação e Arrendamento.
      { "nome": "Fazenda", "subtipos": ["Pecuária", "Agricultura", "Mista", "Haras"], "finalidade": ["Venda", "Arrendamento Rural", "Locação Temporada"] },
      { "nome": "Sítio", "subtipos": ["Lazer", "Produtivo"], "finalidade": ["Locação Residencial", "Venda", "Locação Temporada", "Arrendamento Rural"] },
      { "nome": "Chácara", "subtipos": ["Lazer", "Residencial", "Produção"], "finalidade": ["Locação Residencial", "Venda", "Locação Temporada"] },
      { "nome": "Terra Agrícola", "subtipos": ["Cultivo", "Pastagem", "Reflorestamento"], "finalidade": ["Venda", "Arrendamento Rural", "Locação Comercial"] },
      { "nome": "Outras Áreas Rurais", "subtipos": ["Rancho", "Estância", "Gleba", "Mineração"], "finalidade": ["Venda", "Arrendamento Rural", "Locação Comercial"] }
    ]
  },
  {
    "categoria": "Imóveis Especiais",
    "prefixoID": "ES",
    "tipos": [
      { "nome": "Educação", "subtipos": ["Escola", "Faculdade"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Saúde / Hotelaria", "subtipos": ["Hospital", "Casa de Repouso", "Hotel", "Motel", "Pousada"], "finalidade": ["Venda", "Locação Comercial"] },
      { "nome": "Entretenimento", "subtipos": ["Igreja / Templo", "Teatro / Cinema", "Centro de Eventos", "Estacionamento"], "finalidade": ["Venda", "Locação Comercial"] }
    ]
  }
];
// src/services/CepService.ts

/**
 * Interface para o retorno simplificado da API de CEP (ViaCEP).
 */
export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string; // Estado
  erro?: boolean; // Propriedade para indicar erro na busca
}

/**
 * Busca dados de endereço completos a partir de um CEP usando a API ViaCEP.
 * @param cep O CEP a ser pesquisado (apenas números ou formatado).
 * @returns Promise<CepData | null> Os dados do endereço ou null se não encontrado/erro.
 */
export async function fetchAddressByCep(cep: string): Promise<CepData | null> {
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return null;
  }
  
  const url = `https://viacep.com.br/ws/${cleanCep}/json/`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data: any = await response.json();
    
    if (data.erro) {
        return null; 
    }
    
    // Retorna a estrutura mapeada
    return {
        cep: data.cep.replace('-', ''), 
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '', // Cidade
        uf: data.uf || '', // Estado
    } as CepData;

  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}
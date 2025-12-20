// src/services/CepService.ts

/**
 * Interface para o retorno simplificado da API de CEP.
 */
export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string; // Estado
  erro?: boolean;
}

/**
 * Busca dados de endereço chamando a API interna do Next.js (Proxy),
 * que por sua vez consulta o ViaCEP. Isso evita bloqueios de CORS e CSP.
 * * @param cep O CEP a ser pesquisado.
 * @returns Promise<CepData | null>
 */
export async function fetchAddressByCep(cep: string): Promise<CepData | null> {
  // Remove caracteres não numéricos apenas para validação rápida local
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return null;
  }
  
  // Chama a ROTA INTERNA que criamos no Passo 1
  const url = `/api/services/cep?cep=${cleanCep}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
        // Se a API retornar 404 ou 500, tratamos como não encontrado/erro
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Erro ao buscar CEP via Proxy: ${response.status}`, errorData);
        return null;
    }
    
    const data: any = await response.json();
    
    if (data.erro || data.error) {
        return null; 
    }
    
    // Retorna a estrutura mapeada
    return {
        cep: (data.cep || '').replace('-', ''), 
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '', // Cidade
        uf: data.uf || '', // Estado
    } as CepData;

  } catch (error) {
    console.error("Erro ao buscar CEP (Client):", error);
    return null;
  }
}
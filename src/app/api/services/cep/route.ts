import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cep = searchParams.get('cep');

  if (!cep) {
    return NextResponse.json({ error: 'CEP não fornecido' }, { status: 400 });
  }

  // Remove caracteres não numéricos
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return NextResponse.json({ error: 'Formato de CEP inválido' }, { status: 400 });
  }

  try {
    // --- TENTATIVA 1: ViaCEP ---
    try {
      const responseViaCep = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        cache: 'no-store', // Evita cache de erro
        headers: {
            'User-Agent': 'RentouApp/1.0' // Alguns servidores bloqueiam requests sem User-Agent
        }
      });

      if (responseViaCep.ok) {
        const data = await responseViaCep.json();
        if (!data.erro) {
          return NextResponse.json(data); // Sucesso no ViaCEP
        }
      }
    } catch (err) {
      console.warn("Falha na conexão com ViaCEP, tentando fallback...");
    }

    // --- TENTATIVA 2: BrasilAPI (Fallback) ---
    // Se o ViaCEP falhou (502, timeout, etc), tentamos a BrasilAPI
    console.log(`Tentando BrasilAPI para o CEP: ${cleanCep}`);
    const responseBrasilApi = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
        cache: 'no-store'
    });

    if (responseBrasilApi.ok) {
        const data = await responseBrasilApi.json();
        
        // Mapeamos o retorno da BrasilAPI para o formato do ViaCEP (para não quebrar seu frontend)
        const mappedData = {
            cep: data.cep,
            logradouro: data.street,
            complemento: '', // BrasilAPI v1 nem sempre retorna complemento
            bairro: data.neighborhood,
            localidade: data.city, // Mapeia city -> localidade
            uf: data.state,       // Mapeia state -> uf
            erro: false
        };

        return NextResponse.json(mappedData);
    }

    // Se ambos falharem
    return NextResponse.json({ error: 'CEP não encontrado em nenhum serviço' }, { status: 404 });

  } catch (error) {
    console.error('Erro crítico no Proxy de CEP:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar CEP' }, { status: 500 });
  }
}
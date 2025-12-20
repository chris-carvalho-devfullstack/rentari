import { NextResponse } from 'next/server';
import { db } from '@/services/FirebaseService'; 

export const runtime = 'edge'; 
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Captura dados da infraestrutura Edge da Cloudflare
  // @ts-ignore
  const cfColo = request.cf?.colo || 'Unknown';
  // @ts-ignore
  const cfCountry = request.cf?.country || 'BR';
  // @ts-ignore
  const cfCity = request.cf?.city || 'Edge Global';

  const report = {
    timestamp: new Date().toISOString(),
    status: 'online', 
    services: {
      database: { 
        status: 'unknown', 
        latency: 0, 
        message: '',
        meta: {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'N/A',
            sdkVersion: 'v9 (Modular)'
        }
      },
      cep: { 
        status: 'unknown', 
        latency: 0, 
        message: '',
        meta: {
            provider: 'Unknown',
            target: '37716220'
        }
      },
      sistema: { 
        status: 'online',
        latency: 0, // Latência interna de processamento
        message: 'Edge Runtime Ativo',
        meta: {
            environment: process.env.NODE_ENV, 
            runtime: 'Edge (V8)',
            datacenter: `${cfColo} - ${cfCity}, ${cfCountry}`,
            region: cfColo
        }
      }
    }
  };

  // 1. DATABASE CHECK
  const startDb = performance.now();
  try {
    if (db) {
        report.services.database.status = 'online';
        report.services.database.message = 'Instância Ativa';
    } else {
         throw new Error('Firebase não inicializado');
    }
  } catch (error: any) {
    report.services.database.status = 'error';
    report.services.database.message = error.message;
    report.status = 'degraded';
  }
  report.services.database.latency = Math.round(performance.now() - startDb);

  // 2. CEP SERVICE CHECK
  const startCep = performance.now();
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Testamos contra nossa própria API
    const response = await fetch(`${baseUrl}/api/services/cep?cep=${report.services.cep.meta.target}`, {
        method: 'GET',
        headers: { 'User-Agent': 'RentouHealthCheck/2.0' },
        cache: 'no-store'
    });

    if (response.ok) {
        const data = await response.json();
        report.services.cep.status = 'online';
        report.services.cep.message = 'Operacional';
        
        // Tenta inferir quem respondeu baseado na estrutura do dado
        // Se tiver 'bairro' geralmente é ViaCEP/BrasilAPI padrão.
        report.services.cep.meta.provider = data.logradouro ? 'ViaCEP / BrasilAPI' : 'Fallback Interno';
    } else {
        throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    report.services.cep.status = 'error';
    report.services.cep.message = error.message;
    report.status = 'degraded';
  }
  report.services.cep.latency = Math.round(performance.now() - startCep);

  // 3. SYSTEM LATENCY (Simbólico - tempo para montar o report)
  report.services.sistema.latency = Math.round(performance.now() - startDb);

  return NextResponse.json(report);
}
// src/app/api/system/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/services/FirebaseService'; 

// --- CONFIGURAÇÃO OBRIGATÓRIA PARA CLOUDFLARE ---
export const runtime = 'edge'; 
export const dynamic = 'force-dynamic';
// -------------------------------------------------

export async function GET(request: Request) {
  const report = {
    timestamp: new Date().toISOString(),
    status: 'online', 
    services: {
      database: { status: 'unknown', latency: 0, message: '' },
      cep: { status: 'unknown', latency: 0, message: '' },
      sistema: { environment: process.env.NODE_ENV, region: 'Edge' }
    }
  };

  // 1. TESTE DO FIREBASE (Database) - Verificação de Instância
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

  // 2. TESTE DO SERVIÇO DE CEP (Simulação de Request Interno)
  const startCep = performance.now();
  try {
    // Tenta construir a URL absoluta para fetch interno
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const testCep = '37716220'; 
    
    // Dispara contra a própria API para garantir que o Proxy e o ViaCEP estão respondendo
    const response = await fetch(`${baseUrl}/api/services/cep?cep=${testCep}`, {
        method: 'GET',
        headers: { 'User-Agent': 'RentouHealthCheck/1.0' },
        cache: 'no-store'
    });

    if (response.ok) {
        report.services.cep.status = 'online';
        report.services.cep.message = 'Operacional';
    } else {
        throw new Error(`Erro HTTP: ${response.status}`);
    }
  } catch (error: any) {
    report.services.cep.status = 'error';
    report.services.cep.message = error.message || 'Falha na verificação';
    report.status = 'degraded';
  }
  report.services.cep.latency = Math.round(performance.now() - startCep);

  return NextResponse.json(report);
}
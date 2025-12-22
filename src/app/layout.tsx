// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";

// Import da biblioteca de toasts (Notificações Modernas)
import { Toaster } from 'sonner';

// IMPORTAÇÃO DA BARRA DE PROGRESSO
import NextTopLoader from 'nextjs-toploader';

// Import Font Awesome CSS e configuração
import '@fortawesome/fontawesome-svg-core/styles.css'; 
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rentou - Portal do Proprietário",
  description: "Plataforma de gestão de locações e imóveis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Barra de Progresso "Drop-in".
          Configurada com a cor da sua marca e sem spinner (estilo YouTube).
        */}
        <NextTopLoader
          color="#1D4ED8" // Azul Rentou Primary
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false} // Sem a rodinha girando
          easing="ease"
          speed={200}
          shadow="0 0 10px #1D4ED8,0 0 5px #1D4ED8" // Efeito de brilho (Glow)
          zIndex={1600}
          showAtBottom={false}
        />
        
        <AuthProvider> 
          {children}
          {/* Componente Global de Notificações (Sonner) */}
          <Toaster richColors position="top-center" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
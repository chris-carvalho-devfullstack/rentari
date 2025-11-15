// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";

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
        {/* ENVOLVENDO A APLICAÇÃO COM O PROVIDER DE AUTENTICAÇÃO */}
        <AuthProvider> 
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
// src/components/layouts/Footer.tsx
'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react'; // Certifique-se de que lucide-react tem esses ícones, ou use FontAwesome

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Coluna 1: Marca */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                R
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Rentou<span className="text-blue-600">.</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Simplificando a gestão de imóveis e locações para proprietários e inquilinos em todo o Brasil.
            </p>
          </div>

          {/* Coluna 2: Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Plataforma</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/anuncios" className="text-base text-gray-500 hover:text-blue-600 transition">
                  Buscar Imóveis
                </Link>
              </li>
              <li>
                <Link href="/proprietario" className="text-base text-gray-500 hover:text-blue-600 transition">
                  Para Proprietários
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-base text-gray-500 hover:text-blue-600 transition">
                  Entrar
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Institucional */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Institucional</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/sobre" className="text-base text-gray-500 hover:text-blue-600 transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-base text-gray-500 hover:text-blue-600 transition">
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-base text-gray-500 hover:text-blue-600 transition">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Redes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Social</h3>
            <div className="flex space-x-6 mt-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-600 transition">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="text-base text-gray-400">
            &copy; {new Date().getFullYear()} Rentou. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
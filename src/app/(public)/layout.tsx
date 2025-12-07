// src/app/(public)/layout.tsx
import PublicNavbar from '@/components/layouts/PublicNavbar';
import Footer from '@/components/layouts/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Menu Superior (Fixo) */}
      <PublicNavbar />
      
      {/* CORREÇÃO AQUI: 
         Adicionei 'pt-20' (padding-top: 80px) para empurrar o conteúdo para baixo 
         e não ficar escondido atrás do menu que tem altura h-20.
      */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Rodapé */}
      <Footer />
    </div>
  );
}
// src/app/(public)/layout.tsx
import PublicNavbar from '@/components/layouts/PublicNavbar';
import Footer from '@/components/layouts/Footer'; // Supondo que você crie um footer depois

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Menu Superior Público */}
      <PublicNavbar />
      
      {/* Conteúdo da Página */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer (Rodapé) - Opcional por enquanto */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Rentou. Todos os direitos reservados.
      </footer>
    </div>
  );
}
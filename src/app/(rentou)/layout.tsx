// src/app/(rentou)/layout.tsx

import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';

/**
 * @fileoverview Layout principal para as rotas do grupo (rentou) - Rotas Protegidas.
 * O layout foi revisado para garantir a Sidebar (w-64) e o conteúdo principal (ml-64).
 */
export default function RentouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-zinc-900">
      {/* Sidebar fixa: w-64 */}
      <Sidebar />
      {/* Conteúdo principal: flex-1 e ml-64 (para compensar a largura da Sidebar) */}
      <div className="flex-1 flex flex-col ml-64">
        <Navbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
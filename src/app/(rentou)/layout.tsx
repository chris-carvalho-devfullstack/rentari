// src/app/(rentou)/layout.tsx

import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';

/**
 * @fileoverview Layout principal para as rotas do grupo (rentou) - Rotas Protegidas.
 */
export default function RentouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-zinc-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
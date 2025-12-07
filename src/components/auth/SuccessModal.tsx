// src/components/auth/SuccessModal.tsx

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath: string;
  redirectText: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  redirectPath,
  redirectText,
}: SuccessModalProps) {
  if (!isOpen) return null;

  const modalTitle = 'E-mail enviado!';

  return (
    // 🛑 ATUALIZAÇÃO: Removido o overlay "fixed inset-0 z-50 bg-gray-950 bg-opacity-95 backdrop-blur-sm"
    // O modal agora será apenas um bloco centralizado no meio da página.
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm transform overflow-hidden rounded-xl bg-white p-6 text-left shadow-2xl dark:bg-gray-800"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Ícone e Título */}
      <div className="flex items-center space-x-3 pb-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <h3
          className="text-lg font-bold text-gray-900 dark:text-white"
          id="modal-title"
        >
          {modalTitle}
        </h3>
      </div>

      {/* Mensagem Detalhada */}
      <div className="mt-2 space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Verifique sua caixa de entrada (e também a pasta de spam) para redefinir sua senha.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Se o seu e-mail estiver cadastrado em nosso sistema, você receberá um link para criar uma nova senha.
        </p>
      </div>

      {/* Ação (Botão) */}
      <div className="mt-6 flex justify-end">
        <Link
          href={redirectPath}
          onClick={onClose}
          className="w-full inline-flex justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-lg transition duration-150 ease-in-out hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {redirectText}
        </Link>
      </div>
    </div>
  );
}
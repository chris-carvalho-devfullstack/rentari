'use client';

import { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/services/FirebaseService'; //
import { Lock, Save } from 'lucide-react';

export default function SegurancaPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    setLoading(true);

    try {
      // 1. Reautenticar o usuário (Segurança do Firebase exige isso para operações sensíveis)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Atualizar a senha
      await updatePassword(user, newPassword);
      
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'A senha atual está incorreta.' });
      } else if (error.code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: 'Muitas tentativas. Tente novamente mais tarde.' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar senha. Verifique sua senha atual.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
        <Lock className="h-6 w-6 text-gray-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Segurança e Senha</h1>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Senha Atual
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-black dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            placeholder="Digite sua senha atual para confirmar"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-black dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-black dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        {message.text && (
          <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </div>
      </form>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { createCredentials, getCredentials, deleteCredentials } from '../utils/emqx-config';

interface Credential {
  user_id: string;
  is_superuser: boolean;
}

export default function CredentialsManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await getCredentials();
      setCredentials(data.data || []);
    } catch (err) {
      setError('Gagal memuat credentials');
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCredentials(newUsername, newPassword);
      setMessage('Credentials berhasil dibuat');
      setNewUsername('');
      setNewPassword('');
      loadCredentials();
    } catch (err) {
      setError('Gagal membuat credentials');
      console.error(err);
    }
  };

  const handleDelete = async (username: string) => {
    try {
      await deleteCredentials(username);
      setMessage('Credentials berhasil dihapus');
      loadCredentials();
    } catch (err) {
      setError('Gagal menghapus credentials');
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Kelola Credentials MQTT</h2>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleCreate} className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Buat Credentials Baru
        </button>
      </form>

      <div>
        <h3 className="text-lg font-semibold mb-2">Credentials yang Ada</h3>
        <div className="bg-white shadow-md rounded">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {credentials.map((cred) => (
                <tr key={cred.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{cred.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cred.is_superuser ? 'Superuser' : 'User'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleDelete(cred.user_id)} className="text-red-600 hover:text-red-900">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

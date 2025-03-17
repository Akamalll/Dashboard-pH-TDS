import React, { useState, useEffect } from 'react';

export default function DeviceModal({ isOpen, onClose, onSave, device, isDarkMode }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'pH',
    location: 'Kolam 1',
  });

  useEffect(() => {
    if (device) {
      setFormData(device);
    }
  }, [device]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.type && formData.location) {
      onSave(formData);
      setFormData({ name: '', type: 'pH', location: 'Kolam 1' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full shadow-xl`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{device ? 'Edit Perangkat' : 'Tambah Perangkat'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`}>Nama Perangkat</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              placeholder="Contoh: Sensor pH 1"
              required
            />
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`}>Tipe Sensor</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              required
            >
              <option value="pH">pH</option>
              <option value="TDS">TDS</option>
              <option value="Temperature">Suhu</option>
            </select>
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`}>Lokasi</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              placeholder="Contoh: Kolam 1"
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Batal
            </button>
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
              {device ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

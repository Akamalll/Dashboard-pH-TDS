import React, { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, onSave, currentSettings, isDarkMode }) {
  const [settings, setSettings] = useState(currentSettings);
  const [errors, setErrors] = useState({});

  const validateSettings = () => {
    const newErrors = {};

    // Validasi pH
    if (settings.phMin >= settings.phMax) {
      newErrors.ph = 'Batas minimum pH harus lebih kecil dari batas maksimum';
    }
    if (settings.phMin < 0 || settings.phMin > 14) {
      newErrors.phMin = 'Batas pH harus antara 0-14';
    }
    if (settings.phMax < 0 || settings.phMax > 14) {
      newErrors.phMax = 'Batas pH harus antara 0-14';
    }

    // Validasi TDS
    if (settings.tdsMin >= settings.tdsMax) {
      newErrors.tds = 'Batas minimum TDS harus lebih kecil dari batas maksimum';
    }
    if (settings.tdsMin < 0) {
      newErrors.tdsMin = 'Batas TDS tidak boleh negatif';
    }

    // Validasi interval
    if (settings.updateInterval < 1) {
      newErrors.updateInterval = 'Interval minimal 1 detik';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateSettings();

    if (Object.keys(newErrors).length === 0) {
      onSave(settings);
      onClose();
    } else {
      setErrors(newErrors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${isDarkMode ? 'bg-[#1f2937]' : 'bg-white'} rounded-xl p-6 max-w-md w-full`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* pH Settings */}
          <div className="space-y-4">
            <h3 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Batas pH</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Minimum</label>
                <input
                  type="number"
                  value={settings.phMin}
                  onChange={(e) => setSettings({ ...settings, phMin: parseFloat(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                  step="0.1"
                  min="0"
                  max="14"
                />
                {errors.phMin && <p className="text-red-500 text-xs mt-1">{errors.phMin}</p>}
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Maksimum</label>
                <input
                  type="number"
                  value={settings.phMax}
                  onChange={(e) => setSettings({ ...settings, phMax: parseFloat(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                  step="0.1"
                  min="0"
                  max="14"
                />
                {errors.phMax && <p className="text-red-500 text-xs mt-1">{errors.phMax}</p>}
              </div>
            </div>
            {errors.ph && <p className="text-red-500 text-xs">{errors.ph}</p>}
          </div>

          {/* TDS Settings */}
          <div className="space-y-4">
            <h3 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Batas TDS (ppm)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Minimum</label>
                <input
                  type="number"
                  value={settings.tdsMin}
                  onChange={(e) => setSettings({ ...settings, tdsMin: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                  min="0"
                />
                {errors.tdsMin && <p className="text-red-500 text-xs mt-1">{errors.tdsMin}</p>}
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Maksimum</label>
                <input
                  type="number"
                  value={settings.tdsMax}
                  onChange={(e) => setSettings({ ...settings, tdsMax: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                  min="0"
                />
                {errors.tdsMax && <p className="text-red-500 text-xs mt-1">{errors.tdsMax}</p>}
              </div>
            </div>
            {errors.tds && <p className="text-red-500 text-xs">{errors.tds}</p>}
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notifikasi</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" checked={settings.notificationSound} onChange={(e) => setSettings({ ...settings, notificationSound: e.target.checked })} className="mr-2" />
                <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Suara Notifikasi</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={settings.desktopNotification} onChange={(e) => setSettings({ ...settings, desktopNotification: e.target.checked })} className="mr-2" />
                <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notifikasi Desktop</label>
              </div>
            </div>
          </div>

          {/* Update Interval */}
          <div>
            <h3 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Interval Update</h3>
            <div className="mt-2">
              <input
                type="number"
                value={settings.updateInterval}
                onChange={(e) => setSettings({ ...settings, updateInterval: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                min="1"
              />
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detik</p>
              {errors.updateInterval && <p className="text-red-500 text-xs mt-1">{errors.updateInterval}</p>}
            </div>
          </div>

          {/* Export Settings */}
          <div className="space-y-4">
            <h3 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pengaturan Ekspor</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" checked={settings.autoExport} onChange={(e) => setSettings({ ...settings, autoExport: e.target.checked })} className="mr-2" />
                <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Auto Export</label>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Format Export</label>
                <select
                  value={settings.exportFormat}
                  onChange={(e) => setSettings({ ...settings, exportFormat: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Interval Export</label>
                <select
                  value={settings.exportInterval}
                  onChange={(e) => setSettings({ ...settings, exportInterval: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="hourly">Per Jam</option>
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              Batal
            </button>
            <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

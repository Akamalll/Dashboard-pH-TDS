import React from 'react';

function DevicesSection({ devices, isDarkMode, onAddDevice, onEditDevice, onDeleteDevice, onToggleStatus, realTimeData }) {
  const getStatusColor = (status) => {
    if (status === 'active') {
      return isDarkMode ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200';
    }
    if (status === 'inactive') {
      return isDarkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200';
    }
    return isDarkMode ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'pH':
        return '🧪';
      case 'TDS':
        return '💧';
      case 'Temperature':
        return '🌡️';
      case 'DO':
        return '⭕';
      default:
        return '📊';
    }
  };

  const getLastReading = (device) => {
    if (!realTimeData || device.status !== 'active') return '-';

    switch (device.type) {
      case 'pH':
        return `${realTimeData.ph.toFixed(1)} pH`;
      case 'TDS':
        return `${Math.round(realTimeData.tds)} ppm`;
      case 'Temperature':
        return `${realTimeData.temperature}°C`;
      case 'DO':
        return `${realTimeData.do} mg/L`;
      default:
        return '-';
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 mb-8`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 flex items-center`}>
            <span className="mr-2">🔌</span> Perangkat Terpasang
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Perangkat: {devices.length} | Aktif: {devices.filter((d) => d.status === 'active').length}
          </p>
        </div>
        <button
          onClick={onAddDevice}
          className={`px-6 py-3 rounded-full ${
            isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
          } text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
        >
          + Tambah Perangkat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{device.name}</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{device.location}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEditDevice(device)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`} title="Edit Perangkat">
                  ✏️
                </button>
                <button onClick={() => onDeleteDevice(device)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`} title="Hapus Perangkat">
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pembacaan Terakhir</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getLastReading(device)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{device.type}</span>
                <button onClick={() => onToggleStatus(device.id)} className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${getStatusColor(device.status)}`}>
                  {device.status === 'active' ? '🟢 Aktif' : '🔴 Nonaktif'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div className={`text-center py-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="text-lg mb-2">Belum ada perangkat terpasang</p>
          <p className="text-sm">Klik tombol "Tambah Perangkat" untuk menambahkan perangkat baru</p>
        </div>
      )}
    </div>
  );
}

export default DevicesSection;

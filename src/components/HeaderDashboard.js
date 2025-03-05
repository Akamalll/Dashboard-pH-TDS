import React from 'react';

function HeaderDashboard({ isDarkMode, setIsDarkMode, setShowSettingsModal, lastUpdate }) {
  return (
    <header className={`relative flex flex-col md:flex-row justify-between items-center mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 transition-all duration-300`}>
      {/* Last Update - Positioned at top-right */}
      <div className={`absolute top-2 right-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pembaruan terakhir: {lastUpdate.toLocaleTimeString('id-ID')}</div>

      <div className="flex items-center space-x-4 mb-4 md:mb-0">
        <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
          <span className="text-2xl">💧</span>
        </div>
        <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${isDarkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
          Dashboard Monitoring
          <span className="block text-lg md:text-xl lg:text-2xl mt-1 text-gray-500 dark:text-gray-400">Kualitas Air</span>
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
        <button
          onClick={() => setShowSettingsModal(true)}
          className={`px-6 py-3 rounded-full ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          } text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
        >
          ⚙️ Pengaturan
        </button>
      </div>
    </header>
  );
}

export default HeaderDashboard;

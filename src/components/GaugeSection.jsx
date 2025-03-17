import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

function GaugeSection({ isDarkMode, phValue, tdsValue, settings }) {
  // Normalisasi nilai untuk gauge (0-1)
  const normalizedPh = (phValue - 0) / (14 - 0);
  const normalizedTds = (tdsValue - 0) / (settings.tdsMax - 0);

  // Status dan warna berdasarkan nilai
  const getPhStatus = (value) => {
    if (value < settings.phMin)
      return {
        text: 'Terlalu Asam',
        color: '#ef4444',
        gradient: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#ef4444'],
        icon: '⚠️',
      };
    if (value > settings.phMax)
      return {
        text: 'Terlalu Basa',
        color: '#ef4444',
        gradient: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#ef4444'],
        icon: '⚠️',
      };
    return {
      text: 'Normal',
      color: '#22c55e',
      gradient: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#22c55e'],
      icon: '✅',
    };
  };

  const getTdsStatus = (value) => {
    if (value > settings.tdsMax)
      return {
        text: 'Terlalu Tinggi',
        color: '#ef4444',
        gradient: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#ef4444'],
        icon: '⚠️',
      };
    if (value < settings.tdsMin)
      return {
        text: 'Terlalu Rendah',
        color: '#eab308',
        gradient: ['#fefce8', '#fef9c3', '#fef08a', '#fde047', '#ca8a04'],
        icon: '⚠️',
      };
    return {
      text: 'Normal',
      color: '#22c55e',
      gradient: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#22c55e'],
      icon: '✅',
    };
  };

  const phStatus = getPhStatus(phValue);
  const tdsStatus = getTdsStatus(tdsValue);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div
        className={`relative overflow-hidden ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/95'} backdrop-blur-lg rounded-3xl shadow-lg p-8 
        border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-300'} 
        transform transition-all duration-500 hover:scale-[1.02] hover:shadow-xl
        ${phStatus.text === 'Normal' ? 'hover:border-green-500/50' : 'hover:border-red-500/50'}`}
      >
        {/* Background gradient effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 
          ${
            phStatus.text === 'Normal'
              ? isDarkMode
                ? 'from-green-500/20 via-emerald-500/10 to-transparent opacity-20 hover:opacity-30'
                : 'from-green-100/80 via-emerald-50/60 to-transparent opacity-60 hover:opacity-70'
              : isDarkMode
              ? 'from-red-500/20 via-rose-500/10 to-transparent opacity-20 hover:opacity-30'
              : 'from-red-100/80 via-rose-50/60 to-transparent opacity-60 hover:opacity-70'
          } -z-10`}
        ></div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mb-3
              ${isDarkMode ? 'bg-gray-700/70' : 'bg-gray-50'} backdrop-blur-sm
              ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}
              transition-colors duration-300`}
            >
              <span className="mr-1.5">🧪</span>
              pH Meter
            </div>
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-all duration-300 group-hover:scale-105`}>
              {phValue.toFixed(1)}
              <span className={`ml-1.5 text-base font-normal ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>pH</span>
            </h2>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5
            ${
              phStatus.text === 'Normal' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
            } backdrop-blur-sm transition-all duration-300 hover:shadow-md`}
          >
            <span>{phStatus.icon}</span>
            {phStatus.text}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-full max-w-[240px] -mt-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`text-4xl font-bold transition-all duration-500
                ${phStatus.text === 'Normal' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : isDarkMode ? 'text-red-400' : 'text-red-600'}`}
              >
                {phValue.toFixed(1)}
              </div>
            </div>
            <CircularProgressbar
              value={normalizedPh * 100}
              strokeWidth={10}
              styles={buildStyles({
                pathColor: phStatus.color,
                trailColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                pathTransition: 'stroke-dashoffset 1.5s ease 0s',
              })}
            />
          </div>

          <div
            className={`grid grid-cols-3 w-full gap-4 mt-4 p-4 rounded-2xl 
            ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/95'} 
            backdrop-blur-sm border ${isDarkMode ? 'border-gray-700/30' : 'border-gray-300/80'}
            transition-all duration-300 hover:border-opacity-50`}
          >
            <div className="flex flex-col items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Min</span>
              <span className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{settings.phMin}</span>
            </div>
            <div className="flex flex-col items-center border-x ${isDarkMode ? 'border-gray-700/30' : 'border-gray-300/80'}">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current</span>
              <span className={`text-lg font-semibold mt-1 transition-colors duration-300`} style={{ color: phStatus.color }}>
                {phValue.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max</span>
              <span className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{settings.phMax}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`relative overflow-hidden ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/95'} backdrop-blur-lg rounded-3xl shadow-lg p-8 
        border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-300'} 
        transform transition-all duration-500 hover:scale-[1.02] hover:shadow-xl
        ${tdsStatus.text === 'Normal' ? 'hover:border-green-500/50' : tdsStatus.text === 'Terlalu Rendah' ? 'hover:border-yellow-500/50' : 'hover:border-red-500/50'}`}
      >
        {/* Background gradient effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 
          ${
            tdsStatus.text === 'Normal'
              ? isDarkMode
                ? 'from-green-500/20 via-emerald-500/10 to-transparent opacity-20 hover:opacity-30'
                : 'from-green-100/80 via-emerald-50/60 to-transparent opacity-60 hover:opacity-70'
              : tdsStatus.text === 'Terlalu Rendah'
              ? isDarkMode
                ? 'from-yellow-500/20 via-amber-500/10 to-transparent opacity-20 hover:opacity-30'
                : 'from-yellow-100/80 via-amber-50/60 to-transparent opacity-60 hover:opacity-70'
              : isDarkMode
              ? 'from-red-500/20 via-rose-500/10 to-transparent opacity-20 hover:opacity-30'
              : 'from-red-100/80 via-rose-50/60 to-transparent opacity-60 hover:opacity-70'
          } -z-10`}
        ></div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mb-3
              ${isDarkMode ? 'bg-gray-700/70' : 'bg-gray-50'} backdrop-blur-sm
              ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}
              transition-colors duration-300`}
            >
              <span className="mr-1.5">💧</span>
              TDS Meter
            </div>
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-all duration-300 group-hover:scale-105`}>
              {Math.round(tdsValue)}
              <span className={`ml-1.5 text-base font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ppm</span>
            </h2>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5
            ${
              tdsStatus.text === 'Normal'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                : tdsStatus.text === 'Terlalu Rendah'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
            } backdrop-blur-sm transition-all duration-300 hover:shadow-md`}
          >
            <span>{tdsStatus.icon}</span>
            {tdsStatus.text}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-full max-w-[240px] -mt-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`text-4xl font-bold transition-all duration-500
                ${
                  tdsStatus.text === 'Normal' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : tdsStatus.text === 'Terlalu Rendah' ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}
              >
                {Math.round(tdsValue)}
              </div>
            </div>
            <CircularProgressbar
              value={normalizedTds * 100}
              strokeWidth={10}
              styles={buildStyles({
                pathColor: tdsStatus.color,
                trailColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                pathTransition: 'stroke-dashoffset 1.5s ease 0s',
              })}
            />
          </div>

          <div
            className={`grid grid-cols-3 w-full gap-4 mt-4 p-4 rounded-2xl 
            ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/95'} 
            backdrop-blur-sm border ${isDarkMode ? 'border-gray-700/30' : 'border-gray-300/80'}
            transition-all duration-300 hover:border-opacity-50`}
          >
            <div className="flex flex-col items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Min</span>
              <span className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{settings.tdsMin}</span>
            </div>
            <div className="flex flex-col items-center border-x ${isDarkMode ? 'border-gray-700/30' : 'border-gray-300/80'}">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current</span>
              <span className={`text-lg font-semibold mt-1 transition-colors duration-300`} style={{ color: tdsStatus.color }}>
                {Math.round(tdsValue)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max</span>
              <span className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{settings.tdsMax}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GaugeSection;

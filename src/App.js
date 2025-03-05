import { useState, useEffect, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [phValue, setPhValue] = useState(7.0);
  const [tdsValue, setTdsValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [historicalData, setHistoricalData] = useState({
    ph: Array(24).fill(7.0),
    tds: Array(24).fill(0),
    labels: Array(24).fill(''),
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [stats, setStats] = useState({
    phAvg: 7.0,
    tdsAvg: 0,
    normalTime: 100,
  });
  const [devices, setDevices] = useState(() => {
    const savedDevices = localStorage.getItem('devices');
    return savedDevices
      ? JSON.parse(savedDevices)
      : [
          { id: 1, name: 'Sensor pH', type: 'pH', status: 'active', location: 'Kolam 1' },
          { id: 2, name: 'Sensor TDS', type: 'TDS', status: 'active', location: 'Kolam 1' },
        ];
  });
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'pH',
    location: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('settings');
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          phMin: 6.5,
          phMax: 8.5,
          tdsMax: 600,
          notificationSound: true,
          autoExport: false,
          exportInterval: 'daily',
        };
  });

  const phValueRef = useRef(phValue);
  const tdsValueRef = useRef(tdsValue);

  const handleExportData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      ph: historicalData.ph,
      tds: historicalData.tds,
      labels: historicalData.labels,
      stats: stats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water-quality-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [historicalData, stats]);

  // Sinkronisasi darkMode ke localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Sinkronisasi devices ke localStorage
  useEffect(() => {
    localStorage.setItem('devices', JSON.stringify(devices));
  }, [devices]);

  // Sinkronisasi settings ke localStorage
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  // Update refs when values change
  useEffect(() => {
    phValueRef.current = phValue;
  }, [phValue]);

  useEffect(() => {
    tdsValueRef.current = tdsValue;
  }, [tdsValue]);

  useEffect(() => {
    // Inisialisasi label waktu
    const now = new Date();
    const labels = Array(24)
      .fill('')
      .map((_, i) => {
        const time = new Date(now - (23 - i) * 3600000);
        return time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      });
    setHistoricalData((prev) => ({ ...prev, labels }));

    const interval = setInterval(() => {
      // Simulasi perubahan nilai pH (antara 6.5 - 8.5)
      setPhValue((prevPh) => {
        const change = (Math.random() - 0.5) * 0.2;
        const newValue = prevPh + change;
        const finalValue = Math.min(Math.max(newValue, 6.5), 8.5);

        setHistoricalData((prev) => ({
          ...prev,
          ph: [...prev.ph.slice(1), finalValue],
        }));

        return finalValue;
      });

      // Simulasi perubahan nilai TDS (antara 0 - 1000 ppm)
      setTdsValue((prevTds) => {
        const change = (Math.random() - 0.5) * 50;
        const newValue = prevTds + change;
        const finalValue = Math.min(Math.max(newValue, 0), 1000);

        setHistoricalData((prev) => ({
          ...prev,
          tds: [...prev.tds.slice(1), finalValue],
        }));

        setStats((prev) => ({
          phAvg: (prev.phAvg * 23 + finalValue) / 24,
          tdsAvg: (prev.tdsAvg * 23 + finalValue) / 24,
          normalTime: prev.normalTime,
        }));

        return finalValue;
      });

      // Cek notifikasi dengan threshold yang disesuaikan
      if (phValueRef.current < settings.phMin || phValueRef.current > settings.phMax || tdsValueRef.current > settings.tdsMax) {
        const messages = [];
        if (phValueRef.current < settings.phMin) messages.push('pH Air terlalu asam!');
        else if (phValueRef.current > settings.phMax) messages.push('pH Air terlalu basa!');
        if (tdsValueRef.current > settings.tdsMax) messages.push('TDS Air terlalu tinggi!');

        setNotificationMessage(messages.join(' dan '));
        setShowNotification(true);

        // Play notification sound if enabled
        if (settings.notificationSound) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(console.error);
        }

        setTimeout(() => setShowNotification(false), 5000);
      }

      // Auto export if enabled
      if (settings.autoExport) {
        const now = new Date();
        const lastExport = localStorage.getItem('lastExport');
        const shouldExport =
          !lastExport ||
          (settings.exportInterval === 'daily' && new Date(lastExport).getDate() !== now.getDate()) ||
          (settings.exportInterval === 'weekly' && new Date(lastExport).getTime() + 7 * 24 * 60 * 60 * 1000 < now.getTime()) ||
          (settings.exportInterval === 'monthly' && new Date(lastExport).getMonth() !== now.getMonth());

        if (shouldExport) {
          handleExportData();
          localStorage.setItem('lastExport', now.toISOString());
        }
      }

      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [settings, handleExportData]);

  const getPhStatus = (ph) => {
    if (ph < 6.5) return { text: 'Asam', color: 'text-red-500', gradient: 'from-red-500 to-red-600' };
    if (ph > 8.5) return { text: 'Basa', color: 'text-blue-500', gradient: 'from-blue-500 to-blue-600' };
    return { text: 'Netral', color: 'text-green-500', gradient: 'from-green-500 to-green-600' };
  };

  const getTdsStatus = (tds) => {
    if (tds < 300) return { text: 'Baik', color: 'text-green-500', gradient: 'from-green-500 to-green-600' };
    if (tds < 600) return { text: 'Sedang', color: 'text-yellow-500', gradient: 'from-yellow-500 to-yellow-600' };
    return { text: 'Tinggi', color: 'text-red-500', gradient: 'from-red-500 to-red-600' };
  };

  const phStatus = getPhStatus(phValue);
  const tdsStatus = getTdsStatus(tdsValue);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Grafik Historis 24 Jam Terakhir',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const chartData = {
    labels: historicalData.labels,
    datasets: [
      {
        label: 'pH',
        data: historicalData.ph,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
      {
        label: 'TDS (ppm)',
        data: historicalData.tds,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const handleAddDevice = () => {
    if (newDevice.name && newDevice.location) {
      const device = {
        id: devices.length + 1,
        ...newDevice,
        status: 'active',
      };
      setDevices([...devices, device]);
      setNewDevice({ name: '', type: 'pH', location: '' });
      setShowDeviceModal(false);
    }
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setNewDevice({
      name: device.name,
      type: device.type,
      location: device.location,
    });
    setShowDeviceModal(true);
  };

  const handleUpdateDevice = () => {
    if (editingDevice && newDevice.name && newDevice.location) {
      setDevices(devices.map((device) => (device.id === editingDevice.id ? { ...device, ...newDevice } : device)));
      setEditingDevice(null);
      setNewDevice({ name: '', type: 'pH', location: '' });
      setShowDeviceModal(false);
    }
  };

  const handleDeleteDevice = (deviceId) => {
    setDeviceToDelete(deviceId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDevice = () => {
    if (deviceToDelete) {
      setDevices(devices.filter((device) => device.id !== deviceToDelete));
      setShowDeleteConfirm(false);
      setDeviceToDelete(null);
    }
  };

  const cancelDeleteDevice = () => {
    setShowDeleteConfirm(false);
    setDeviceToDelete(null);
  };

  const toggleDeviceStatus = (deviceId) => {
    setDevices(devices.map((device) => (device.id === deviceId ? { ...device, status: device.status === 'active' ? 'inactive' : 'active' } : device)));
  };

  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}`}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className={`flex flex-col md:flex-row justify-between items-center mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 transition-all duration-300`}>
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${isDarkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'} mb-4 md:mb-0`}>Dashboard Monitoring Kualitas Air</h1>
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* pH Card */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02]`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <span className="mr-2">🧪</span> Nilai pH
            </h2>
            <div className="flex flex-col items-center">
              <div className={`text-5xl font-bold mb-3 ${phStatus.color}`}>{phValue.toFixed(1)}</div>
              <div className={`text-lg ${phStatus.color} px-4 py-1 rounded-full bg-opacity-20 ${phStatus.color.replace('text', 'bg')}`}>{phStatus.text}</div>
            </div>
          </div>

          {/* TDS Card */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02]`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <span className="mr-2">💧</span> TDS (ppm)
            </h2>
            <div className="flex flex-col items-center">
              <div className={`text-5xl font-bold mb-3 ${tdsStatus.color}`}>{Math.round(tdsValue)}</div>
              <div className={`text-lg ${tdsStatus.color} px-4 py-1 rounded-full bg-opacity-20 ${tdsStatus.color.replace('text', 'bg')}`}>{tdsStatus.text}</div>
            </div>
          </div>

          {/* Stats Card */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02]`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <span className="mr-2">📊</span> Statistik
            </h2>
            <div className="space-y-4">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl`}>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-1`}>pH Rata-rata</p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.phAvg.toFixed(1)}</p>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl`}>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-1`}>TDS Rata-rata</p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(stats.tdsAvg)} ppm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 mb-8 transition-all duration-300 hover:shadow-xl`}>
          <Line
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  ...chartOptions.plugins.title,
                  font: {
                    size: 16,
                    weight: 'bold',
                  },
                  color: isDarkMode ? '#fff' : '#1f2937',
                },
                legend: {
                  ...chartOptions.plugins.legend,
                  labels: {
                    color: isDarkMode ? '#fff' : '#1f2937',
                    font: {
                      size: 12,
                    },
                  },
                },
              },
              scales: {
                y: {
                  ...chartOptions.scales.y,
                  grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                  ticks: {
                    color: isDarkMode ? '#fff' : '#1f2937',
                  },
                },
                x: {
                  grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                  ticks: {
                    color: isDarkMode ? '#fff' : '#1f2937',
                  },
                },
              },
            }}
            data={chartData}
            className="w-full h-[300px] md:h-[400px]"
          />
        </div>

        {/* Devices Section */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 mb-8`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 md:mb-0 flex items-center`}>
              <span className="mr-2">🔌</span> Perangkat Terpasang
            </h2>
            <button
              onClick={() => {
                setEditingDevice(null);
                setNewDevice({ name: '', type: 'pH', location: '' });
                setShowDeviceModal(true);
              }}
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
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{device.name}</h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{device.location}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEditDevice(device)} className="p-2 text-blue-500 hover:text-blue-600 transition-colors">
                      ✏️
                    </button>
                    <button onClick={() => handleDeleteDevice(device.id)} className="p-2 text-red-500 hover:text-red-600 transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{device.type}</span>
                  <button
                    onClick={() => toggleDeviceStatus(device.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                      device.status === 'active'
                        ? isDarkMode
                          ? 'bg-green-900 text-green-200 hover:bg-green-800'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                        : isDarkMode
                        ? 'bg-red-900 text-red-200 hover:bg-red-800'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {device.status === 'active' ? '🟢 Aktif' : '🔴 Nonaktif'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last Update */}
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>Pembaruan terakhir: {lastUpdate.toLocaleTimeString('id-ID')}</div>

        {/* Notification */}
        {showNotification && <div className="fixed bottom-4 right-4 max-w-md bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-lg animate-slide-in">⚠️ {notificationMessage}</div>}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100`}>
              <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <span className="mr-2">⚙️</span> Pengaturan
              </h2>
              <div className="space-y-6">
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>pH Minimum</label>
                  <input
                    type="number"
                    value={settings.phMin}
                    onChange={(e) => handleSettingsChange('phMin', parseFloat(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} transition-all duration-300`}
                  />
                </div>
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>pH Maksimum</label>
                  <input
                    type="number"
                    value={settings.phMax}
                    onChange={(e) => handleSettingsChange('phMax', parseFloat(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} transition-all duration-300`}
                  />
                </div>
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>TDS Maksimum (ppm)</label>
                  <input
                    type="number"
                    value={settings.tdsMax}
                    onChange={(e) => handleSettingsChange('tdsMax', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} transition-all duration-300`}
                  />
                </div>
                <div className={`flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                  <input
                    type="checkbox"
                    checked={settings.notificationSound}
                    onChange={(e) => handleSettingsChange('notificationSound', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 transition-all duration-300"
                  />
                  <label className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Suara Notifikasi</label>
                </div>
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Auto Export</label>
                  <div className="flex items-center space-x-4">
                    <input type="checkbox" checked={settings.autoExport} onChange={(e) => handleSettingsChange('autoExport', e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 transition-all duration-300" />
                    <select
                      value={settings.exportInterval}
                      onChange={(e) => handleSettingsChange('exportInterval', e.target.value)}
                      className={`flex-1 px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                      disabled={!settings.autoExport}
                    >
                      <option value="daily">Harian</option>
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`px-6 py-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-500 hover:bg-gray-600'} text-white transition-all duration-300 transform hover:scale-105`}
                >
                  Tutup
                </button>
                <button
                  onClick={handleExportData}
                  className={`px-6 py-2 rounded-full ${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  } text-white transition-all duration-300 transform hover:scale-105`}
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Device Modal */}
        {showDeviceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100`}>
              <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <span className="mr-2">{editingDevice ? '✏️' : '➕'}</span>
                {editingDevice ? 'Edit Perangkat' : 'Tambah Perangkat'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Nama Perangkat</label>
                  <input
                    type="text"
                    value={editingDevice ? editingDevice.name : newDevice.name}
                    onChange={(e) => (editingDevice ? setEditingDevice({ ...editingDevice, name: e.target.value }) : setNewDevice({ ...newDevice, name: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} transition-all duration-300`}
                  />
                </div>
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Tipe</label>
                  <select
                    value={editingDevice ? editingDevice.type : newDevice.type}
                    onChange={(e) => (editingDevice ? setEditingDevice({ ...editingDevice, type: e.target.value }) : setNewDevice({ ...newDevice, type: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                  >
                    <option value="pH">pH</option>
                    <option value="TDS">TDS</option>
                  </select>
                </div>
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Lokasi</label>
                  <input
                    type="text"
                    value={editingDevice ? editingDevice.location : newDevice.location}
                    onChange={(e) => (editingDevice ? setEditingDevice({ ...editingDevice, location: e.target.value }) : setNewDevice({ ...newDevice, location: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} transition-all duration-300`}
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeviceModal(false)}
                  className={`px-6 py-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-500 hover:bg-gray-600'} text-white transition-all duration-300 transform hover:scale-105`}
                >
                  Batal
                </button>
                <button
                  onClick={editingDevice ? handleUpdateDevice : handleAddDevice}
                  className={`px-6 py-2 rounded-full ${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  } text-white transition-all duration-300 transform hover:scale-105`}
                >
                  {editingDevice ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100`}>
              <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <span className="mr-2">🗑️</span> Konfirmasi Hapus
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Apakah Anda yakin ingin menghapus perangkat ini?</p>
              <div className="flex justify-end space-x-4">
                <button onClick={cancelDeleteDevice} className={`px-6 py-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-500 hover:bg-gray-600'} text-white transition-all duration-300 transform hover:scale-105`}>
                  Batal
                </button>
                <button
                  onClick={confirmDeleteDevice}
                  className={`px-6 py-2 rounded-full ${
                    isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  } text-white transition-all duration-300 transform hover:scale-105`}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

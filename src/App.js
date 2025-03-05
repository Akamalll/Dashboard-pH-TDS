import { useState, useEffect } from 'react';
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
      setPhValue((prev) => {
        const change = (Math.random() - 0.5) * 0.2;
        const newValue = prev + change;
        return Math.min(Math.max(newValue, 6.5), 8.5);
      });

      // Simulasi perubahan nilai TDS (antara 0 - 1000 ppm)
      setTdsValue((prev) => {
        const change = (Math.random() - 0.5) * 50;
        const newValue = prev + change;
        return Math.min(Math.max(newValue, 0), 1000);
      });

      // Update data historis
      setHistoricalData((prev) => ({
        ...prev,
        ph: [...prev.ph.slice(1), phValue],
        tds: [...prev.tds.slice(1), tdsValue],
      }));

      // Update statistik
      setStats((prev) => ({
        phAvg: (prev.phAvg * 23 + phValue) / 24,
        tdsAvg: (prev.tdsAvg * 23 + tdsValue) / 24,
        normalTime: prev.normalTime,
      }));

      // Cek notifikasi dengan threshold yang disesuaikan
      if (phValue < settings.phMin || phValue > settings.phMax || tdsValue > settings.tdsMax) {
        let message = '';
        if (phValue < settings.phMin) message = 'pH Air terlalu asam!';
        else if (phValue > settings.phMax) message = 'pH Air terlalu basa!';
        if (tdsValue > settings.tdsMax) message += message ? ' dan ' : '' + 'TDS Air terlalu tinggi!';
        setNotificationMessage(message);
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
  }, [settings]);

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

  const handleExportData = () => {
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
  };

  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}`}>
      {/* Notifikasi */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">{notificationMessage}</div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">Konfirmasi Hapus</h2>
            <p className="mb-6">Apakah Anda yakin ingin menghapus perangkat ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-4">
              <button onClick={cancelDeleteDevice} className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">
                Batal
              </button>
              <button onClick={confirmDeleteDevice} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">Monitor Kualitas Air</h1>
            <p className="text-xs sm:text-sm opacity-75">Sistem Monitoring pH dan TDS Air Real-time</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleExportData}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              📊 Ekspor Data
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              ⚙️ Pengaturan
            </button>
            <button
              onClick={() => setShowDeviceModal(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              + Tambah Perangkat
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {isDarkMode ? '☀️ Mode Terang' : '🌙 Mode Gelap'}
            </button>
          </div>
        </div>

        {/* Daftar Perangkat */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Perangkat Terhubung</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div key={device.id} className={`p-4 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{device.name}</h3>
                  <button onClick={() => toggleDeviceStatus(device.id)} className={`px-2 py-1 rounded-full text-xs ${device.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {device.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <p className="text-sm opacity-75 mb-2">Tipe: {device.type}</p>
                <p className="text-sm opacity-75 mb-4">Lokasi: {device.location}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEditDevice(device)} className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteDevice(device.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors">
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Tambah/Edit Perangkat */}
        {showDeviceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-2xl font-bold mb-4">{editingDevice ? 'Edit Perangkat' : 'Tambah Perangkat Baru'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Perangkat</label>
                  <input
                    type="text"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama perangkat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Perangkat</label>
                  <select value={newDevice.type} onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="pH">Sensor pH</option>
                    <option value="TDS">Sensor TDS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan lokasi perangkat"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowDeviceModal(false);
                    setEditingDevice(null);
                    setNewDevice({ name: '', type: 'pH', location: '' });
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
                <button onClick={editingDevice ? handleUpdateDevice : handleAddDevice} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                  {editingDevice ? 'Update' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pengaturan */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-2xl font-bold mb-4">Pengaturan</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Batas Minimum pH</label>
                  <input
                    type="number"
                    value={settings.phMin}
                    onChange={(e) => handleSettingsChange('phMin', parseFloat(e.target.value))}
                    step="0.1"
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Batas Maksimum pH</label>
                  <input
                    type="number"
                    value={settings.phMax}
                    onChange={(e) => handleSettingsChange('phMax', parseFloat(e.target.value))}
                    step="0.1"
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Batas Maksimum TDS (ppm)</label>
                  <input
                    type="number"
                    value={settings.tdsMax}
                    onChange={(e) => handleSettingsChange('tdsMax', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Suara Notifikasi</label>
                  <div className="flex items-center">
                    <input type="checkbox" checked={settings.notificationSound} onChange={(e) => handleSettingsChange('notificationSound', e.target.checked)} className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500" />
                    <span className="ml-2">Aktifkan suara notifikasi</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ekspor Otomatis</label>
                  <div className="flex items-center">
                    <input type="checkbox" checked={settings.autoExport} onChange={(e) => handleSettingsChange('autoExport', e.target.checked)} className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500" />
                    <span className="ml-2">Aktifkan ekspor otomatis</span>
                  </div>
                </div>
                {settings.autoExport && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Interval Ekspor</label>
                    <select value={settings.exportInterval} onChange={(e) => handleSettingsChange('exportInterval', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="daily">Setiap Hari</option>
                      <option value="weekly">Setiap Minggu</option>
                      <option value="monthly">Setiap Bulan</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8">
          {/* Card pH */}
          <div className={`p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold">pH Air</h2>
              <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r ${phStatus.gradient} text-white text-xs sm:text-sm font-medium`}>{phStatus.text}</div>
            </div>
            <div className="flex items-baseline space-x-2 mb-4 sm:mb-6">
              <p className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">{phValue.toFixed(1)}</p>
              <p className="text-lg sm:text-xl font-semibold opacity-75">pH</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-xs sm:text-sm opacity-75">Kadar pH Air</p>
              <div className="w-full h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${((phValue - 6.5) / 2) * 100}%`,
                    background: `linear-gradient(to right, ${phStatus.color.replace('text-', '')}, ${phStatus.color.replace('text-', '')}dd)`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card TDS */}
          <div className={`p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl transform hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold">TDS Air</h2>
              <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r ${tdsStatus.gradient} text-white text-xs sm:text-sm font-medium`}>{tdsStatus.text}</div>
            </div>
            <div className="flex items-baseline space-x-2 mb-4 sm:mb-6">
              <p className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">{Math.round(tdsValue)}</p>
              <p className="text-lg sm:text-xl font-semibold opacity-75">ppm</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-xs sm:text-sm opacity-75">Total Dissolved Solids</p>
              <div className="w-full h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(tdsValue / 1000) * 100}%`,
                    background: `linear-gradient(to right, ${tdsStatus.color.replace('text-', '')}, ${tdsStatus.color.replace('text-', '')}dd)`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Grafik Historis */}
        <div className={`p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl mb-8 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
          <Line options={chartOptions} data={chartData} />
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
          <div className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
            <h3 className="text-lg font-semibold mb-2">Rata-rata pH</h3>
            <p className="text-2xl font-bold text-blue-500">{stats.phAvg.toFixed(1)}</p>
          </div>
          <div className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
            <h3 className="text-lg font-semibold mb-2">Rata-rata TDS</h3>
            <p className="text-2xl font-bold text-green-500">{Math.round(stats.tdsAvg)} ppm</p>
          </div>
          <div className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
            <h3 className="text-lg font-semibold mb-2">Kondisi Normal</h3>
            <p className="text-2xl font-bold text-purple-500">{stats.normalTime}%</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-xs sm:text-sm opacity-75">Pembaruan terakhir: {lastUpdate.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}

export default App;

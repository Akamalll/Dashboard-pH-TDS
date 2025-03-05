import { useState, useEffect, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import HeaderDashboard from './components/HeaderDashboard';
import SettingsModal from './components/SettingsModal';
import DevicesSection from './components/DevicesSection';
import DeviceModal from './components/DeviceModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import * as XLSX from 'xlsx';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : true; // Default ke dark mode
  });
  const [phValue, setPhValue] = useState(7.0);
  const [tdsValue, setTdsValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('24h');
  const [historicalData, setHistoricalData] = useState({
    ph: Array(24).fill(7.0),
    tds: Array(24).fill(0),
    labels: Array.from({ length: 24 }, (_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - (23 - i));
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }),
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
          {
            id: 1,
            name: 'Sensor pH',
            type: 'pH',
            status: 'active',
            location: 'Kolam 1',
            lastReading: 7.0,
            lastUpdate: new Date().toISOString(),
          },
          {
            id: 2,
            name: 'Sensor TDS',
            type: 'TDS',
            status: 'active',
            location: 'Kolam 1',
            lastReading: 350,
            lastUpdate: new Date().toISOString(),
          },
          {
            id: 3,
            name: 'Sensor Suhu',
            type: 'Temperature',
            status: 'active',
            location: 'Kolam 2',
            lastReading: 25,
            lastUpdate: new Date().toISOString(),
          },
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
          phMax: 7.5,
          tdsMin: 0,
          tdsMax: 1000,
          updateInterval: 5,
          notificationSound: true,
          desktopNotification: true,
          notificationInterval: 30,
          autoExport: false,
          exportFormat: 'json',
          exportInterval: 'daily',
        };
  });

  const phValueRef = useRef(phValue);
  const tdsValueRef = useRef(tdsValue);

  // Add deleteConfirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    deviceId: null,
    deviceName: '',
  });

  const [realTimeData, setRealTimeData] = useState({
    ph: 7.0,
    tds: 0,
    temperature: 25,
    do: 6.5,
  });

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

  // Effect untuk menyimpan preferensi dark mode
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
    // Minta izin notifikasi desktop saat aplikasi dimuat
    if (settings.desktopNotification) {
      Notification.requestPermission();
    }
  }, [settings.desktopNotification]);

  const showDesktopNotification = (message) => {
    if (settings.desktopNotification && Notification.permission === 'granted') {
      new Notification('Peringatan Kualitas Air', {
        body: message,
        icon: '/favicon.ico',
      });
    }
  };

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

        const notificationMessage = messages.join(' dan ');
        setNotificationMessage(notificationMessage);
        setShowNotification(true);

        // Play notification sound if enabled
        if (settings.notificationSound) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(console.error);
        }

        // Show desktop notification if enabled
        showDesktopNotification(notificationMessage);

        setTimeout(() => setShowNotification(false), settings.notificationInterval * 1000);
      }

      // Auto export if enabled
      if (settings.autoExport) {
        const now = new Date();
        const lastExport = localStorage.getItem('lastExport');
        const shouldExport =
          !lastExport ||
          (settings.exportInterval === 'hourly' && new Date(lastExport).getHours() !== now.getHours()) ||
          (settings.exportInterval === 'daily' && new Date(lastExport).getDate() !== now.getDate()) ||
          (settings.exportInterval === 'weekly' && new Date(lastExport).getTime() + 7 * 24 * 60 * 60 * 1000 < now.getTime()) ||
          (settings.exportInterval === 'monthly' && new Date(lastExport).getMonth() !== now.getMonth());

        if (shouldExport) {
          if (settings.exportFormat === 'csv') {
            exportToCSV();
          } else {
            handleExportData();
          }
          localStorage.setItem('lastExport', now.toISOString());
        }
      }

      setLastUpdate(new Date());
    }, settings.updateInterval * 1000);

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

  const chartData = {
    labels: historicalData.labels,
    datasets: [
      {
        label: 'pH',
        data: historicalData.ph,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.5)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(37, 99, 235)',
        pointBorderColor: '#fff',
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 4,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'TDS (ppm)',
        data: historicalData.tds,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.5)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(34, 197, 94)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 4,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear',
        from: 0.8,
        to: 0.4,
        loop: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#fff' : '#111827',
        bodyColor: isDarkMode ? '#fff' : '#111827',
        padding: 12,
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(17, 24, 39, 0.1)',
        borderWidth: 1,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (context.dataset.yAxisID === 'y') {
              return `pH: ${value.toFixed(1)}`;
            }
            return `TDS: ${value.toFixed(0)} ppm`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? '#9CA3AF' : '#4B5563',
          font: {
            size: 10,
            weight: '500',
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        position: 'left',
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 24, 39, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? '#9CA3AF' : '#4B5563',
          font: {
            size: 10,
            weight: '500',
          },
          callback: (value) => `${value.toFixed(1)} pH`,
          padding: 8,
        },
        min: 0,
        max: 14,
        beginAtZero: true,
      },
      y1: {
        position: 'right',
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? '#9CA3AF' : '#4B5563',
          font: {
            size: 10,
            weight: '500',
          },
          callback: (value) => `${value} ppm`,
          padding: 8,
        },
        beginAtZero: true,
      },
    },
  };

  const handleAddDevice = (deviceData) => {
    const newDevice = {
      id: Date.now(),
      ...deviceData,
      status: 'active',
    };
    setDevices([...devices, newDevice]);
    setShowDeviceModal(false);
    // Tampilkan notifikasi sukses
    setNotificationMessage('Perangkat berhasil ditambahkan');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setShowDeviceModal(true);
  };

  const handleUpdateDevice = (updatedData) => {
    setDevices(devices.map((device) => (device.id === editingDevice.id ? { ...device, ...updatedData } : device)));
    setEditingDevice(null);
    setShowDeviceModal(false);
    // Tampilkan notifikasi sukses
    setNotificationMessage('Perangkat berhasil diperbarui');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleDeleteDevice = (device) => {
    setDevices(devices.filter((d) => d.id !== device.id));
    // Tampilkan notifikasi sukses
    setNotificationMessage('Perangkat berhasil dihapus');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const toggleDeviceStatus = (deviceId) => {
    setDevices(devices.map((device) => (device.id === deviceId ? { ...device, status: device.status === 'active' ? 'inactive' : 'active' } : device)));
  };

  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    setShowSettingsModal(false);
    // Tampilkan notifikasi sukses
    setNotificationMessage('Pengaturan berhasil disimpan');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  }, []);

  // Fungsi untuk toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Fungsi untuk export data ke CSV
  const exportToCSV = () => {
    try {
      // Persiapkan data untuk di-export
      const data = historicalData.labels.map((time, index) => ({
        Waktu: time,
        pH: historicalData.ph[index].toFixed(1),
        TDS: historicalData.tds[index],
      }));

      // Buat header CSV
      const headers = ['Waktu', 'pH', 'TDS'];

      // Convert data ke format CSV
      const csvContent = [
        headers.join(','), // Header row
        ...data.map((row) => [row.Waktu, row.pH, row.TDS].join(',')),
      ].join('\n');

      // Buat blob dan download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const fileName = `monitoring_data_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;

      if (window.navigator.msSaveOrOpenBlob) {
        // Untuk IE
        window.navigator.msSaveOrOpenBlob(blob, fileName);
      } else {
        // Untuk browser lain
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Tampilkan notifikasi sukses
      setNotificationMessage('Data berhasil diexport ke CSV');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setNotificationMessage('Gagal mengexport data');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:80/values');
        const data = await response.json();
        setRealTimeData({
          ph: parseFloat(data.ph),
          tds: parseFloat(data.tds),
          temperature: parseFloat(data.temperature || 25),
          do: parseFloat(data.do || 6.5),
        });

        // Update historical data
        setHistoricalData((prev) => ({
          ...prev,
          ph: [...prev.ph.slice(1), data.ph],
          tds: [...prev.tds.slice(1), data.tds],
        }));

        // Update stats
        setStats((prev) => ({
          phAvg: (prev.phAvg * 23 + data.ph) / 24,
          tdsAvg: (prev.tdsAvg * 23 + data.tds) / 24,
          normalTime: prev.normalTime,
        }));

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    const interval = setInterval(fetchData, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <HeaderDashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} setShowSettingsModal={setShowSettingsModal} lastUpdate={lastUpdate} />

        {/* Main Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* pH Card */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">pH Air</h2>
            <div className="flex flex-col space-y-4">
              <div className={`text-4xl font-bold ${phStatus.color}`}>{phValue.toFixed(1)}</div>
              <div className={`text-lg ${phStatus.color}`}>Status: {phStatus.text}</div>
            </div>
          </div>

          {/* TDS Card */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">TDS (PPM)</h2>
            <div className="flex flex-col space-y-4">
              <div className={`text-4xl font-bold ${tdsStatus.color}`}>{Math.round(tdsValue)}</div>
              <div className={`text-lg ${tdsStatus.color}`}>Status: {tdsStatus.text}</div>
            </div>
          </div>

          {/* Stats Card */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-lg md:col-span-2 lg:col-span-1`}>
            <h2 className="text-xl font-semibold mb-4">Statistik</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Rata-rata pH</p>
                <p className="text-2xl font-bold">{stats.phAvg.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rata-rata TDS</p>
                <p className="text-2xl font-bold">{Math.round(stats.tdsAvg)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">Grafik Monitoring pH dan TDS</h2>
            <div className="h-[400px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Devices Section */}
        <DevicesSection
          devices={devices}
          isDarkMode={isDarkMode}
          onAddDevice={() => setShowDeviceModal(true)}
          onEditDevice={handleEditDevice}
          onDeleteDevice={(device) => {
            setDeviceToDelete(device);
            setShowDeleteConfirm(true);
          }}
          onToggleStatus={toggleDeviceStatus}
          realTimeData={realTimeData}
        />
      </div>

      {/* Modals */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} onSave={handleSaveSettings} currentSettings={settings} isDarkMode={isDarkMode} />

      {showDeviceModal && (
        <DeviceModal
          isOpen={showDeviceModal}
          onClose={() => {
            setShowDeviceModal(false);
            setEditingDevice(null);
          }}
          onSave={editingDevice ? handleUpdateDevice : handleAddDevice}
          device={editingDevice || newDevice}
          isDarkMode={isDarkMode}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            if (deviceToDelete) {
              handleDeleteDevice(deviceToDelete);
              setDeviceToDelete(null);
            }
            setShowDeleteConfirm(false);
          }}
          deviceName={deviceToDelete?.name || ''}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Notification */}
      {showNotification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${isDarkMode ? 'bg-red-900 text-white' : 'bg-red-100 text-red-900'} transition-all duration-300 transform translate-y-0 opacity-100`}>{notificationMessage}</div>
      )}
    </div>
  );
}

export default App;

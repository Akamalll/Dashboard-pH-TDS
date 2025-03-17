import { useState, useEffect, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import HeaderDashboard from './components/HeaderDashboard';
import SettingsModal from './components/SettingsModal';
import DevicesSection from './components/DevicesSection';
import DeviceModal from './components/DeviceModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import GaugeSection from './components/GaugeSection';
import Footer from './components/Footer';
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

  const [realTimeData, setRealTimeData] = useState({
    ph: 7.0,
    tds: 0,
    temperature: 25,
    do: 6.5,
  });

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
      // Simulasi perubahan nilai pH dan TDS
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

      setTdsValue((prevTds) => {
        const change = (Math.random() - 0.5) * 50;
        const newValue = prevTds + change;
        const finalValue = Math.min(Math.max(newValue, 0), 1000);

        setHistoricalData((prev) => ({
          ...prev,
          tds: [...prev.tds.slice(1), finalValue],
        }));

        return finalValue;
      });

      setLastUpdate(new Date());

      // Update realTimeData
      setRealTimeData((prev) => ({
        ...prev,
        ph: phValueRef.current,
        tds: tdsValueRef.current,
        temperature: Math.round(25 + (Math.random() - 0.5) * 2),
        do: Math.round((6.5 + (Math.random() - 0.5)) * 10) / 10,
      }));

      // Cek notifikasi
      if (phValueRef.current < settings.phMin || phValueRef.current > settings.phMax || tdsValueRef.current > settings.tdsMax) {
        const messages = [];
        if (phValueRef.current < settings.phMin) messages.push('pH Air terlalu asam!');
        else if (phValueRef.current > settings.phMax) messages.push('pH Air terlalu basa!');
        if (tdsValueRef.current > settings.tdsMax) messages.push('TDS Air terlalu tinggi!');

        const notificationMessage = messages.join(' dan ');
        setNotificationMessage(notificationMessage);
        setShowNotification(true);

        if (settings.notificationSound) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(console.error);
        }

        showDesktopNotification(notificationMessage);

        setTimeout(() => setShowNotification(false), settings.notificationInterval * 1000);
      }
    }, settings.updateInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.updateInterval, settings.phMin, settings.phMax, settings.tdsMax, settings.notificationSound, settings.notificationInterval]);

  const handleAddDevice = (deviceData) => {
    const newDevice = {
      ...deviceData,
      id: Date.now(),
      status: 'active',
      lastReading: deviceData.type === 'pH' ? 7.0 : 0,
      lastUpdate: new Date().toISOString(),
    };
    setDevices((prev) => [...prev, newDevice]);
    setShowDeviceModal(false);
  };

  const handleEditDevice = (deviceData) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceData.id
          ? {
              ...device,
              ...deviceData,
            }
          : device
      )
    );
    setShowDeviceModal(false);
    setEditingDevice(null);
  };

  const handleDeleteDevice = (device) => {
    setDeviceToDelete(device);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDevice = () => {
    if (deviceToDelete) {
      setDevices((prev) => prev.filter((device) => device.id !== deviceToDelete.id));
      setShowDeleteConfirm(false);
      setDeviceToDelete(null);
    }
  };

  const handleToggleDeviceStatus = (deviceId) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              status: device.status === 'active' ? 'inactive' : 'active',
            }
          : device
      )
    );
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#fff' : '#000',
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const phChartData = {
    labels: historicalData.labels,
    datasets: [
      {
        label: 'pH',
        data: historicalData.ph,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const tdsChartData = {
    labels: historicalData.labels,
    datasets: [
      {
        label: 'TDS (ppm)',
        data: historicalData.tds,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <HeaderDashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} setShowSettingsModal={setShowSettingsModal} lastUpdate={lastUpdate} />

        {/* Notification */}
        {showNotification && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            <p className="font-medium">{notificationMessage}</p>
          </div>
        )}

        {/* Devices Section */}
        <DevicesSection
          devices={devices}
          isDarkMode={isDarkMode}
          onAddDevice={() => setShowDeviceModal(true)}
          onEditDevice={(device) => {
            setEditingDevice(device);
            setShowDeviceModal(true);
          }}
          onDeleteDevice={handleDeleteDevice}
          onToggleStatus={handleToggleDeviceStatus}
          realTimeData={realTimeData}
        />

        {/* Gauge Section */}
        <GaugeSection isDarkMode={isDarkMode} phValue={phValue} tdsValue={tdsValue} settings={settings} />

        {/* Charts Section */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-8`}>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Grafik pH</h2>
            <Line options={chartOptions} data={phChartData} />
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Grafik TDS</h2>
            <Line options={chartOptions} data={tdsChartData} />
          </div>
        </div>

        {/* Modals */}
        <DeviceModal
          isOpen={showDeviceModal}
          onClose={() => {
            setShowDeviceModal(false);
            setEditingDevice(null);
          }}
          onSave={editingDevice ? handleEditDevice : handleAddDevice}
          device={editingDevice}
          isDarkMode={isDarkMode}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeviceToDelete(null);
          }}
          onConfirm={confirmDeleteDevice}
          deviceName={deviceToDelete?.name}
          isDarkMode={isDarkMode}
        />

        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} onSave={setSettings} currentSettings={settings} isDarkMode={isDarkMode} />
      </div>

      <Footer />
    </div>
  );
}

export default App;

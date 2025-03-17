import mqtt, { MqttClient, IClientOptions } from 'mqtt';

// Konfigurasi MQTT - EMQX Cloud
const MQTT_CONFIG = {
  // Konfigurasi EMQX Cloud
  SERVER: 'mqtts://d6916faa.ala.eu-central-1.emqxsl.com',
  PORT: 8883, // Port untuk MQTT over TLS/SSL
  WS_PORT: 8084, // Port untuk WebSocket over TLS/SSL
  USERNAME: process.env.NEXT_PUBLIC_MQTT_USERNAME || 'your_username',
  PASSWORD: process.env.NEXT_PUBLIC_MQTT_PASSWORD || 'your_password',
  USE_SSL: true,
};

const MQTT_TOPICS = {
  PH: 'sensor/ph',
  TDS: 'sensor/tds',
  DEVICE_STATUS: 'device/status',
  CONTROL_CALIBRATION: 'control/calibration',
  CONTROL_SETTINGS: 'control/settings',
};

class MQTTClient {
  private static instance: MQTTClient;
  private client: MqttClient | null = null;
  private subscribers: Map<string, Function[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.connect();
  }

  public static getInstance(): MQTTClient {
    if (!MQTTClient.instance) {
      MQTTClient.instance = new MQTTClient();
    }
    return MQTTClient.instance;
  }

  private connect() {
    const options: IClientOptions = {
      port: MQTT_CONFIG.PORT,
      protocol: 'mqtts',
      clientId: `web_client_${Math.random().toString(16).substring(2, 8)}`,
      username: MQTT_CONFIG.USERNAME,
      password: MQTT_CONFIG.PASSWORD,
      keepalive: 60,
      reconnectPeriod: 5000,
      clean: true,
      rejectUnauthorized: true, // Mengaktifkan verifikasi SSL
      ca: undefined, // Akan menggunakan CA certificates default sistem
    };

    this.client = mqtt.connect(MQTT_CONFIG.SERVER, options);

    this.client.on('connect', () => {
      console.log('Connected to EMQX broker');
      // Subscribe ke semua topik yang diperlukan
      Object.values(MQTT_TOPICS).forEach((topic) => {
        this.client?.subscribe(topic, { qos: 1 }); // QoS 1 untuk memastikan pesan terkirim
      });

      // Publish status koneksi
      this.publish(MQTT_TOPICS.DEVICE_STATUS, {
        status: 'connected',
        clientId: options.clientId,
        timestamp: new Date().toISOString(),
      });
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      const subscribers = this.subscribers.get(topic) || [];
      subscribers.forEach((callback) => {
        try {
          const payload = JSON.parse(message.toString());
          callback(payload);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    });

    this.client.on('error', (error) => {
      console.error('MQTT Error:', error);
    });

    this.client.on('close', () => {
      console.log('Connection to EMQX broker closed');
    });

    this.client.on('offline', () => {
      console.log('MQTT client is offline');
    });

    this.client.on('reconnect', () => {
      console.log('Trying to reconnect to EMQX broker...');
    });
  }

  public subscribe(topic: string, callback: Function, qos: 0 | 1 | 2 = 1) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
      // Memastikan subscription dengan QoS yang sesuai
      this.client?.subscribe(topic, { qos });
    }
    this.subscribers.get(topic)?.push(callback);
  }

  public publish(topic: string, message: any, qos: 0 | 1 | 2 = 1) {
    if (this.client?.connected) {
      this.client.publish(topic, JSON.stringify(message), { qos, retain: false });
    } else {
      console.warn('Client not connected. Message not sent:', { topic, message });
    }
  }

  public unsubscribe(topic: string, callback: Function) {
    const subscribers = this.subscribers.get(topic) || [];
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
      if (subscribers.length === 0) {
        this.client?.unsubscribe(topic);
        this.subscribers.delete(topic);
      }
    }
  }

  // Helper methods untuk memudahkan penggunaan
  public sendCalibration(phCalibration: number, tdsCalibration: number) {
    this.publish(MQTT_TOPICS.CONTROL_CALIBRATION, {
      ph: phCalibration,
      tds: tdsCalibration,
      timestamp: new Date().toISOString(),
    });
  }

  public sendSettings(settings: any) {
    this.publish(MQTT_TOPICS.CONTROL_SETTINGS, {
      ...settings,
      timestamp: new Date().toISOString(),
    });
  }

  // Method untuk mengecek status koneksi
  public isConnected(): boolean {
    return this.client?.connected || false;
  }

  // Method untuk memaksa reconnect
  public reconnect() {
    if (this.client) {
      this.client.end(true, {}, () => {
        this.connect();
      });
    }
  }
}

export default MQTTClient.getInstance();
export { MQTT_TOPICS, MQTT_CONFIG };

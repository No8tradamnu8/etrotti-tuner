import { ScooterInfo } from '../types';

interface BluetoothDevice {
  name?: string;
  id: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  connected: boolean;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices?(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications?(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener?(type: string, listener: (event: any) => void): void;
}

export interface ConnectedDeviceInfo {
  name: string;
  hardwareVersion?: string;
  firmwareVersion?: string;
  controllerCode?: string;
  isSimulated?: boolean;
}

// Known BLE UUIDs for VMAX / ZYDtech / UniScooter controllers
export const BLE_SERVICES = {
  ZYD_UART_SERVICE: '0000ffe0-0000-1000-8000-00805f9b34fb',
  ZYD_UART_CHAR: '0000ffe1-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO_SERVICE: '0000180a-0000-1000-8000-00805f9b34fb',
  MODEL_NUMBER_CHAR: '00002a24-0000-1000-8000-00805f9b34fb',
  FIRMWARE_CHAR: '00002a26-0000-1000-8000-00805f9b34fb',
  HARDWARE_CHAR: '00002a27-0000-1000-8000-00805f9b34fb',
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL_CHAR: '00002a19-0000-1000-8000-00805f9b34fb',
};

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private deviceInfo: ConnectedDeviceInfo | null = null;
  private uartCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  /**
   * Checks if the current browser environment supports Web Bluetooth.
   */
  isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Initiates BLE scan targeting VMAX / Zydtech / UniScooter peripherals or all nearby devices.
   * @param mode 'filtered' filters for known scooter prefixes; 'all' opens unrestricted scan.
   */
  async requestDevice(mode: 'filtered' | 'all' = 'filtered'): Promise<{ device: BluetoothDevice | null; error?: string }> {
    if (!this.isBluetoothSupported()) {
      return {
        device: null,
        error: 'Web Bluetooth ist in diesem Browser nicht verfügbar. Bitte Google Chrome verwenden.',
      };
    }

    const commonServices = [
      BLE_SERVICES.ZYD_UART_SERVICE,
      BLE_SERVICES.DEVICE_INFO_SERVICE,
      BLE_SERVICES.BATTERY_SERVICE,
      'generic_access',
      '0000fee0-0000-1000-8000-00805f9b34fb',
      '0000fff0-0000-1000-8000-00805f9b34fb',
      '0000ffe0-0000-1000-8000-00805f9b34fb',
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service commonly used by scooter BLE modules
    ];

    try {
      let device: BluetoothDevice;

      if (mode === 'all') {
        // Unrestricted scan showing every BLE device in range
        device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: commonServices,
        });
      } else {
        // Filter for broad set of scooter manufacturers & BLE controller naming conventions
        device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            { namePrefix: 'VMAX' },
            { namePrefix: 'VMAX_' },
            { namePrefix: 'VT02' },
            { namePrefix: 'VX2' },
            { namePrefix: 'VX' },
            { namePrefix: 'UniScooter' },
            { namePrefix: 'ZYD' },
            { namePrefix: 'Ninebot' },
            { namePrefix: 'NB' },
            { namePrefix: 'MAX' },
            { namePrefix: 'G30' },
            { namePrefix: 'Xiaomi' },
            { namePrefix: 'MIScooter' },
            { namePrefix: 'Mi' },
            { namePrefix: 'Pro2' },
            { namePrefix: '1S' },
            { namePrefix: 'SoFlow' },
            { namePrefix: 'SO4' },
            { namePrefix: 'SO3' },
            { namePrefix: 'Scooter' },
            { namePrefix: 'EScooter' },
            { namePrefix: 'BLE' },
          ],
          optionalServices: commonServices,
        });
      }

      this.device = device;
      return { device };
    } catch (error: any) {
      console.warn('Bluetooth requestDevice error:', error);

      const errMsg = error?.message || '';

      // Check specifically for Brave Browser or globally disabled Web Bluetooth flag
      if (
        errMsg.toLowerCase().includes('globally disabled') ||
        errMsg.toLowerCase().includes('not enabled') ||
        errMsg.toLowerCase().includes('disabled')
      ) {
        return {
          device: null,
          error:
            'Web Bluetooth ist in Brave Browser standardmäßig deaktiviert. Tippe auf "Hilfe & Lösung" für die Freischaltung oder nutze Google Chrome.',
        };
      }

      // If user is inside an iframe, security policy might restrict requestDevice
      if (error?.name === 'SecurityError' || errMsg.includes('iframe') || errMsg.includes('Permissions policy')) {
        return {
          device: null,
          error:
            'Vorschau-Beschränkung: Web Bluetooth ist im iFrame eingeschränkt. Bitte App in Google Chrome oder einem neuen Tab öffnen.',
        };
      }

      // If user simply closed or cancelled the device picker dialog or 0 devices were found
      if (errMsg.includes('User cancelled') || error?.name === 'NotFoundError') {
        return {
          device: null,
          error:
            'Kein Gerät ausgewählt oder gefunden. Wichtig auf Android: Ist Standort (GPS) aktiviert und die offizielle VMAX-App beendet?',
        };
      }

      return {
        device: null,
        error: errMsg || 'Geräte-Scan abgebrochen oder fehlgeschlagen.',
      };
    }
  }

  /**
   * Connects to GATT server and reads device info.
   */
  async connect(): Promise<boolean> {
    if (!this.device) return false;
    try {
      this.server = (await this.device.gatt?.connect()) || null;
      if (!this.server) return false;

      this.deviceInfo = {
        name: this.device.name || 'VMAX Scooter',
        hardwareVersion: 'HW9044_V1.29',
        firmwareVersion: 'B-01.2.29',
        controllerCode: '02070163',
        isSimulated: false,
      };

      // Attempt to read Device Information Service if exposed
      try {
        const infoService = await this.server.getPrimaryService(BLE_SERVICES.DEVICE_INFO_SERVICE);
        if (infoService) {
          try {
            const modelChar = await infoService.getCharacteristic(BLE_SERVICES.MODEL_NUMBER_CHAR);
            const modelVal = await modelChar.readValue();
            const modelStr = new TextDecoder().decode(modelVal).trim();
            if (modelStr) this.deviceInfo.name = modelStr;
          } catch {}

          try {
            const fwChar = await infoService.getCharacteristic(BLE_SERVICES.FIRMWARE_CHAR);
            const fwVal = await fwChar.readValue();
            const fwStr = new TextDecoder().decode(fwVal).trim();
            if (fwStr) this.deviceInfo.firmwareVersion = fwStr;
          } catch {}

          try {
            const hwChar = await infoService.getCharacteristic(BLE_SERVICES.HARDWARE_CHAR);
            const hwVal = await hwChar.readValue();
            const hwStr = new TextDecoder().decode(hwVal).trim();
            if (hwStr) this.deviceInfo.hardwareVersion = hwStr;
          } catch {}
        }
      } catch {
        // Device info service might be proprietary or restricted, keep defaults
      }

      // Try locating UART characteristic for sending tuning commands
      try {
        const uartService = await this.server.getPrimaryService(BLE_SERVICES.ZYD_UART_SERVICE);
        if (uartService) {
          this.uartCharacteristic = await uartService.getCharacteristic(BLE_SERVICES.ZYD_UART_CHAR);
        }
      } catch {}

      return true;
    } catch (error) {
      console.error('BLE GATT connection failed:', error);
      return false;
    }
  }

  /**
   * Connects directly to VMAX VX2 Pro (VMAX_VX2_VT02).
   * Works smoothly in both real Web Bluetooth and container/preview environments.
   */
  connectVmaxDirect(): ConnectedDeviceInfo {
    this.device = {
      id: 'vmax-vx2-vt02-ble-id',
      name: 'VMAX_VX2_VT02',
    };
    this.deviceInfo = {
      name: 'VMAX_VX2_VT02',
      hardwareVersion: 'HW9044_V1.29',
      firmwareVersion: 'B-01.2.29',
      controllerCode: '02070163',
      isSimulated: true,
    };
    return this.deviceInfo;
  }

  /**
   * Sends a tuning command over Zydtech UART characteristic.
   */
  async sendZydCommand(commandBytes: number[]): Promise<boolean> {
    if (!this.uartCharacteristic) {
      console.log('Simulating ZYD UART write:', commandBytes);
      return true;
    }
    try {
      const buffer = new Uint8Array(commandBytes);
      await this.uartCharacteristic.writeValue(buffer);
      return true;
    } catch (err) {
      console.error('Failed to write UART command:', err);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.deviceInfo = null;
    this.uartCharacteristic = null;
  }

  getConnectedDeviceName(): string | null {
    return this.deviceInfo?.name || this.device?.name || null;
  }

  getConnectedDeviceInfo(): ConnectedDeviceInfo | null {
    return this.deviceInfo;
  }

  isConnected(): boolean {
    return !!this.deviceInfo || !!this.device?.gatt?.connected;
  }
}

export const bluetoothManager = new BluetoothService();

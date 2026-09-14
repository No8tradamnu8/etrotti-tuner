export interface ScooterInfo {
  modelName: string;
  manufacturer: string;
  hardwareVersion?: string;
  firmwareVersion?: string;
  controllerCode?: string;
  appPlatform?: string;
  tuningCapabilities: TuningOption[];
  originalSpecs: {
    topSpeed: number;
    power: number;
    range: number;
    voltage?: number;
  };
}

export interface TuningOption {
  title: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  possibleGains: string;
  category?: 'firmware' | 'ble' | 'hardware' | 'parameters';
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export interface ScooterStats {
  speed: number;
  battery: number;
  current: number;
  voltage: number;
  temperature: number;
  odometer: number;
}

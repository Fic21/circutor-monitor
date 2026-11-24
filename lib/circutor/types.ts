
export interface CircutorMeasure {
  Name: string;
  Instantaneous: string | number;
}

export interface CircutorResponse {
  deviceData?: {
    measures?: CircutorMeasure[];
  };
  measures?: CircutorMeasure[];
}

export interface EnergyData {
  voltage: number;
  current: number;
  activePower: number;
  reactivePower: number;
  apparentPower: number;
  powerFactor: number;
  thdv: number;
  thdi: number;
  frequency: number;
  updatedAt: string;
}

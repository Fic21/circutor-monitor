export interface EnergyMetric {
  title: string;
  value: number;
  unit: string;
  icon: string;
}

export interface EnergyApiResponse {
  success: boolean;
  data?: import("@/lib/circutor/types").EnergyData;
  error?: string;
}
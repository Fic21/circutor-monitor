import type {
  CircutorResponse,
  EnergyData,
} from "./types";

export function parseCircutorData(
  response: CircutorResponse
): EnergyData {
  const measures =
    response.deviceData?.measures ??
    response.measures ??
    [];

  const getValue = (name: string): number => {
    const item = measures.find(
      (measure) => measure.Name === name
    );

    if (!item) return 0;

    const value = Number(item.Instantaneous);

    return Number.isFinite(value) ? value : 0;
  };

  return {
    voltage: getValue("Voltage"),
    current: getValue("Current"),
    activePower: getValue("ActivePower"),
    reactivePower: getValue("ReactivePower"),
    apparentPower: getValue("ApparentPower"),
    powerFactor: getValue("CosPhi"),
    thdv: getValue("THDv"),
    thdi: getValue("THDi"),
    frequency: getValue("Frequency"),
    updatedAt: new Date().toISOString(),
  };
}
export type ControllerMode = 'table' | 'ac' | 'light' | 'curtain';

export type AcModeType = 'auto' | 'cool' | 'dry' | 'heat';

export interface ControllerState {
  mode: ControllerMode;
  tableHeight: number; // 60-120 cm
  acTemp: number; // 16-30 C
  acFan: number; // 1-5
  acMode: AcModeType;
  acSwing: boolean; // 风口摇摆
  acPower: boolean; // 电源开关
  lightBrightness: number; // 0-100
  curtainPosition: number; // 0-100
}

export const MODES: { id: ControllerMode; label: string; icon: string }[] = [
  { id: 'table', label: 'Height', icon: 'MoveVertical' },
  { id: 'ac', label: 'A/C', icon: 'Wind' },
  { id: 'light', label: 'Light', icon: 'Sun' },
  { id: 'curtain', label: 'Curtain', icon: 'Maximize2' },
];

export const getModeBounds = (mode: ControllerMode) => {
  switch (mode) {
    case 'table': return { min: 60, max: 120, step: 1, unit: 'cm' };
    case 'ac': return { min: 16, max: 30, step: 0.5, unit: '°C' };
    case 'light': return { min: 0, max: 100, step: 1, unit: '%' };
    case 'curtain': return { min: 0, max: 100, step: 1, unit: '%' };
  }
};

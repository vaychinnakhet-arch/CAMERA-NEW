export interface CapturedImage {
  id: string;
  url: string; // Data URL
  timestamp: number;
  width: number;
  height: number;
  isEnhanced: boolean;
  metadata: {
    iso: number;
    shutterSpeed: string;
    aperture: string;
    mode: string;
  };
}

export enum CameraMode {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  PRO = 'PRO', // Simulates Stacking/High Res
}

export interface CameraSettings {
  iso: number;
  shutterSpeed: string;
  aperture: string;
  wb: string;
  ev: string;
}
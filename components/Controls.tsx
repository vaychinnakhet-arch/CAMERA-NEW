import React from 'react';
import { CameraMode } from '../types';
import { Settings, Aperture, Timer, Zap, Grid3X3, Image as ImageIcon, Video, ZapOff } from 'lucide-react';

interface ControlsProps {
  mode: CameraMode;
  setMode: (mode: CameraMode) => void;
  onCapture: () => void;
  isCapturing: boolean;
  onGalleryClick: () => void;
  lastPhotoUrl?: string;
  gridEnabled: boolean;
  toggleGrid: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  mode,
  setMode,
  onCapture,
  isCapturing,
  onGalleryClick,
  lastPhotoUrl,
  gridEnabled,
  toggleGrid
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-8 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent">
      
      {/* Mode Dial */}
      <div className="flex items-center space-x-6 mb-6 text-xs font-bold tracking-widest uppercase bg-black/50 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">
        <button 
          onClick={() => setMode(CameraMode.VIDEO)}
          className={`transition-colors ${mode === CameraMode.VIDEO ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
        >
          Video
        </button>
        <div className="w-px h-3 bg-gray-600"></div>
        <button 
          onClick={() => setMode(CameraMode.PHOTO)}
          className={`transition-colors ${mode === CameraMode.PHOTO ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
        >
          Photo
        </button>
        <div className="w-px h-3 bg-gray-600"></div>
        <button 
          onClick={() => setMode(CameraMode.PRO)}
          className={`transition-colors ${mode === CameraMode.PRO ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
        >
          Pro Stacking
        </button>
      </div>

      <div className="flex items-center justify-between w-full px-8 max-w-lg">
        
        {/* Gallery / Playback */}
        <button 
          onClick={onGalleryClick}
          className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-600 overflow-hidden relative group active:scale-95 transition-transform"
        >
          {lastPhotoUrl ? (
            <img src={lastPhotoUrl} alt="Last capture" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              <ImageIcon size={20} />
            </div>
          )}
        </button>

        {/* Shutter Button */}
        <button 
          onClick={onCapture}
          disabled={isCapturing}
          className={`
            relative w-20 h-20 rounded-full border-4 border-zinc-300 flex items-center justify-center shadow-lg
            transition-all active:scale-95 active:border-orange-500
            ${mode === CameraMode.VIDEO ? 'bg-transparent' : 'bg-white/10 backdrop-blur-sm'}
          `}
        >
          <div className={`
            w-16 h-16 rounded-full transition-all duration-300
            ${isCapturing ? 'scale-90 bg-red-600' : mode === CameraMode.VIDEO ? 'bg-red-500 w-10 h-10 rounded-lg' : 'bg-white'}
          `}></div>
          {/* Sony Orange Ring Accent */}
          <div className="absolute inset-0 rounded-full border border-orange-600 opacity-0 active:opacity-100 transition-opacity"></div>
        </button>

        {/* Quick Settings */}
        <button 
            onClick={toggleGrid}
            className={`w-12 h-12 rounded-full flex items-center justify-center border border-zinc-700 bg-zinc-900/80 backdrop-blur active:bg-zinc-800 ${gridEnabled ? 'text-orange-500' : 'text-white'}`}
        >
           <Grid3X3 size={20} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
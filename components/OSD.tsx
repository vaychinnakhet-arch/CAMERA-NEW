import React, { useEffect, useState } from 'react';
import { CameraSettings, CameraMode } from '../types';
import { Battery, Wifi, Aperture, Clock, Zap } from 'lucide-react';

interface OSDProps {
  settings: CameraSettings;
  mode: CameraMode;
}

const OSD: React.FC<OSDProps> = ({ settings, mode }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none p-4 flex flex-col justify-between">
      
      {/* Top Info Bar */}
      <div className="flex justify-between items-start text-xs font-mono font-bold text-white drop-shadow-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded">
             <span className="text-orange-500">{mode}</span>
             <span>RAW+J</span>
             <span className="text-zinc-400">24MP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-black/40 px-2 py-1 rounded">AF-C</span>
            <span className="bg-black/40 px-2 py-1 rounded">Wide</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full">
           <Wifi size={14} className="text-gray-300"/>
           <span className="text-green-400 font-bold">STBY</span>
           <span>{time}</span>
           <Battery size={16} className="text-white fill-white"/>
           <span>84%</span>
        </div>
      </div>

      {/* Bottom Params */}
      <div className="flex justify-between items-end mb-24 text-white font-mono drop-shadow-md">
         <div className="flex gap-6 items-end">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-orange-500 uppercase">Shutter</span>
                <span className="text-xl font-bold">{settings.shutterSpeed}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-orange-500 uppercase">Iris</span>
                <span className="text-xl font-bold">{settings.aperture}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-orange-500 uppercase">ISO</span>
                <span className="text-xl font-bold">{settings.iso}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase">E.V.</span>
                <span className="text-lg font-bold">{settings.ev}</span>
            </div>
         </div>
         
         <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-300">ISO AUTO</span>
            <span className="text-orange-500 text-sm font-bold">[ 9999 ]</span>
         </div>
      </div>

    </div>
  );
};

export default OSD;
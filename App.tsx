import React, { useRef, useState, useEffect, useCallback } from 'react';
import Controls from './components/Controls';
import OSD from './components/OSD';
import { CameraMode, CameraSettings, CapturedImage } from './types';
import { performStacking, processSonyLook } from './services/imageProcessing';
import { analyzeImageScene } from './services/geminiService';
import { X, Wand2, Loader2, Download, RefreshCcw, AlertTriangle, RefreshCw } from 'lucide-react';

// Default Simulated Settings
const DEFAULT_SETTINGS: CameraSettings = {
  iso: 100,
  shutterSpeed: '1/250',
  aperture: 'f/1.4',
  wb: 'AWB',
  ev: '+0.0'
};

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<CameraMode>(CameraMode.PHOTO);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photos, setPhotos] = useState<CapturedImage[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedImage | null>(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  
  // System State
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Dynamic Settings (Simulation)
  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_SETTINGS);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);

    // Stop existing tracks if any
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      let mediaStream: MediaStream;
      
      try {
        // Try preferred settings (Rear camera, 4K)
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 3840 }, 
            height: { ideal: 2160 }
          },
          audio: false
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Primary camera config failed, trying fallback...", err);
        // Fallback to any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false 
        });
      }

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Important: Explicitly call play() and ensure muted is set in JSX
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError("SENSOR ERROR: ACCESS DENIED OR NOT FOUND");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Camera
  useEffect(() => {
    startCamera();
    
    // Cleanup function
    return () => {
      // We don't stop the stream here immediately to prevent flicker on hot reloads, 
      // but in a real app or unmount we should.
      // The startCamera function handles stopping previous streams.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated Light Metering
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly fluctuate exposure values to simulate metering
      const isos = [100, 125, 160, 200, 400, 800];
      const shutters = ['1/500', '1/250', '1/1000', '1/125'];
      
      setSettings(prev => ({
        ...prev,
        iso: isos[Math.floor(Math.random() * isos.length)],
        shutterSpeed: shutters[Math.floor(Math.random() * shutters.length)]
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    setIsCapturing(true);

    try {
      let dataUrl = '';
      
      if (mode === CameraMode.PRO) {
        // Perform Image Stacking
        dataUrl = await performStacking(videoRef.current, canvasRef.current);
      } else {
        // Normal Capture
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          // Apply Sony Filters
          processSonyLook(canvas);
          dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        }
      }

      if (dataUrl) {
        const newPhoto: CapturedImage = {
          id: Date.now().toString(),
          url: dataUrl,
          timestamp: Date.now(),
          width: canvasRef.current.width,
          height: canvasRef.current.height,
          isEnhanced: mode === CameraMode.PRO,
          metadata: { ...settings, mode }
        };
        setPhotos(prev => [newPhoto, ...prev]);
      }
    } catch (e) {
      console.error("Capture failed", e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAiAnalysis = async (photo: CapturedImage) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeImageScene(photo.url);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("AI Service Unavailable.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Camera View */}
      <div className="relative flex-1 bg-zinc-900 overflow-hidden flex items-center justify-center">
        
        {/* Loading State */}
        {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white space-y-4">
                <Loader2 className="animate-spin text-orange-500" size={48} />
                <span className="font-mono text-sm tracking-widest animate-pulse">INITIALIZING SENSOR...</span>
            </div>
        )}

        {/* Error State */}
        {cameraError && !isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white space-y-6 p-8 text-center">
                <AlertTriangle className="text-red-500" size={64} />
                <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-wider text-red-500">SYSTEM ERROR</h2>
                    <p className="font-mono text-xs text-zinc-400">{cameraError}</p>
                </div>
                <button 
                    onClick={() => startCamera()}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-600 rounded hover:bg-zinc-700 transition-colors"
                >
                    <RefreshCw size={18} />
                    <span>RETRY INITIALIZATION</span>
                </button>
            </div>
        )}

        {/* Video Stream */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted // Critical for mobile autoplay
          className={`h-full w-full object-cover brightness-105 contrast-[1.1] saturate-[1.1] transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
        />
        
        {/* Overlays (Only show when camera is active and no error) */}
        {!isLoading && !cameraError && (
            <>
                {/* Grid Overlay */}
                {gridEnabled && (
                  <div className="absolute inset-0 pointer-events-none opacity-40">
                     <div className="w-full h-full border border-white/20 grid grid-cols-3 grid-rows-3">
                         <div className="border-r border-b border-white/20"></div>
                         <div className="border-r border-b border-white/20"></div>
                         <div className="border-b border-white/20"></div>
                         <div className="border-r border-b border-white/20"></div>
                         <div className="border-r border-b border-white/20"></div>
                         <div className="border-b border-white/20"></div>
                         <div className="border-r border-white/20"></div>
                         <div className="border-r border-white/20"></div>
                         <div></div>
                     </div>
                  </div>
                )}

                {/* Focus Box (Center) */}
                {!galleryOpen && (
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/50 corner-marks focus-box pointer-events-none">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white"></div>
                   </div>
                )}

                {/* OSD Layer */}
                {!galleryOpen && <OSD settings={settings} mode={mode} />}
            </>
        )}
      </div>

      {/* Main Controls (Hide if error) */}
      {!galleryOpen && !cameraError && (
        <Controls 
          mode={mode} 
          setMode={setMode} 
          onCapture={handleCapture} 
          isCapturing={isCapturing}
          onGalleryClick={() => setGalleryOpen(true)}
          lastPhotoUrl={photos[0]?.url}
          gridEnabled={gridEnabled}
          toggleGrid={() => setGridEnabled(!gridEnabled)}
        />
      )}

      {/* Gallery Overlay */}
      {galleryOpen && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
          {/* Gallery Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
            <h2 className="text-white font-bold text-lg tracking-wider">MEDIA</h2>
            <button onClick={() => { setGalleryOpen(false); setSelectedPhoto(null); setAiAnalysis(null); }} className="text-white p-2">
              <X />
            </button>
          </div>

          {/* Main View Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-1">
            {selectedPhoto ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center bg-zinc-950 relative">
                   <img src={selectedPhoto.url} className="max-h-full max-w-full object-contain" alt="Selected" />
                   
                   {/* Info Overlay */}
                   <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-2 rounded text-xs font-mono text-zinc-300">
                      <div>{selectedPhoto.metadata.mode} | {selectedPhoto.metadata.iso} | {selectedPhoto.metadata.shutterSpeed}</div>
                      <div className="text-zinc-500">{new Date(selectedPhoto.timestamp).toLocaleString()}</div>
                   </div>
                </div>

                {/* AI Analysis Panel */}
                <div className="bg-zinc-900 p-6 border-t border-zinc-800 min-h-[200px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-orange-500 font-bold flex items-center gap-2">
                            <Wand2 size={18} />
                            SONY AI ENGINE
                        </h3>
                        <div className="flex gap-2">
                            {/* Download */}
                            <a href={selectedPhoto.url} download={`sony_a1_${selectedPhoto.id}.jpg`} className="p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700">
                                <Download size={20}/>
                            </a>
                            <button 
                                onClick={() => handleAiAnalysis(selectedPhoto)}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-sm rounded hover:bg-zinc-200 disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" size={16}/> : <RefreshCcw size={16}/>}
                                {aiAnalysis ? 'RE-ANALYZE' : 'ANALYZE SCENE'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-sm text-zinc-300 leading-relaxed font-mono bg-black/30 p-4 rounded border border-zinc-700/50">
                        {isAnalyzing ? (
                            <span className="flex items-center gap-2 text-zinc-500">
                                <Loader2 className="animate-spin" size={14}/> Processing neural engine...
                            </span>
                        ) : aiAnalysis ? (
                            aiAnalysis
                        ) : (
                            <span className="text-zinc-600">Tap 'Analyze Scene' to get professional composition insights and EXIF data extraction via Gemini AI.</span>
                        )}
                    </div>
                </div>
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-3 gap-0.5">
                {photos.map(photo => (
                  <button 
                    key={photo.id} 
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square relative group overflow-hidden"
                  >
                    <img src={photo.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="thumb" />
                    {photo.isEnhanced && (
                        <div className="absolute top-1 right-1 bg-orange-600 text-[10px] font-bold px-1 rounded text-white">PRO</div>
                    )}
                  </button>
                ))}
                {photos.length === 0 && (
                    <div className="col-span-3 flex flex-col items-center justify-center py-20 text-zinc-600">
                        <p>No images captured</p>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
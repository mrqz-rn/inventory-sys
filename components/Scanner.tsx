
import React, { useRef, useEffect } from 'react';
import { X, Camera, Scan } from 'lucide-react';

interface ScannerProps {
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    setupCamera();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center p-6 absolute top-0 left-0 w-full z-10">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Live Scanner</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Scanning for barcodes...</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover grayscale contrast-125"
        />
        
        {/* Scanner Overlay UI */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-48 border-2 border-indigo-500 rounded-3xl flex items-center justify-center relative bg-indigo-500/10 backdrop-blur-[2px]">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
            
            <div className="w-full h-0.5 bg-indigo-400 animate-scan shadow-[0_0_15px_rgba(129,140,248,0.8)]" />
          </div>
        </div>
      </div>

      <div className="p-8 bg-slate-900 flex flex-col items-center gap-4">
        <p className="text-slate-400 text-xs font-medium text-center px-8">
          Position the barcode within the frame. The system will auto-detect and fetch item details.
        </p>
        
        <div className="flex gap-4 w-full max-w-sm">
          {/* Mock Buttons for Prototype Demo - Using real barcodes from constants.tsx */}
          <button 
            onClick={() => onScan('WHA-COM-it-1')}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-900 py-3 rounded-xl font-bold text-[10px] shadow-xl flex flex-col items-center justify-center gap-1"
          >
            <Scan className="w-4 h-4" /> <span>Steel Barcode</span>
          </button>
          <button 
            onClick={() => onScan('WHB-GHS-it-2')}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-900 py-3 rounded-xl font-bold text-[10px] shadow-xl flex flex-col items-center justify-center gap-1"
          >
            <Scan className="w-4 h-4" /> <span>Linen Barcode</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-80px); }
          50% { transform: translateY(80px); }
          100% { transform: translateY(-80px); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Scanner;

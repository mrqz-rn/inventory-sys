import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera, Scan, AlertCircle, CheckCircle } from 'lucide-react';

interface ScannerProps {
  onClose: () => void;
  onScan: (barcode: string) => void;
}

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

const Scanner: React.FC<ScannerProps> = ({ onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const hasScanned = useRef(false);
  const detectorRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
  }, []);

  const scanLoop = useCallback(async () => {
    if (hasScanned.current || !videoRef.current || !detectorRef.current) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      try {
        const barcodes = await detectorRef.current.detect(video);
        if (barcodes.length > 0 && !hasScanned.current) {
          hasScanned.current = true;
          const value = barcodes[0].rawValue;
          setDetected(value);
          stopCamera();
          setTimeout(() => onScan(value), 700);
          return;
        }
      } catch {
        // transient detection errors — keep looping
      }
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  }, [onScan, stopCamera]);

  useEffect(() => {
    async function init() {
      if (!('BarcodeDetector' in window)) {
        setIsSupported(false);
        setError(
          "Your browser doesn't support the Barcode Detection API. " +
          'Please use Chrome on Android or desktop Chrome/Edge.'
        );
        return;
      }

      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: [
            'qr_code', 'ean_13', 'ean_8', 'code_128',
            'code_39', 'upc_a', 'upc_e', 'data_matrix', 'itf', 'aztec',
          ],
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            animFrameRef.current = requestAnimationFrame(scanLoop);
          };
        }
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else if (err?.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Could not start camera. Please try again.');
        }
      }
    }

    init();
    return () => stopCamera();
  }, [scanLoop, stopCamera]);

  const handleManualScan = (barcode: string) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    setDetected(barcode);
    stopCamera();
    setTimeout(() => onScan(barcode), 700);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 absolute top-0 left-0 w-full z-10">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Live Scanner</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {detected ? 'Barcode detected!' : 'Scanning for barcodes...'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera / Error */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center text-white">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
            {!isSupported && (
              <p className="text-xs text-slate-500">Use the manual buttons below as a fallback.</p>
            )}
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="mt-2 px-6 py-2 bg-indigo-600 rounded-xl text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover grayscale contrast-125"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              <div className={`relative w-72 h-48 rounded-3xl transition-all duration-300 ${detected ? 'scale-105' : 'scale-100'}`}>
                {[
                  'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
                  'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
                  'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
                  'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-7 h-7 ${cls} ${detected ? 'border-green-400' : 'border-white'} transition-colors duration-300`} />
                ))}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl">
                  {detected ? (
                    <div className="flex flex-col items-center gap-2 px-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <span className="text-green-300 text-xs font-bold break-all">{detected}</span>
                    </div>
                  ) : (
                    <div className="w-full h-0.5 bg-indigo-400 animate-scan shadow-[0_0_15px_rgba(129,140,248,0.8)]" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-8 bg-slate-900 flex flex-col items-center gap-4">
        <p className="text-slate-400 text-xs font-medium text-center px-8">
          {detected
            ? 'Barcode captured! Loading item details...'
            : 'Position the barcode within the frame. The system will auto-detect and fetch item details.'}
        </p>
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => handleManualScan('WHA-COM-it-1')}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-900 py-3 rounded-xl font-bold text-[10px] shadow-xl flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <Scan className="w-4 h-4" /> <span>Steel Barcode</span>
          </button>
          <button
            onClick={() => handleManualScan('WHB-GHS-it-2')}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-900 py-3 rounded-xl font-bold text-[10px] shadow-xl flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <Scan className="w-4 h-4" /> <span>Linen Barcode</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%   { transform: translateY(-80px); opacity: 1; }
          50%  { transform: translateY(80px);  opacity: 0.7; }
          100% { transform: translateY(-80px); opacity: 1; }
        }
        .animate-scan { animation: scan 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Scanner;
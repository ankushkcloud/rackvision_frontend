'use client';
// ─── FILE: frontend/src/components/qr/DeviceQRCode.tsx ───────────────────────
// Install: npm install qrcode react (already have react)
// Run: npm install qrcode @types/qrcode  (in frontend/)
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  deviceId:   string;
  deviceName: string;
  rackId:     string;
  compact?:   boolean;
}

export default function DeviceQRCode({ deviceId, deviceName, rackId, compact = false }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  // The URL the QR will encode — device detail deep link
  const deviceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/rack/${rackId}?device=${deviceId}`
    : `https://yourapp.com/dashboard/rack/${rackId}?device=${deviceId}`;

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const QRCode = (await import('qrcode')).default;
        if (!canvasRef.current || cancelled) return;
        await QRCode.toCanvas(canvasRef.current, deviceUrl, {
          width:           compact ? 120 : 200,
          margin:          2,
          color:           { dark: '#e2e8f0', light: '#161b27' },
          errorCorrectionLevel: 'H',
        });
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) setError('QR generation failed. Run: npm install qrcode');
      }
    }
    render();
    return () => { cancelled = true; };
  }, [deviceUrl, compact]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href     = canvasRef.current.toDataURL('image/png');
    link.download = `qr-${deviceName.replace(/\s+/g, '-')}.png`;
    link.click();
    toast.success('QR Code downloaded!');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(deviceUrl);
    toast.success('Device URL copied!');
  };

  return (
    <div className="card p-4 flex flex-col items-center gap-3">
      {!compact && (
        <div className="flex items-center gap-2 w-full">
          <span className="text-base">📱</span>
          <p className="text-sm font-bold text-white flex-1">QR Code</p>
        </div>
      )}

      {error ? (
        <div className="text-center py-4">
          <p className="text-xs text-red-400">{error}</p>
          <p className="text-[10px] text-gray-600 mt-1 font-mono">npm install qrcode</p>
        </div>
      ) : (
        <>
          {/* Canvas — QR renders here */}
          <div className="rounded-xl overflow-hidden border border-gray-700 bg-[#161b27] p-2">
            <canvas ref={canvasRef} />
          </div>

          {ready && (
            <>
              {!compact && (
                <div className="w-full text-center">
                  <p className="text-[10px] text-gray-500 mb-1">Scan to open device details</p>
                  <p className="text-[9px] font-mono text-gray-700 break-all px-2">{deviceUrl}</p>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <button onClick={downloadQR}
                  className="flex-1 text-[10px] font-semibold py-2 rounded-lg bg-blue-900/30 border border-blue-800/40 text-blue-400 hover:bg-blue-900/50 transition-all">
                  ⬇ Download
                </button>
                <button onClick={copyUrl}
                  className="flex-1 text-[10px] font-semibold py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 transition-all">
                  🔗 Copy URL
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

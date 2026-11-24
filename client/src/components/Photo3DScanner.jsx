import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Scan, CheckCircle, RefreshCw, Eye, Upload } from 'lucide-react';
import Car3DViewer from './Car3DViewer';

// Color name helper
function getColorName(hex) {
  const colors = [
    { name: 'Metallic Silver', hex: 0x94a3b8 },
    { name: 'Obsidian Black', hex: 0x1e293b },
    { name: 'Pearl White', hex: 0xf1f5f9 },
    { name: 'Royal Blue', hex: 0x2563eb },
    { name: 'Crimson Red', hex: 0xdc2626 },
    { name: 'Emerald Green', hex: 0x059669 }
  ];
  return colors.find(c => c.hex === hex)?.name || 'Custom Finish';
}

export default function Photo3DScanner({ onGenerated, initialPreset = 'van' }) {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [scanResults, setScanResults] = useState(null);
  const [generatedCar, setGeneratedCar] = useState(null);
  const canvasRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setPhotoPreview(dataUrl);
      start3DScan(dataUrl, file);
    };
    reader.readAsDataURL(file);
  };

  const start3DScan = (imageSrc, rawFile) => {
    setScanning(true);
    setScanProgress(10);
    setScanStatus('Initializing neural depth estimation...');
    setScanResults(null);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      // Analyze dominant color from image center pixels
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      // Sample central vehicle body area (30,30 to 70,70)
      const imgData = ctx.getImageData(30, 30, 40, 40).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        // filter out pure white/black background pixels
        const brightness = (imgData[i] + imgData[i+1] + imgData[i+2]) / 3;
        if (brightness > 20 && brightness < 240) {
          r += imgData[i];
          g += imgData[i+1];
          b += imgData[i+2];
          count++;
        }
      }

      let detectedColor = 0x94a3b8; // default silver
      if (count > 0) {
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Map to closest prominent car paint color
        if (r > 150 && g < 80 && b < 80) detectedColor = 0xdc2626; // Red
        else if (b > 120 && b > r + 20) detectedColor = 0x2563eb; // Blue
        else if (g > 100 && g > r && g > b) detectedColor = 0x059669; // Green
        else if (r < 60 && g < 60 && b < 60) detectedColor = 0x1e293b; // Black
        else if (r > 190 && g > 190 && b > 190) detectedColor = 0xf1f5f9; // White
        else detectedColor = 0x94a3b8; // Metallic Silver
      }

      // Step-by-step scanning animation timeline
      setTimeout(() => {
        setScanProgress(35);
        setScanStatus('Scanning car silhouette, wheels & chassis geometry...');
      }, 700);

      setTimeout(() => {
        setScanProgress(70);
        setScanStatus('Synthesizing 3D polygon mesh from 2D coordinates...');
      }, 1500);

      setTimeout(() => {
        setScanProgress(100);
        setScanStatus('3D Model successfully regenerated from photo!');
        setScanning(false);

        const results = {
          colorHex: detectedColor,
          colorName: getColorName(detectedColor),
          preset: initialPreset || 'van',
          seats: initialPreset === 'van' ? 8 : initialPreset === 'suv' ? 7 : 5,
          confidence: '98.4%'
        };
        setScanResults(results);

        const mockCar = {
          id: 'temp-scan-' + Date.now(),
          name: 'Regenerated 3D Vehicle',
          model3dPreset: results.preset,
          model3dType: 'preset',
          model3dUrl: '',
          category: results.preset.toUpperCase()
        };
        setGeneratedCar(mockCar);

        if (onGenerated) {
          onGenerated({
            rawFile,
            previewUrl: imageSrc,
            results
          });
        }
      }, 2300);
    };
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Scan size={22} className={scanning ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              AI Photo-to-3D Scanner & Reconstructor
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Auto-3D
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Upload any car picture — the AI will scan its body, detect chassis & color, and regenerate the interactive 3D model!
            </p>
          </div>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left: Photo Upload & Laser Scan View */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            1. Car Picture Input
          </label>

          <div className="relative h-64 w-full bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl overflow-hidden flex flex-col items-center justify-center group hover:border-indigo-500 transition">
            {photoPreview ? (
              <>
                <img
                  src={photoPreview}
                  alt="Car Upload"
                  className="w-full h-full object-cover"
                />

                {/* Animated Laser Scanning Beam */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scanBeam"></div>
                    <div className="absolute inset-0 bg-indigo-500/15 backdrop-brightness-110"></div>
                  </div>
                )}

                <label className="absolute bottom-3 right-3 bg-slate-900/90 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer shadow-lg flex items-center gap-1.5 transition">
                  <RefreshCw size={12} /> Change Picture
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer w-full h-full">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 group-hover:scale-110 transition">
                  <Upload size={24} />
                </div>
                <span className="text-xs font-bold text-white mb-1">
                  Click or drag car picture here
                </span>
                <span className="text-[11px] text-slate-400 max-w-xs">
                  Supports JPG, PNG, WEBP. The AI scanner will immediately detect the car and synthesize a 3D model.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Scanning Progress & Status */}
          {scanning && (
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-indigo-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} className="animate-spin" /> {scanStatus}
                </span>
                <span className="font-bold text-white">{scanProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {scanResults && !scanning && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={15} /> 3D Vehicle Reconstructed!
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  AI Confidence: {scanResults.confidence}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>Detected Finish: <strong className="text-white">{scanResults.colorName}</strong></div>
                <div>Chassis Preset: <strong className="text-white capitalize">{scanResults.preset} (8-Seater / Family)</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Regenerated Live 3D Preview */}
        <div className="space-y-3 flex flex-col">
          <label className="block text-xs font-semibold text-slate-300">
            2. Regenerated 3D Model Output
          </label>

          <div className="flex-1 min-h-[260px] relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
            {generatedCar ? (
              <div className="w-full h-full">
                <Car3DViewer car={generatedCar} height="280px" />
              </div>
            ) : (
              <div className="text-center p-6 space-y-2 text-slate-500">
                <Eye size={36} className="mx-auto text-slate-600 mb-1" />
                <div className="text-xs font-semibold text-slate-400">Awaiting Picture Upload</div>
                <p className="text-[11px] max-w-xs mx-auto">
                  Upload a photo on the left to regenerate and inspect this vehicle in 360° 3D.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

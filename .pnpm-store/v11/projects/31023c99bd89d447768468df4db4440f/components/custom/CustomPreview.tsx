"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Shirt,
  HelpCircle,
  ZoomIn,
  RefreshCw,
  Upload,
  Trash2,
  Sliders,
  Palette,
  Sparkles,
  User,
  AlertCircle,
  RotateCcw,
  Sparkle,
  X
} from 'lucide-react';

// Dynamically import FittingCanvas with SSR disabled to prevent Next.js server-side issues
const FittingCanvas = dynamic(() => import("./FittingCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 w-full items-center justify-center rounded-2xl bg-zinc-950 border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Initializing 3D fitting canvas...</span>
      </div>
    </div>
  )
});

// Dynamically import CanvasEditor with SSR disabled to prevent Node compilation errors
const CanvasEditor = dynamic(() => import("./canvacore/CanvasEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Loading Design Canvas Studio...</span>
      </div>
    </div>
  )
});

interface CustomPreviewProps {
  previewUrl: string | null;
  style: string;
  size: string;
  prompt: string;
  onApplyArtwork?: (url: string, backUrl?: string) => void;
  pendingAiImageUrl?: string | null; // AI image to add to canvas
}

const PRESET_COLORS = [
  { name: 'Trắng', value: '#FFFFFF' },
  { name: 'Navy', value: '#111C44' },
  { name: 'Đỏ tươi', value: '#C1121F' },
  { name: 'Cát', value: '#D9CFB8' },
  { name: 'Hồng', value: '#F6C7D4' },
  { name: 'Kem', value: '#F2EBDD' },
  { name: 'Đen', value: '#111111' },
];

export default function CustomPreview({
  previewUrl,
  style,
  size: defaultSizeProp,
  prompt,
  onApplyArtwork,
  pendingAiImageUrl,
}: CustomPreviewProps) {
  // --- View States ---
  const [activeView, setActiveView] = useState<"2d" | "3d">("3d");
  const [activeTab, setActiveTab] = useState<"model" | "design" | "sizing">("sizing");

  // --- 3D Customization States ---
  const [gender, setGender] = useState<string>("mannequin");
  const [shirtColor, setShirtColor] = useState<string>("#FFFFFF");
  const [logoTextureUrl, setLogoTextureUrl] = useState<string | null>(previewUrl);
  const [backLogoTextureUrl, setBackLogoTextureUrl] = useState<string | null>(null);
  const [weight, setWeight] = useState<number>(1.0); // 0.8 to 1.5
  const [size, setSize] = useState<number>(1.0);     // 0.8 to 1.4

  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [customShirtUrl, setCustomShirtUrl] = useState<string | null>(null);

  // Sizing states based on actual height (cm) and weight (kg)
  const [height, setHeightVal] = useState<number>(170);
  const [weightKg, setWeightKgVal] = useState<number>(65);

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [shirtError, setShirtError] = useState<string | null>(null);

  // File Input Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backLogoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const shirtInputRef = useRef<HTMLInputElement>(null);

  // --- Effects to sync with parent form props ---
  useEffect(() => {
    if (previewUrl) {
      setLogoTextureUrl(previewUrl);
    }
  }, [previewUrl]);

  // Auto-switch to 2D canvas when a new AI image arrives
  useEffect(() => {
    if (pendingAiImageUrl) {
      setActiveView('2d');
    }
  }, [pendingAiImageUrl]);

  // Sync size prop when it changes from the parent form
  useEffect(() => {
    if (defaultSizeProp) {
      const defaultH = gender === 'female' ? 158 : 170;
      if (defaultSizeProp === 'small') {
        handleHeightChange(defaultH - 10);
      } else if (defaultSizeProp === 'large') {
        handleHeightChange(defaultH + 10);
      } else {
        handleHeightChange(defaultH);
      }
    }
  }, [defaultSizeProp]);

  // Sync height/weight defaults when gender changes
  useEffect(() => {
    const defaultH = gender === 'female' ? 158 : 170;
    const defaultW = gender === 'female' ? 50 : 65;
    setHeightVal(defaultH);
    setWeightKgVal(defaultW);
    setSize(1.0);
    setWeight(1.0);
  }, [gender]);

  // --- Sizing advice formulas ---
  const handleHeightChange = (val: number) => {
    setHeightVal(val);
    const defaultH = gender === 'female' ? 158 : 170;
    const newSize = 1.0 + (val - defaultH) * 0.006;
    setSize(newSize);
  };

  const handleWeightChange = (val: number) => {
    setWeightKgVal(val);
    const defaultW = gender === 'female' ? 50 : 65;
    const factor = gender === 'female' ? 0.012 : 0.01;
    const newWeight = 1.0 + (val - defaultW) * factor;
    setWeight(newWeight);
  };

  const getRecommendedSize = (g: string, h: number, w: number) => {
    if (g === 'female') {
      let sizeHeight = 'XS';
      if (h <= 153) sizeHeight = 'XS';
      else if (h <= 155) sizeHeight = 'S';
      else if (h <= 160) sizeHeight = 'M';
      else sizeHeight = 'L';

      let sizeWeight = 'XS';
      if (w <= 43) sizeWeight = 'XS';
      else if (w <= 46) sizeWeight = 'S';
      else if (w <= 53) sizeWeight = 'M';
      else sizeWeight = 'L';

      const sizes = ['XS', 'S', 'M', 'L'];
      const idxH = sizes.indexOf(sizeHeight);
      const idxW = sizes.indexOf(sizeWeight);
      const recommended = sizes[Math.max(idxH, idxW)];

      if (h > 165 || w > 58) {
        return `${recommended} (Oversize XL)`;
      }
      return recommended;
    } else {
      let sizeHeight = 'S';
      if (h <= 167) sizeHeight = 'S';
      else if (h <= 170) sizeHeight = 'M';
      else if (h <= 172) sizeHeight = 'L';
      else sizeHeight = 'XL';

      let sizeWeight = 'S';
      if (w <= 60) sizeWeight = 'S';
      else if (w <= 65) sizeWeight = 'M';
      else if (w <= 75) sizeWeight = 'L';
      else sizeWeight = 'XL';

      const sizes = ['S', 'M', 'L', 'XL'];
      const idxH = sizes.indexOf(sizeHeight);
      const idxW = sizes.indexOf(sizeWeight);
      const recommended = sizes[Math.max(idxH, idxW)];

      if (h > 180 || w > 90) {
        return `${recommended} (Oversize XXL)`;
      }
      return recommended;
    }
  };

  // --- Action Handlers ---
  const handleClearAvatar = () => {
    setCustomAvatarUrl(null);
    setAvatarError(null);
  };

  const handleClearShirt = () => {
    setCustomShirtUrl(null);
    setShirtError(null);
  };

  const handleClearTexture = () => {
    if (logoTextureUrl) {
      if (logoTextureUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoTextureUrl);
      }
      setLogoTextureUrl(null);
      if (onApplyArtwork) {
        onApplyArtwork('', backLogoTextureUrl || '');
      }
    }
  };

  const handleClearBackTexture = () => {
    if (backLogoTextureUrl) {
      if (backLogoTextureUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backLogoTextureUrl);
      }
      setBackLogoTextureUrl(null);
      if (onApplyArtwork) {
        onApplyArtwork(logoTextureUrl || '', '');
      }
    }
  };

  const handleResetToDefault = () => {
    setWeight(1.0);
    setSize(1.0);
    setShirtColor('#FFFFFF');
    setGender('mannequin');
    setHeightVal(170);
    setWeightKgVal(65);
    handleClearTexture();
    handleClearBackTexture();
    handleClearAvatar();
    handleClearShirt();
  };

  // File Upload Handling
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoTextureUrl(url);
      if (onApplyArtwork) {
        onApplyArtwork(url, backLogoTextureUrl || '');
      }
    }
  };

  const handleBackLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackLogoTextureUrl(url);
      if (onApplyArtwork) {
        onApplyArtwork(logoTextureUrl || '', url);
      }
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* 2D / 3D Toggle tabs */}
      <div className="flex w-full bg-gray-100 p-1.5 rounded-xl gap-2 mb-4">
        <button
          onClick={() => setActiveView("2d")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${activeView === "2d"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <Palette className="w-3.5 h-3.5" />
          2D Mockup Design
        </button>
        <button
          onClick={() => setActiveView("3d")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${activeView === "3d"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
            }`}
        >
          <Shirt className="w-3.5 h-3.5 animate-pulse" />
          3D Virtual Fit Room
        </button>
      </div>

      {/* Viewport Box - PERSIST STATE BY TOGGLING DISPLAY INSTEAD OF CONDITIONAL MOUNT */}
      <div
        className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ display: activeView === "2d" ? "block" : "none" }}
      >
        <CanvasEditor
          isInline={true}
          pendingImageUrl={pendingAiImageUrl}
          onApply={(frontUrl, backUrl) => {
            if (onApplyArtwork) {
              onApplyArtwork(frontUrl, backUrl);
            }
            setLogoTextureUrl(frontUrl || null);
            setBackLogoTextureUrl(backUrl || null);
            setActiveView("3d"); // Automatically switch to 3D room to see the applied design in 3D!
          }}
        />
      </div>

      <div
        className="relative overflow-hidden w-full h-[450px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center select-none shadow-inner"
        style={{ display: activeView === "3d" ? "block" : "none" }}
      >
        <FittingCanvas
          weight={weight}
          size={size}
          shirtColor={shirtColor}
          logoTextureUrl={logoTextureUrl}
          backLogoTextureUrl={backLogoTextureUrl}
          customAvatarUrl={customAvatarUrl}
          customShirtUrl={customShirtUrl}
          onAvatarLoadError={setAvatarError}
          onShirtLoadError={setShirtError}
          gender={gender}
        />

        {/* Quick HUD controls overlay */}
        <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1">
          <span className="bg-black/75 backdrop-blur-md text-[9px] text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">
            3D Engine Active
          </span>
        </div>

        <div className="absolute bottom-3 right-3 pointer-events-none flex flex-col gap-1 font-mono text-[9px] text-right text-gray-400 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/5">
          <div>Scroll to zoom</div>
          <div>Drag to rotate</div>
        </div>
      </div>

      {/* Accordion customization parameters (Visible only or customized for 3D/2D fitting) */}
      {activeView === "3d" && (
        <div className="mt-6 border-t border-gray-100 pt-5 space-y-5">
          {/* Sub Tab Controls Navigation */}
          <div className="flex border-b border-gray-100 pb-0 bg-gray-50 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('sizing')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${activeTab === 'sizing'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-950'
                }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Fit & Sizing
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${activeTab === 'design'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-950'
                }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Fabric & Logo
            </button>
          </div>

          {/* TAB 1: Sizing */}
          {activeTab === 'sizing' && (
            <div className="space-y-4">


              {/* Height range slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Chiều cao</span>
                  <span className="font-bold text-gray-900 font-mono">{height} cm</span>
                </div>
                <input
                  type="range"
                  min={gender === 'female' ? 140 : 150}
                  max={gender === 'female' ? 180 : 195}
                  step="1"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>{gender === 'female' ? '140 cm' : '150 cm'}</span>
                  <span>{gender === 'female' ? '180 cm' : '195 cm'}</span>
                </div>
              </div>

              {/* Weight range slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Cân nặng</span>
                  <span className="font-bold text-gray-900 font-mono">{weightKg} kg</span>
                </div>
                <input
                  type="range"
                  min={gender === 'female' ? 35 : 45}
                  max={gender === 'female' ? 80 : 100}
                  step="1"
                  value={weightKg}
                  onChange={(e) => handleWeightChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>{gender === 'female' ? '35 kg' : '45 kg'}</span>
                  <span>{gender === 'female' ? '80 kg' : '100 kg'}</span>
                </div>
              </div>

              {/* Canifa Size Advisor */}
              <div className="bg-gradient-to-r from-indigo-50/50 to-cyan-50/50 border border-indigo-200/50 rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkle className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Gợi ý Size Áo (Canifa)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] text-gray-500">Kích cỡ đề xuất:</span>
                  <span className="text-sm font-extrabold text-indigo-900 bg-indigo-100/60 px-3 py-0.5 rounded-md border border-indigo-200/40">
                    {getRecommendedSize(gender, height, weightKg)}
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 leading-normal">
                  * Khuyến nghị chuẩn dựa trên số đo cơ thể. Nhích lên 1 size nếu muốn mặc thoải mái/oversize.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: Fabric & Logo */}
          {activeTab === 'design' && (
            <div className="space-y-4">

              {/* Preset Colors */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Fabric Colorways</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.value}
                      onClick={() => setShirtColor(col.value)}
                      className={`h-9 rounded-lg relative border transition-all ${shirtColor.toLowerCase() === col.value.toLowerCase()
                        ? "border-black ring-2 ring-black/10 scale-102"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                      style={{ backgroundColor: col.value }}
                      title={col.name}
                    >
                      {shirtColor.toLowerCase() === col.value.toLowerCase() && (
                        <span className={`absolute inset-0 m-auto w-2 h-2 rounded-full ${['#FFFFFF', '#F2EBDD', '#D9CFB8', '#F6C7D4'].includes(col.value.toUpperCase()) ? 'bg-black' : 'bg-white'
                          }`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphic upload decal mapping - Front */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Mặt trước - Decal Graphic (Front)</label>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />

                {logoTextureUrl ? (
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-xl p-2.5">
                    <img
                      src={logoTextureUrl}
                      alt="Front Decal"
                      className="w-12 h-12 object-contain rounded bg-white border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">Logo Mặt Trước Active</p>
                      <p className="text-[9px] text-gray-400">Mapped as front physical chest decal</p>
                    </div>
                    <button
                      onClick={handleClearTexture}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"
                      title="Clear front decal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-4 border border-dashed border-gray-300 hover:border-gray-450 bg-gray-50/50 hover:bg-gray-50 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-gray-500"
                  >
                    <Upload className="w-4 h-4 mb-1 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">Upload Chest Graphic (Mặt trước)</span>
                  </button>
                )}
              </div>

              {/* Graphic upload decal mapping - Back */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Mặt sau - Decal Graphic (Back)</label>
                <input
                  type="file"
                  ref={backLogoInputRef}
                  onChange={handleBackLogoChange}
                  accept="image/*"
                  className="hidden"
                />

                {backLogoTextureUrl ? (
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-xl p-2.5">
                    <img
                      src={backLogoTextureUrl}
                      alt="Back Decal"
                      className="w-12 h-12 object-contain rounded bg-white border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">Logo Mặt Sau Active</p>
                      <p className="text-[9px] text-gray-400">Mapped as back physical decal</p>
                    </div>
                    <button
                      onClick={handleClearBackTexture}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"
                      title="Clear back decal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => backLogoInputRef.current?.click()}
                    className="w-full py-4 border border-dashed border-gray-300 hover:border-gray-450 bg-gray-50/50 hover:bg-gray-50 rounded-xl flex flex-col items-center justify-center transition cursor-pointer text-gray-500"
                  >
                    <Upload className="w-4 h-4 mb-1 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">Upload Back Graphic (Mặt sau)</span>
                  </button>
                )}
              </div>

            </div>
          )}


          {/* Reset Global */}
          <button
            onClick={handleResetToDefault}
            className="w-full py-2.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset 3D Fit Configuration
          </button>
        </div>
      )}


      {/* Design details static panel always visible at the bottom */}
      <div className="mt-5 w-full border-t border-gray-150 pt-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          AI Design Specifications
        </h3>
        <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-2">
          <p>
            <strong>Style:</strong> {style}
          </p>
          <p>
            <strong>Size Input:</strong> {defaultSizeProp}
          </p>
          <p className="flex items-center gap-1.5 col-span-2">
            <strong>Fabric Color:</strong>{" "}
            <span
              className="w-3.5 h-3.5 inline-block rounded-md border border-gray-300"
              style={{ background: shirtColor }}
            />
            <span className="font-mono">{shirtColor}</span>
          </p>
          <p className="col-span-2 mt-1 leading-normal">
            <strong>Prompt:</strong> {prompt || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

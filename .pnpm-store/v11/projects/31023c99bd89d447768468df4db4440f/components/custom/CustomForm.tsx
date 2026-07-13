"use client";

import { useState } from "react";
import { Loader2, Wand2, Sparkles, RefreshCw, ImageOff, CheckCircle2 } from "lucide-react";

interface CustomFormProps {
  prompt: string;
  style: string;
  size: string;
  onPromptChange: (val: string) => void;
  onStyleChange: (val: string) => void;
  onSizeChange: (val: string) => void;
  onCreateDesign: () => void;
  onReset: () => void;
  // AI gallery callbacks
  onSelectImage?: (url: string) => void;
}

interface AiPreset {
  key: string;
  label: string;
  emoji: string;
  prompt: string;
}

const AI_PRESETS: AiPreset[] = [
  {
    key: "mascot",
    label: "Sticker Mascot",
    emoji: "🦸",
    prompt:
      "Cute chibi mascot sticker, clean vector style, bold outline, vibrant colors, transparent background, centered composition, commercial t-shirt print design, high quality, isolated PNG",
  },
  {
    key: "anime",
    label: "Anime Sticker",
    emoji: "🌸",
    prompt:
      "Cute anime character sticker, kawaii style, thick white border, vibrant colors, transparent background, die-cut sticker design, vector illustration, isolated PNG",
  },
  {
    key: "gaming",
    label: "Gaming Sticker",
    emoji: "🎮",
    prompt:
      "Gaming logo sticker, esports style, aggressive mascot, bold lines, vibrant colors, transparent background, vector artwork, high quality, isolated PNG",
  },
  {
    key: "animal",
    label: "Animal Sticker",
    emoji: "🐾",
    prompt:
      "Cute cartoon corgi sticker, vector illustration, thick outline, transparent background, die-cut sticker, colorful, t-shirt graphic design, isolated PNG",
  },
  {
    key: "food",
    label: "Food Sticker",
    emoji: "🧋",
    prompt:
      "Cute bubble tea sticker, kawaii style, smiling face, pastel colors, thick white border, transparent background, vector illustration, isolated PNG",
  },
  {
    key: "minimal",
    label: "Minimal Icon",
    emoji: "⬡",
    prompt:
      "Minimal modern icon, clean vector style, monochrome, transparent background, scalable SVG style, centered composition, isolated PNG",
  },
  {
    key: "streetwear",
    label: "Streetwear",
    emoji: "🔥",
    prompt:
      "Japanese streetwear sticker graphic, bold typography, urban aesthetic, black and white, vector artwork, transparent background, premium t-shirt print design",
  },
  {
    key: "dragon",
    label: "Rồng / Dragon",
    emoji: "🐉",
    prompt:
      "Cute dragon mascot sticker, cartoon vector style, bold outline, transparent background, high detail, t-shirt graphic design, isolated PNG",
  },
  {
    key: "cat",
    label: "Mèo / Cat",
    emoji: "🐱",
    prompt:
      "Cute cat mascot sticker, kawaii style, thick white border, transparent background, vector illustration, isolated PNG",
  },
  {
    key: "pokemon",
    label: "Pokemon-like",
    emoji: "✨",
    prompt:
      "Cute fantasy monster sticker, colorful creature, cartoon vector style, transparent background, die-cut sticker design, isolated PNG",
  },
  {
    key: "skull",
    label: "Skull",
    emoji: "💀",
    prompt:
      "Streetwear skull sticker, bold vector artwork, transparent background, high contrast, premium t-shirt graphic design",
  },
  {
    key: "custom",
    label: "Tự viết",
    emoji: "✏️",
    prompt: "",
  },
];

export default function CustomForm({
  prompt,
  onPromptChange,
  onReset,
  onSelectImage,
}: CustomFormProps) {
  const [activePreset, setActivePreset] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [aiImages, setAiImages] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [addedIndex, setAddedIndex] = useState<number | null>(null);

  const handleSelectPreset = (preset: AiPreset) => {
    setActivePreset(preset.key);
    if (preset.prompt) onPromptChange(preset.prompt);
    setAiError(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setAiError("Vui lòng nhập prompt hoặc chọn một preset.");
      return;
    }
    setGenerating(true);
    setAiError(null);
    setAiImages([]);
    setAddedIndex(null);
    try {
      const res = await fetch("/api/generate/ai-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Tạo ảnh thất bại. Kiểm tra OPENAI_API_KEY.");
        return;
      }
      setAiImages(data.images || []);
    } catch (e: any) {
      setAiError(e.message || "Lỗi kết nối mạng.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePickImage = (url: string, index: number) => {
    setAddedIndex(index);
    onSelectImage?.(url);
    setTimeout(() => setAddedIndex(null), 2000);
  };

  const handleReset = () => {
    setActivePreset("");
    setAiImages([]);
    setAiError(null);
    setAddedIndex(null);
    onReset();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-600">AI Design Generator</span>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed">
          Chọn preset hoặc nhập prompt. Nhấn <strong>Generate</strong> để tạo 4 ảnh sticker.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Preset chips */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
            Preset nhanh
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AI_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-left transition-all duration-150 ${
                  activePreset === preset.key
                    ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-300 hover:bg-violet-50/60"
                }`}
              >
                <span className="text-base leading-none">{preset.emoji}</span>
                <span className="text-[11px] font-medium leading-tight truncate">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt textarea */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => {
              onPromptChange(e.target.value);
              setActivePreset("custom");
            }}
            placeholder="Ví dụ: Cute anime character sticker, kawaii style, vibrant colors..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 min-h-[100px] text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:bg-white transition resize-none"
          />
          <p className="text-[10.5px] text-gray-400 mt-1 italic">
            <Sparkles className="inline w-3 h-3 mr-1 text-violet-400" />
            Tự động thêm: transparent background, die-cut sticker, isolated PNG
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              generating
                ? "bg-violet-400 text-white cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-violet-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo ảnh AI…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Design
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Error */}
        {aiError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            <ImageOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        {/* Skeleton loading */}
        {generating && (
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
              Đang tạo ảnh AI — Vui lòng chờ 30–60 giây ☕
            </p>
            <div className="aspect-square w-full max-w-xs mx-auto rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse border border-gray-200" />
          </div>
        )}

        {/* Generated gallery */}
        {!generating && aiImages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                Nhấn ảnh → thêm vào Canvas để chỉnh sửa
              </label>
            </div>
            {/* Single image full-width */}
            <button
              type="button"
              onClick={() => handlePickImage(aiImages[0], 0)}
              className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                addedIndex === 0
                  ? "border-emerald-400 shadow-emerald-200 shadow-md"
                  : "border-gray-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-100"
              }`}
              title="Nhấn để thêm vào Canvas"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aiImages[0]}
                alt="AI design"
                className="w-full h-full object-contain bg-[#f8f8fb] transition-transform duration-200 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className={`absolute inset-0 flex flex-col items-center justify-end p-3 transition-opacity duration-200 ${
                addedIndex === 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                <div className={`w-full rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-bold ${
                  addedIndex === 0
                    ? "bg-emerald-500 text-white"
                    : "bg-black/70 text-white backdrop-blur-sm"
                }`}>
                  {addedIndex === 0 ? (
                    <><CheckCircle2 className="w-4 h-4" /> Đã thêm vào Canvas!</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Thêm vào Canvas — Resize &amp; Edit</>
                  )}
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

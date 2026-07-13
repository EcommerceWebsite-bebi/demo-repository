import { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { 
  Pencil, 
  MousePointer, 
  Square, 
  Circle as CircleIcon, 
  Triangle as TriangleIcon, 
  Minus, 
  Plus, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  UploadCloud,
  ClipboardPaste,
  Wand2,
  Sparkles,
  Loader2,
  ImageOff,
  CheckCircle2
} from 'lucide-react';

// ---- AI Preset Sticker Prompts ----
interface AiPreset {
  key: string;
  label: string;
  emoji: string;
  prompt: string;
}

const AI_PRESETS: AiPreset[] = [
  {
    key: 'mascot',
    label: 'Sticker Mascot',
    emoji: '🦸',
    prompt: 'Cute chibi mascot sticker, clean vector style, bold outline, vibrant colors, transparent background, centered composition, commercial t-shirt print design, high quality, isolated PNG'
  },
  {
    key: 'anime',
    label: 'Anime Sticker',
    emoji: '🌸',
    prompt: 'Cute anime character sticker, kawaii style, thick white border, vibrant colors, transparent background, die-cut sticker design, vector illustration, isolated PNG'
  },
  {
    key: 'gaming',
    label: 'Gaming Sticker',
    emoji: '🎮',
    prompt: 'Gaming logo sticker, esports style, aggressive mascot, bold lines, vibrant colors, transparent background, vector artwork, high quality, isolated PNG'
  },
  {
    key: 'animal',
    label: 'Animal Sticker',
    emoji: '🐾',
    prompt: 'Cute cartoon corgi sticker, vector illustration, thick outline, transparent background, die-cut sticker, colorful, t-shirt graphic design, isolated PNG'
  },
  {
    key: 'food',
    label: 'Food Sticker',
    emoji: '🧋',
    prompt: 'Cute bubble tea sticker, kawaii style, smiling face, pastel colors, thick white border, transparent background, vector illustration, isolated PNG'
  },
  {
    key: 'minimal',
    label: 'Minimal Icon',
    emoji: '⬡',
    prompt: 'Minimal modern icon, clean vector style, monochrome, transparent background, scalable SVG style, centered composition, isolated PNG'
  },
  {
    key: 'streetwear',
    label: 'Streetwear',
    emoji: '🔥',
    prompt: 'Japanese streetwear sticker graphic, bold typography, urban aesthetic, black and white, vector artwork, transparent background, premium t-shirt print design'
  },
  {
    key: 'dragon',
    label: 'Rồng / Dragon',
    emoji: '🐉',
    prompt: 'Cute dragon mascot sticker, cartoon vector style, bold outline, transparent background, high detail, t-shirt graphic design, isolated PNG'
  },
  {
    key: 'cat',
    label: 'Mèo / Cat',
    emoji: '🐱',
    prompt: 'Cute cat mascot sticker, kawaii style, thick white border, transparent background, vector illustration, isolated PNG'
  },
  {
    key: 'pokemon',
    label: 'Pokemon-like',
    emoji: '✨',
    prompt: 'Cute fantasy monster sticker, colorful creature, cartoon vector style, transparent background, die-cut sticker design, isolated PNG'
  },
  {
    key: 'skull',
    label: 'Skull',
    emoji: '💀',
    prompt: 'Streetwear skull sticker, bold vector artwork, transparent background, high contrast, premium t-shirt graphic design'
  },
  {
    key: 'custom',
    label: 'Custom',
    emoji: '✏️',
    prompt: ''
  },
];

interface ToolbarPanelProps {
  activeTab: string;
  canvas: fabric.Canvas | null;
  bgImageObject: fabric.Image | null;
  activeObject: fabric.Object | null;
  onStateChange: () => void;
  children?: React.ReactNode; // For embedding LayerManager under layers tab
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff3333', '#33a852', 
  '#4285f4', '#fbbc05', '#ea4335', '#a142f4'
];

export default function ToolbarPanel({
  activeTab,
  canvas,
  bgImageObject,
  activeObject,
  onStateChange,
  children
}: ToolbarPanelProps) {
  // Brush States
  const [isDrawing, setIsDrawing] = useState(true);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(8);

  // Shape States
  const [shapeFill, setShapeFill] = useState('#4285f4');
  const [shapeHasFill, setShapeHasFill] = useState(true);
  const [shapeStroke, setShapeStroke] = useState('#000000');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(3);

  // Text States
  const [textFont, setTextFont] = useState('Inter');
  const [textSize, setTextSize] = useState(32);
  const [textColor, setTextColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState('center');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- AI Generator State ----
  const [aiPresetKey, setAiPresetKey] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImages, setAiImages] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAddedIndex, setAiAddedIndex] = useState<number | null>(null);

  // Select a preset and fill the prompt
  const handleSelectPreset = (preset: AiPreset) => {
    setAiPresetKey(preset.key);
    setAiPrompt(preset.prompt);
    setAiError(null);
  };

  // Call the AI generation API
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt or select a preset.');
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    setAiImages([]);
    setAiAddedIndex(null);
    try {
      const res = await fetch('/api/generate/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'Generation failed.');
        return;
      }
      setAiImages(data.images || []);
      if (data.errors?.length) {
        console.warn('Some images failed:', data.errors);
      }
    } catch (e: any) {
      setAiError(e.message || 'Network error.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Add a generated image to the Fabric.js canvas
  const handleAddAiImageToCanvas = (url: string, index: number) => {
    if (!canvas) return;
    fabric.Image.fromURL(
      url,
      (img) => {
        // Scale down if too large
        const maxDim = Math.min(canvas.width! * 0.6, canvas.height! * 0.6);
        const imgMax = Math.max(img.width || 1, img.height || 1);
        if (imgMax > maxDim) {
          img.scale(maxDim / imgMax);
        }
        img.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          cornerColor: 'var(--accent-color)',
          cornerStyle: 'circle',
          transparentCorners: false,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        onStateChange();
        setAiAddedIndex(index);
        setTimeout(() => setAiAddedIndex(null), 1500);
      },
      { crossOrigin: 'anonymous' }
    );
  };

  // Sync tools mode in fabric
  useEffect(() => {
    if (!canvas) return;
    
    // Automatically toggle drawing mode based on activeTab
    if (activeTab === 'draw') {
      canvas.isDrawingMode = isDrawing;
      updateBrushSettings();
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTab, isDrawing, canvas]);

  // Update brush settings
  useEffect(() => {
    updateBrushSettings();
  }, [brushColor, brushWidth, canvas]);

  const updateBrushSettings = () => {
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;
  };

  // Sync local inputs with active canvas selection
  useEffect(() => {
    if (!activeObject || activeObject === bgImageObject) return;

    // Sync Text values
    if (activeObject.type?.includes('text')) {
      const textObj = activeObject as fabric.IText;
      setTextFont(textObj.fontFamily || 'Inter');
      setTextSize(textObj.fontSize || 32);
      setTextColor(textObj.fill as string || '#000000');
      setIsBold(textObj.fontWeight === 'bold');
      setIsItalic(textObj.fontStyle === 'italic');
      setIsUnderline(textObj.underline || false);
      setTextAlign(textObj.textAlign || 'left');
    }

    // Sync Shape values
    if (['rect', 'circle', 'triangle', 'line'].includes(activeObject.type || '')) {
      const fillVal = activeObject.fill as string;
      if (fillVal && fillVal !== 'transparent') {
        setShapeFill(fillVal);
        setShapeHasFill(true);
      } else {
        setShapeHasFill(false);
      }
      setShapeStroke(activeObject.stroke || '#000000');
      setShapeStrokeWidth(activeObject.strokeWidth || 1);
    }
  }, [activeObject]);

  // Object updater utility
  const updateActiveObjectProperty = (property: string, value: any) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active !== bgImageObject) {
      active.set(property as any, value);
      canvas.renderAll();
      onStateChange();
    }
  };

  // Add Shapes
  const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'line') => {
    if (!canvas) return;
    
    const fill = shapeHasFill ? shapeFill : 'transparent';
    const stroke = shapeStroke;
    const strokeWidth = shapeStrokeWidth;

    const commonProps = {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center' as const,
      originY: 'center' as const,
      fill: fill,
      stroke: stroke,
      strokeWidth: strokeWidth,
      cornerColor: 'var(--accent-color)',
      cornerStyle: 'circle' as const,
      transparentCorners: false
    };

    let shapeObj: fabric.Object | null = null;

    if (shapeType === 'rect') {
      shapeObj = new fabric.Rect({
        ...commonProps,
        width: 120,
        height: 100
      });
    } else if (shapeType === 'circle') {
      shapeObj = new fabric.Circle({
        ...commonProps,
        radius: 50
      });
    } else if (shapeType === 'triangle') {
      shapeObj = new fabric.Triangle({
        ...commonProps,
        width: 110,
        height: 100
      });
    } else if (shapeType === 'line') {
      shapeObj = new fabric.Line([50, 50, 200, 50], {
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        stroke: stroke,
        strokeWidth: strokeWidth || 3,
        cornerColor: 'var(--accent-color)',
        cornerStyle: 'circle',
        transparentCorners: false
      });
    }

    if (shapeObj) {
      canvas.add(shapeObj);
      canvas.setActiveObject(shapeObj);
      canvas.renderAll();
      setIsDrawing(false); // Move to select mode
    }
  };

  // Add Text Box
  const addTextBox = () => {
    if (!canvas) return;

    const textObj = new fabric.IText('Edit Text Here', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textFont,
      fontSize: textSize,
      fill: textColor,
      textAlign: textAlign,
      cornerColor: 'var(--accent-color)',
      cornerStyle: 'circle',
      transparentCorners: false
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    setIsDrawing(false); // Switch to select
  };

  // Format Text
  const toggleBold = () => {
    const nextVal = !isBold;
    setIsBold(nextVal);
    updateActiveObjectProperty('fontWeight', nextVal ? 'bold' : 'normal');
  };

  const toggleItalic = () => {
    const nextVal = !isItalic;
    setIsItalic(nextVal);
    updateActiveObjectProperty('fontStyle', nextVal ? 'italic' : 'normal');
  };

  const toggleUnderline = () => {
    const nextVal = !isUnderline;
    setIsUnderline(nextVal);
    updateActiveObjectProperty('underline', nextVal);
  };

  const changeAlignment = (align: string) => {
    setTextAlign(align);
    updateActiveObjectProperty('textAlign', align);
  };

  // File Upload Handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) return;
        fabric.Image.fromURL(event.target.result as string, (img) => {
          if (img.width! > canvas.width! * 0.8 || img.height! > canvas.height! * 0.8) {
            const ratio = Math.min((canvas.width! * 0.7) / img.width!, (canvas.height! * 0.7) / img.height!);
            img.scale(ratio);
          }

          img.set({
            left: canvas.width! / 2,
            top: canvas.height! / 2,
            originX: 'center',
            originY: 'center',
            cornerColor: 'var(--accent-color)',
            cornerStyle: 'circle',
            transparentCorners: false
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          setIsDrawing(false);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="tool-panel">
      {/* 1. DRAW PANEL */}
      <div className={`panel-content ${activeTab === 'draw' ? 'active' : ''}`}>
        <h2>Drawing Brush</h2>
        
        <div className="panel-section">
          <label className="section-title">Brush Mode</label>
          <div className="toggle-group">
            <button 
              className={`toggle-btn ${isDrawing ? 'active' : ''}`}
              onClick={() => setIsDrawing(true)}
            >
              <Pencil size={16} /> Brush On
            </button>
            <button 
              className={`toggle-btn ${!isDrawing ? 'active' : ''}`}
              onClick={() => setIsDrawing(false)}
            >
              <MousePointer size={16} /> Select/Edit
            </button>
          </div>
        </div>

        {isDrawing && (
          <div className="panel-section">
            <label className="section-title">Brush Color</label>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                value={brushColor} 
                onChange={(e) => setBrushColor(e.target.value)} 
              />
              <span className="hex-value">{brushColor}</span>
            </div>
            <div className="color-presets">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="preset-color"
                  style={{ 
                    backgroundColor: color, 
                    border: color === '#ffffff' ? '1px solid #444' : 'none' 
                  }}
                  onClick={() => setBrushColor(color)}
                  title={color}
                />
              ))}
            </div>

            <label className="section-title">Brush Thickness: {brushWidth}px</label>
            <div className="range-slider-wrapper">
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={brushWidth} 
                onChange={(e) => setBrushWidth(parseInt(e.target.value))} 
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. SHAPES PANEL */}
      <div className={`panel-content ${activeTab === 'shapes' ? 'active' : ''}`}>
        <h2>Shapes</h2>
        
        <div className="panel-section">
          <label className="section-title">Insert Shape</label>
          <div className="grid-shapes">
            <button className="shape-btn" onClick={() => addShape('rect')} title="Add Rectangle">
              <Square size={22} /> Rectangle
            </button>
            <button className="shape-btn" onClick={() => addShape('circle')} title="Add Circle">
              <CircleIcon size={22} /> Circle
            </button>
            <button className="shape-btn" onClick={() => addShape('triangle')} title="Add Triangle">
              <TriangleIcon size={22} /> Triangle
            </button>
            <button className="shape-btn" onClick={() => addShape('line')} title="Add Line">
              <Minus size={22} /> Line
            </button>
          </div>
        </div>

        <div className="panel-section">
          <label className="section-title">Shape Properties</label>
          
          <div className="property-row">
            <span className="prop-label">Fill Color</span>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                value={shapeFill} 
                disabled={!shapeHasFill}
                onChange={(e) => {
                  setShapeFill(e.target.value);
                  updateActiveObjectProperty('fill', e.target.value);
                }} 
              />
              <span className="hex-value">{shapeFill}</span>
            </div>
          </div>
          
          <div className="property-row checkbox-row">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={shapeHasFill} 
                onChange={(e) => {
                  setShapeHasFill(e.target.checked);
                  updateActiveObjectProperty('fill', e.target.checked ? shapeFill : 'transparent');
                }} 
              />
              <span>Enable Fill</span>
            </label>
          </div>

          <div className="property-row">
            <span className="prop-label">Stroke Color</span>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                value={shapeStroke} 
                onChange={(e) => {
                  setShapeStroke(e.target.value);
                  updateActiveObjectProperty('stroke', e.target.value);
                }} 
              />
              <span className="hex-value">{shapeStroke}</span>
            </div>
          </div>

          <div className="property-row">
            <span className="prop-label">Border: {shapeStrokeWidth}px</span>
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={shapeStrokeWidth} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setShapeStrokeWidth(val);
                updateActiveObjectProperty('strokeWidth', val);
              }} 
            />
          </div>
        </div>
      </div>

      {/* 3. TEXT PANEL */}
      <div className={`panel-content ${activeTab === 'text' ? 'active' : ''}`}>
        <h2>Text Studio</h2>
        
        <div className="panel-section">
          <button className="btn btn-accent btn-full" onClick={addTextBox}>
            <Plus size={16} /> Add Text Box
          </button>
        </div>

        <div className="panel-section">
          <label className="section-title">Text Formatting</label>
          
          <div className="property-row">
            <span className="prop-label">Font Family</span>
            <select 
              value={textFont} 
              onChange={(e) => {
                setTextFont(e.target.value);
                updateActiveObjectProperty('fontFamily', e.target.value);
              }}
            >
              <option value="Inter">Inter (Sans-Serif)</option>
              <option value="Roboto">Roboto (Sleek)</option>
              <option value="Playfair Display">Playfair (Elegant Serif)</option>
              <option value="Pacifico">Pacifico (Handwritten)</option>
              <option value="Orbitron">Orbitron (Modern Tech)</option>
            </select>
          </div>

          <div className="property-row">
            <span className="prop-label">Size: {textSize}px</span>
            <input 
              type="range" 
              min="8" 
              max="120" 
              value={textSize} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTextSize(val);
                updateActiveObjectProperty('fontSize', val);
              }} 
            />
          </div>

          <div className="property-row">
            <span className="prop-label">Text Color</span>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                value={textColor} 
                onChange={(e) => {
                  setTextColor(e.target.value);
                  updateActiveObjectProperty('fill', e.target.value);
                }} 
              />
              <span className="hex-value">{textColor}</span>
            </div>
          </div>

          <div className="style-row">
            <button 
              className={`style-toggle ${isBold ? 'active' : ''}`} 
              onClick={toggleBold} 
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button 
              className={`style-toggle ${isItalic ? 'active' : ''}`} 
              onClick={toggleItalic} 
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button 
              className={`style-toggle ${isUnderline ? 'active' : ''}`} 
              onClick={toggleUnderline} 
              title="Underline"
            >
              <Underline size={16} />
            </button>
            <span className="divider-vertical"></span>
            <button 
              className={`style-toggle ${textAlign === 'left' ? 'active' : ''}`} 
              onClick={() => changeAlignment('left')} 
              title="Left Align"
            >
              <AlignLeft size={16} />
            </button>
            <button 
              className={`style-toggle ${textAlign === 'center' ? 'active' : ''}`} 
              onClick={() => changeAlignment('center')} 
              title="Center Align"
            >
              <AlignCenter size={16} />
            </button>
            <button 
              className={`style-toggle ${textAlign === 'right' ? 'active' : ''}`} 
              onClick={() => changeAlignment('right')} 
              title="Right Align"
            >
              <AlignRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. IMAGES PANEL */}
      <div className={`panel-content ${activeTab === 'images' ? 'active' : ''}`}>
        <h2>Images & Media</h2>
        
        <div className="panel-section">
          <div className="upload-zone" onClick={handleUploadClick}>
            <UploadCloud className="upload-icon" />
            <p>Drag & drop images here</p>
            <p className="small">or</p>
            <button className="btn btn-secondary btn-sm" onClick={handleUploadClick}>
              Choose Image File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="panel-section info-card">
          <div className="card-header">
            <ClipboardPaste className="info-icon" />
            <strong>Instant Clipboard Paste</strong>
          </div>
          <p>
            You can copy any image from the web or other programs and simply press{' '}
            <strong>Ctrl + V</strong> anywhere on this window to instantly paste it onto your canvas.
          </p>
        </div>
      </div>

      {/* 5. AI GENERATOR PANEL */}
      <div className={`panel-content ai-panel ${activeTab === 'ai' ? 'active' : ''}`}>
        <div className="ai-panel-header">
          <Wand2 size={18} className="ai-panel-icon" />
          <h2>AI Design Generator</h2>
        </div>
        <p className="ai-panel-subtitle">Pick a preset or write your own prompt to generate 4 sticker designs.</p>

        {/* Preset chips */}
        <div className="panel-section">
          <label className="section-title">Preset Styles</label>
          <div className="ai-preset-grid">
            {AI_PRESETS.map((preset) => (
              <button
                key={preset.key}
                className={`ai-preset-chip ${aiPresetKey === preset.key ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
                title={preset.prompt || preset.label}
              >
                <span className="ai-preset-emoji">{preset.emoji}</span>
                <span className="ai-preset-label">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt textarea */}
        <div className="panel-section">
          <label className="section-title">Prompt</label>
          <textarea
            className="ai-prompt-textarea"
            value={aiPrompt}
            onChange={(e) => { setAiPrompt(e.target.value); setAiPresetKey('custom'); }}
            placeholder="Describe your sticker design... e.g. 'Cute dragon mascot, kawaii style'"
            rows={4}
          />
          <p className="ai-prompt-hint">
            <Sparkles size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
            Suffix automatically added: transparent background, die-cut sticker, isolated PNG
          </p>
        </div>

        {/* Generate button */}
        <div className="panel-section">
          <button
            className={`btn btn-ai-generate btn-full ${aiGenerating ? 'loading' : ''}`}
            onClick={handleAiGenerate}
            disabled={aiGenerating || !aiPrompt.trim()}
          >
            {aiGenerating ? (
              <><Loader2 size={16} className="ai-spin" /> Generating 4 images…</>
            ) : (
              <><Wand2 size={16} /> Generate 4 Designs</>  
            )}
          </button>
        </div>

        {/* Error display */}
        {aiError && (
          <div className="ai-error-box">
            <ImageOff size={14} />
            <span>{aiError}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {aiGenerating && (
          <div className="ai-gallery">
            {[0,1,2,3].map((i) => (
              <div key={i} className="ai-gallery-skeleton">
                <div className="ai-skeleton-shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* Generated images gallery */}
        {!aiGenerating && aiImages.length > 0 && (
          <div className="panel-section">
            <label className="section-title">Click to add to canvas</label>
            <div className="ai-gallery">
              {aiImages.map((url, i) => (
                <button
                  key={url}
                  className={`ai-gallery-item ${aiAddedIndex === i ? 'added' : ''}`}
                  onClick={() => handleAddAiImageToCanvas(url, i)}
                  title="Click to add to canvas"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`AI design ${i + 1}`} className="ai-gallery-img" />
                  <div className="ai-gallery-overlay">
                    {aiAddedIndex === i ? (
                      <><CheckCircle2 size={20} /> Added!</>
                    ) : (
                      <><Sparkles size={16} /> Add to Canvas</>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. LAYERS PANEL */}
      <div className={`panel-content ${activeTab === 'layers' ? 'active' : ''}`}>
        {children}
      </div>
    </section>
  );
}

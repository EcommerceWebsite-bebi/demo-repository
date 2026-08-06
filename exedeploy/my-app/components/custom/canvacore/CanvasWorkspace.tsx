import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { HelpCircle, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface CanvasWorkspaceProps {
  onCanvasInit: (canvas: fabric.Canvas, bgImage: fabric.Image | null) => void;
  onSelectionChanged: (selected: fabric.Object | null) => void;
  onStateChange: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  bgImagePath?: string;
}

export default function CanvasWorkspace({
  onCanvasInit,
  onSelectionChanged,
  onStateChange,
  zoom,
  setZoom,
  bgImagePath = '/ao.1.png'
}: CanvasWorkspaceProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const bgImageRef = useRef<fabric.Image | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 750; // Strict 2:3 aspect ratio (500x750)

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasElRef.current) return;

    const fCanvas = new fabric.Canvas(canvasElRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = fCanvas;
    let destroyed = false;

    // Load background image
    fabric.Image.fromURL(
      bgImagePath,
      (img) => {
        if (destroyed) return;
        fCanvas.setHeight(CANVAS_HEIGHT);
        fCanvas.setDimensions({
          width: CANVAS_WIDTH * zoom,
          height: CANVAS_HEIGHT * zoom
        });

        const scaleX = CANVAS_WIDTH / img.width!;
        const scaleY = CANVAS_HEIGHT / img.height!;
        img.set({
          scaleX: scaleX,
          scaleY: scaleY,
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          hoverCursor: 'default'
        });

        fCanvas.setBackgroundImage(img, () => {
          if (destroyed) return;
          bgImageRef.current = img;
          fCanvas.renderAll();
          // Callback to parent with initialized canvas and background object
          onCanvasInit(fCanvas, img);
        });
      },
      { crossOrigin: 'anonymous' }
    );

    // Event listeners
    const handleSelection = () => {
      const active = fCanvas.getActiveObject();
      // Don't report background shirt as select action
      if (active === bgImageRef.current) {
        onSelectionChanged(null);
      } else {
        onSelectionChanged(active);
      }
    };

    fCanvas.on('object:added', onStateChange);
    fCanvas.on('object:removed', onStateChange);
    fCanvas.on('object:modified', onStateChange);
    fCanvas.on('path:created', onStateChange);

    fCanvas.on('selection:created', handleSelection);
    fCanvas.on('selection:updated', handleSelection);
    fCanvas.on('selection:cleared', () => onSelectionChanged(null));

    // Cleanup on unmount
    return () => {
      destroyed = true;
      fCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Effect to handle dynamic background image changes (front/back toggling)
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas || !bgImagePath) return;

    let cancelled = false;

    fabric.Image.fromURL(
      bgImagePath,
      (img) => {
        if (cancelled) return;
        const scaleX = CANVAS_WIDTH / img.width!;
        const scaleY = CANVAS_HEIGHT / img.height!;
        img.set({
          scaleX: scaleX,
          scaleY: scaleY,
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          hoverCursor: 'default'
        });

        fCanvas.setBackgroundImage(img, () => {
          if (cancelled) return;
          bgImageRef.current = img;
          fCanvas.renderAll();
        });
      },
      { crossOrigin: 'anonymous' }
    );

    return () => {
      cancelled = true;
    };
  }, [bgImagePath]);

  // Sync zoom level physical canvas sizes
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    fCanvas.setZoom(zoom);
    fCanvas.setDimensions({
      width: CANVAS_WIDTH * zoom,
      height: CANVAS_HEIGHT * zoom
    });
  }, [zoom]);

  // Window Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const fCanvas = fabricCanvasRef.current;
      if (!fCanvas) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // Avoid pasting if the user is editing text (since they want to paste text instead of image)
      const activeObj = fCanvas.getActiveObject();
      const isEditingText = activeObj && (
        (activeObj as any).isEditing || 
        (activeObj.type === 'textbox' && document.activeElement === (activeObj as any).hiddenTextarea)
      );
      if (isEditingText) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            if (!event.target?.result) return;

            fabric.Image.fromURL(event.target.result as string, (img) => {
              if (img.width! > fCanvas.width! * 0.8 || img.height! > fCanvas.height! * 0.8) {
                const ratio = Math.min((fCanvas.width! * 0.7) / img.width!, (fCanvas.height! * 0.7) / img.height!);
                img.scale(ratio);
              }

              img.set({
                left: fCanvas.width! / (2 * zoom),
                top: fCanvas.height! / (2 * zoom),
                originX: 'center',
                originY: 'center',
                cornerColor: 'var(--accent-color)',
                cornerStyle: 'circle',
                transparentCorners: false
              });

              fCanvas.add(img);
              fCanvas.setActiveObject(img);
              fCanvas.isDrawingMode = false; // Turn off brush drawing
              fCanvas.renderAll();
            });
          };

          reader.readAsDataURL(blob);
          e.preventDefault();
          break; // only paste one image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [zoom]);

  // Drag & drop file loaders
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (containerRef.current) {
      containerRef.current.classList.add('dragover');
    }
  };

  const handleDragLeave = () => {
    if (containerRef.current) {
      containerRef.current.classList.remove('dragover');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (containerRef.current) {
      containerRef.current.classList.remove('dragover');
    }

    const file = e.dataTransfer.files?.[0];
    const fCanvas = fabricCanvasRef.current;
    if (file && file.type.indexOf('image') === 0 && fCanvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) return;
        fabric.Image.fromURL(event.target.result as string, (img) => {
          if (img.width! > fCanvas.width! * 0.8 || img.height! > fCanvas.height! * 0.8) {
            const ratio = Math.min((fCanvas.width! * 0.7) / img.width!, (fCanvas.height! * 0.7) / img.height!);
            img.scale(ratio);
          }

          img.set({
            left: fCanvas.width! / (2 * zoom),
            top: fCanvas.height! / (2 * zoom),
            originX: 'center',
            originY: 'center',
            cornerColor: 'var(--accent-color)',
            cornerStyle: 'circle',
            transparentCorners: false
          });

          fCanvas.add(img);
          fCanvas.setActiveObject(img);
          fCanvas.isDrawingMode = false;
          fCanvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const adjustZoom = (amount: number) => {
    setZoom(Math.max(0.2, Math.min(3.0, zoom + amount)));
  };

  return (
    <main
      className="canvas-workspace"
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="canvas-container-outer">
        <canvas ref={canvasElRef} />
      </div>

      {/* Floating Zoom Controls */}
      <div className="floating-controls">
        <div className="control-group">
          <button className="control-btn" onClick={() => adjustZoom(-0.1)} title="Zoom Out">
            <ZoomOut />
          </button>
          <span className="control-text">{Math.round(zoom * 100)}%</span>
          <button className="control-btn" onClick={() => adjustZoom(0.1)} title="Zoom In">
            <ZoomIn />
          </button>
          <button className="control-btn" onClick={() => setZoom(1.0)} title="Reset Zoom">
            <RefreshCw />
          </button>
        </div>
      </div>

      {/* Dynamic workspace tip */}
      <div className="workspace-tip">
        <HelpCircle />
        <span>Select an object to resize/rotate. Use Backspace or Delete to remove.</span>
      </div>
    </main>
  );
}

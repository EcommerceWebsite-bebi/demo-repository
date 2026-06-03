"use client";

import { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { 
  Palette, 
  Undo2, 
  Redo2, 
  Trash2, 
  Download, 
  ChevronDown, 
  Image as ImageIcon, 
  Sparkles 
} from 'lucide-react';
import './CanvasEditor.css';
import Sidebar from './Sidebar';
import CanvasWorkspace from './CanvasWorkspace';
import ToolbarPanel from './ToolbarPanel';
import InspectorPanel from './InspectorPanel';
import LayerManager from './LayerManager';

interface CanvasEditorProps {
  onApply: (frontUrl: string, backUrl: string) => void;
  onClose?: () => void;
  isInline?: boolean;
}

export default function CanvasEditor({ onApply, onClose, isInline = false }: CanvasEditorProps) {
  // Global States
  const [activeTab, setActiveTab] = useState('draw');
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [bgImageObject, setBgImageObject] = useState<fabric.Image | null>(null);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [layersVersion, setLayersVersion] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  // Side-Switching States
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const bgImagePath = currentSide === 'front' ? '/ao.1.png' : '/ao.2.png';
  const frontObjectsRef = useRef<fabric.Object[]>([]);
  const backObjectsRef = useRef<fabric.Object[]>([]);

  // Undo/Redo States
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const isUndoRedoingRef = useRef(false);

  // Export Dropdown State
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Handle outside clicks to close export dropdown
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsExportDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Callback when canvas is initialized
  const handleCanvasInit = (fCanvas: fabric.Canvas, bgImg: fabric.Image | null) => {
    setCanvas(fCanvas);
    setBgImageObject(bgImg);
    
    // Clear refs and reset state baseline
    undoStackRef.current = [];
    redoStackRef.current = [];
    isUndoRedoingRef.current = false;
    
    // Save initial state
    const stateStr = JSON.stringify(fCanvas.toJSON(['selectable', 'evented', 'hoverCursor', 'excludeFromExport', 'id']));
    undoStackRef.current.push(stateStr);
    setCanUndo(false);
    setCanRedo(false);
  };

  // Switch between front and back sides
  const handleSideChange = (newSide: 'front' | 'back') => {
    if (!canvas || newSide === currentSide) return;

    // 1. Get all design objects (excluding the background image)
    const objects = canvas.getObjects().filter(o => o !== bgImageObject);

    // 2. Save them to the ref of the current side
    if (currentSide === 'front') {
      frontObjectsRef.current = objects;
    } else {
      backObjectsRef.current = objects;
    }

    // 3. Remove them from canvas
    objects.forEach(obj => canvas.remove(obj));

    // 4. Update the side state
    setCurrentSide(newSide);

    // 5. Add back the objects for the new side
    const newObjects = newSide === 'front' ? frontObjectsRef.current : backObjectsRef.current;
    newObjects.forEach(obj => canvas.add(obj));

    // 6. Reset selection
    canvas.discardActiveObject();
    setActiveObject(null);

    // 7. Reset undo/redo stacks to prevent cross-side undo bugs
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);

    // Save initial state for the new side
    const stateStr = JSON.stringify(canvas.toJSON(['selectable', 'evented', 'hoverCursor', 'excludeFromExport', 'id']));
    undoStackRef.current.push(stateStr);

    canvas.renderAll();
  };

  // State Change handler (triggers undo state saving)
  const handleStateChange = () => {
    if (!canvas || isUndoRedoingRef.current) return;

    // Apply unique IDs to newly created elements for rendering optimization
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (!obj.id) {
        obj.id = `layer-${Math.random().toString(36).substr(2, 9)}`;
      }
    });

    const stateStr = JSON.stringify(canvas.toJSON(['selectable', 'evented', 'hoverCursor', 'excludeFromExport', 'id']));
    
    // Skip if state hasn't changed
    const lastState = undoStackRef.current[undoStackRef.current.length - 1];
    if (lastState === stateStr) return;

    undoStackRef.current.push(stateStr);
    
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }

    redoStackRef.current = []; // Clear redo
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(false);
    setLayersVersion(prev => prev + 1);
  };

  // Undo Handler
  const handleUndo = () => {
    if (!canvas || undoStackRef.current.length <= 1) return;

    isUndoRedoingRef.current = true;
    const currentState = undoStackRef.current.pop()!;
    redoStackRef.current.push(currentState);

    const targetState = undoStackRef.current[undoStackRef.current.length - 1];
    canvas.loadFromJSON(targetState, () => {
      // Re-map background shirt reference
      const objs = canvas.getObjects();
      const bg = objs.find(o => o.selectable === false && o.evented === false);
      if (bg) {
        setBgImageObject(bg as fabric.Image);
      }
      
      canvas.renderAll();
      isUndoRedoingRef.current = false;
      
      setCanUndo(undoStackRef.current.length > 1);
      setCanRedo(true);
      setLayersVersion(prev => prev + 1);
      setActiveObject(null);
    });
  };

  // Redo Handler
  const handleRedo = () => {
    if (!canvas || redoStackRef.current.length === 0) return;

    isUndoRedoingRef.current = true;
    const nextState = redoStackRef.current.pop()!;
    undoStackRef.current.push(nextState);

    canvas.loadFromJSON(nextState, () => {
      // Re-map background shirt reference
      const objs = canvas.getObjects();
      const bg = objs.find(o => o.selectable === false && o.evented === false);
      if (bg) {
        setBgImageObject(bg as fabric.Image);
      }

      canvas.renderAll();
      isUndoRedoingRef.current = false;

      setCanUndo(true);
      setCanRedo(redoStackRef.current.length > 0);
      setLayersVersion(prev => prev + 1);
      setActiveObject(null);
    });
  };

  // Clear all design layers
  const handleClearCanvas = () => {
    if (!canvas) return;
    if (window.confirm('Are you sure you want to clear your entire design?')) {
      const objs = canvas.getObjects();
      const designLayers = objs.filter(o => o !== bgImageObject);
      designLayers.forEach(o => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.renderAll();
      handleStateChange();
    }
  };

  // Trigger Download
  const triggerDownload = (filename: string, transparentArtworkOnly: boolean) => {
    if (!canvas) return;

    const originalZoom = zoom;
    const baseWidth = canvas.getWidth() / originalZoom;
    const baseHeight = canvas.getHeight() / originalZoom;
    
    // Temporarily reset zoom to 100% for full resolution export
    canvas.setZoom(1.0);
    canvas.setDimensions({
      width: baseWidth,
      height: baseHeight
    });
    canvas.discardActiveObject();
    setActiveObject(null);
    canvas.renderAll();

    let dataURL = '';

    if (transparentArtworkOnly) {
      // Hide background shirt template
      const prevBgImage = canvas.backgroundImage;
      canvas.backgroundImage = undefined;
      const prevBg = canvas.backgroundColor;
      canvas.backgroundColor = 'rgba(0,0,0,0)';
      canvas.renderAll();

      dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0
      });

      // Restore background shirt template
      canvas.backgroundImage = prevBgImage;
      canvas.backgroundColor = prevBg;
      canvas.renderAll();
    } else {
      dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0
      });
    }

    // Restore zoom level
    canvas.setZoom(originalZoom);
    canvas.setDimensions({
      width: baseWidth * originalZoom,
      height: baseHeight * originalZoom
    });
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`canvas-studio-container ${isInline ? 'inline-editor' : ''}`}>
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Palette />
          <h1>Canvas Studio</h1>
          <span className="badge">v1.0 (React)</span>
          
          {/* Front / Back Side Switcher */}
          <div className="side-switcher" style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', marginLeft: '16px' }}>
            <button
              onClick={() => handleSideChange('front')}
              className="side-btn"
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: currentSide === 'front' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: currentSide === 'front' ? '#ffffff' : '#9ca3af'
              }}
            >
              Mặt trước
            </button>
            <button
              onClick={() => handleSideChange('back')}
              className="side-btn"
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: currentSide === 'back' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: currentSide === 'back' ? '#ffffff' : '#9ca3af'
              }}
            >
              Mặt sau
            </button>
          </div>
        </div>
        <div className="actions-section">
          <button 
            className="btn-icon" 
            onClick={handleUndo} 
            disabled={!canUndo} 
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button 
            className="btn-icon" 
            onClick={handleRedo} 
            disabled={!canRedo} 
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </button>
          <span className="divider"></span>
          <button className="btn btn-danger" onClick={handleClearCanvas} title="Clear design">
            <Trash2 size={16} />
            <span>Clear Canvas</span>
          </button>
          
          <div className="export-dropdown-wrapper">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={(e) => {
                e.stopPropagation();
                setIsExportDropdownOpen(!isExportDropdownOpen);
              }}
              title="Download Design"
            >
              <Download size={16} />
              <span>Download</span>
              <ChevronDown size={16} className="chevron" />
            </button>
            <div className={`dropdown-menu ${isExportDropdownOpen ? 'open' : ''}`}>
              <button 
                className="dropdown-item" 
                onClick={() => triggerDownload('canvas-design-full.png', false)}
              >
                <ImageIcon size={18} />
                <div className="item-text">
                  <strong>Export Full Design</strong>
                  <span>Shirt template + artwork</span>
                </div>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => triggerDownload('canvas-artwork-only.png', true)}
              >
                <Sparkles size={18} />
                <div className="item-text">
                  <strong>Export Artwork Only</strong>
                  <span>Transparent PNG artwork</span>
                </div>
              </button>
            </div>
          </div>

          <span className="divider"></span>

          <button 
            className="btn btn-accent" 
            onClick={() => {
              if (!canvas) return;

              // Discard active selection
              canvas.discardActiveObject();
              setActiveObject(null);

              // 1. Save current side's objects to ref
              const objects = canvas.getObjects().filter(o => o !== bgImageObject);
              if (currentSide === 'front') {
                frontObjectsRef.current = objects;
              } else {
                backObjectsRef.current = objects;
              }

               // Helper function to export a side's objects as transparent PNG
              const exportSide = (objs: fabric.Object[]) => {
                // Temporarily hide background template
                const prevBgImage = canvas.backgroundImage;
                canvas.backgroundImage = undefined;

                const prevBg = canvas.backgroundColor;
                canvas.backgroundColor = 'rgba(0,0,0,0)';

                // Remove all current objects
                const currentObjs = canvas.getObjects().filter(o => o !== bgImageObject);
                currentObjs.forEach(o => canvas.remove(o));

                // Add side's objects
                objs.forEach(o => canvas.add(o));
                canvas.renderAll();

                const dataURL = canvas.toDataURL({
                  format: 'png',
                  quality: 1.0
                });

                // Restore background template and background color
                canvas.backgroundImage = prevBgImage;
                canvas.backgroundColor = prevBg;

                return dataURL;
              };

              // 2. Export front and back (only export if there are objects on that side, otherwise pass empty string to save texture load)
              const frontUrl = frontObjectsRef.current.length > 0 ? exportSide(frontObjectsRef.current) : '';
              const backUrl = backObjectsRef.current.length > 0 ? exportSide(backObjectsRef.current) : '';

              // 3. Restore the current side's objects to canvas
              const activeObjs = canvas.getObjects().filter(o => o !== bgImageObject);
              activeObjs.forEach(o => canvas.remove(o));

              const restoreObjs = currentSide === 'front' ? frontObjectsRef.current : backObjectsRef.current;
              restoreObjs.forEach(o => canvas.add(o));
              canvas.renderAll();

              // 4. Trigger apply callback with both URLs
              onApply(frontUrl, backUrl);
            }}
            title="Apply artwork to 3D Shirt"
          >
            <Sparkles size={16} />
            <span>Apply to Shirt</span>
          </button>
          
          {!isInline && onClose && (
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              title="Cancel and close editor"
            >
              <span>Close</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="workspace-layout">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <ToolbarPanel 
          activeTab={activeTab} 
          canvas={canvas}
          bgImageObject={bgImageObject}
          activeObject={activeObject}
          onStateChange={handleStateChange}
        >
          <LayerManager 
            canvas={canvas}
            activeObject={activeObject}
            bgImageObject={bgImageObject}
            layersVersion={layersVersion}
            onStateChange={handleStateChange}
          />
        </ToolbarPanel>

        <CanvasWorkspace 
          onCanvasInit={handleCanvasInit}
          onSelectionChanged={setActiveObject}
          onStateChange={handleStateChange}
          zoom={zoom}
          setZoom={setZoom}
          bgImagePath={bgImagePath}
        />

        {activeObject && activeObject !== bgImageObject && (
          <InspectorPanel 
            canvas={canvas}
            activeObject={activeObject}
            bgImageObject={bgImageObject}
            onStateChange={handleStateChange}
          />
        )}
      </div>
    </div>
  );
}

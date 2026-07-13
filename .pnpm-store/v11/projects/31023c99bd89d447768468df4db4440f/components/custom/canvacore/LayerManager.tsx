import { fabric } from 'fabric';
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  Brush, 
  Square, 
  Circle, 
  Triangle, 
  Minus, 
  Type, 
  Image as ImageIcon,
  Layers 
} from 'lucide-react';

interface LayerManagerProps {
  canvas: fabric.Canvas | null;
  activeObject: fabric.Object | null;
  bgImageObject: fabric.Image | null;
  layersVersion: number; // Used to trigger React re-renders on canvas changes
  onStateChange: () => void;
}

export default function LayerManager({
  canvas,
  activeObject,
  bgImageObject,
  layersVersion,
  onStateChange
}: LayerManagerProps) {
  // Read layersVersion to trigger react component updates
  if (layersVersion === -1) {
    console.log(layersVersion);
  }
  if (!canvas) {
    return (
      <div className="layers-container">
        <div className="empty-layers">Loading canvas layers...</div>
      </div>
    );
  }

  const objects = canvas.getObjects();
  // Filter out the background image so it is not shown in the layers panel
  const designLayers = objects.filter(obj => obj !== bgImageObject);

  if (designLayers.length === 0) {
    return (
      <>
        <h2>Layer Manager</h2>
        <p className="panel-desc">Drag or order layers to structure your design.</p>
        <div className="panel-section" style={{ marginTop: '16px' }}>
          <div className="layers-container">
            <div className="empty-layers">No items on canvas yet.</div>
          </div>
        </div>
      </>
    );
  }

  // Get Lucide icon component based on Fabric object type
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'path':
        return Brush;
      case 'i-text':
      case 'textbox':
      case 'text':
        return Type;
      case 'image':
        return ImageIcon;
      case 'rect':
        return Square;
      case 'circle':
        return Circle;
      case 'triangle':
        return Triangle;
      case 'line':
        return Minus;
      default:
        return Layers;
    }
  };

  // Get user-friendly label for objects
  const getLayerLabel = (obj: fabric.Object) => {
    switch (obj.type) {
      case 'path':
        return 'Drawing';
      case 'i-text':
      case 'textbox':
      case 'text': {
        const text = (obj as fabric.IText).text || '';
        return `Text: "${text.substring(0, 10)}${text.length > 10 ? '...' : ''}"`;
      }
      case 'image':
        return 'Pasted Image';
      case 'rect':
        return 'Rectangle';
      case 'circle':
        return 'Circle';
      case 'triangle':
        return 'Triangle';
      case 'line':
        return 'Line';
      default:
        return 'Element';
    }
  };

  const handleSelectLayer = (obj: fabric.Object) => {
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const handleToggleVisibility = (e: React.MouseEvent, obj: fabric.Object) => {
    e.stopPropagation();
    obj.set('visible', !obj.visible);
    // If we hide the currently active object, discard it
    if (!obj.visible && canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
    }
    canvas.renderAll();
    onStateChange();
  };

  const handleDeleteLayer = (e: React.MouseEvent, obj: fabric.Object) => {
    e.stopPropagation();
    canvas.remove(obj);
    if (canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
    }
    canvas.renderAll();
    onStateChange();
  };

  return (
    <>
      <h2>Layer Manager</h2>
      <p className="panel-desc">Manage layers and control their visibility.</p>
      
      <div className="panel-section" style={{ marginTop: '16px' }}>
        <div className="layers-container">
          {/* Render layers in reverse (rendering stack top item listed first) */}
          {designLayers.slice().reverse().map((obj, idx) => {
            const IconComponent = getLayerIcon(obj.type || '');
            const isActive = activeObject === obj;
            const key = (obj as any).id || `layer-${designLayers.length - 1 - idx}`;

            return (
              <div 
                key={key}
                className={`layer-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectLayer(obj)}
              >
                <div className="layer-info">
                  <IconComponent size={16} />
                  <span>{getLayerLabel(obj)}</span>
                </div>
                <div className="layer-controls">
                  <button 
                    className="layer-btn btn-toggle-vis" 
                    onClick={(e) => handleToggleVisibility(e, obj)}
                    title="Toggle Visibility"
                  >
                    {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button 
                    className="layer-btn btn-delete-layer" 
                    onClick={(e) => handleDeleteLayer(e, obj)}
                    title="Delete Layer"
                    style={{ color: 'var(--danger-color)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

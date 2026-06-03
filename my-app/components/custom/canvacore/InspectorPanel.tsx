import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { 
  Trash2, 
  MousePointerClick, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUp, 
  ChevronsDown 
} from 'lucide-react';

interface InspectorPanelProps {
  canvas: fabric.Canvas | null;
  activeObject: fabric.Object | null;
  bgImageObject: fabric.Image | null;
  onStateChange: () => void;
}

export default function InspectorPanel({
  canvas,
  activeObject,
  bgImageObject,
  onStateChange
}: InspectorPanelProps) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [opacity, setOpacity] = useState(100);

  // Sync state values with active object
  const syncCoordinates = () => {
    if (!activeObject || activeObject === bgImageObject) return;
    setX(Math.round(activeObject.left || 0));
    setY(Math.round(activeObject.top || 0));
    setW(Math.round((activeObject.width || 0) * (activeObject.scaleX || 1)));
    setH(Math.round((activeObject.height || 0) * (activeObject.scaleY || 1)));
    setOpacity(Math.round((activeObject.opacity || 1) * 100));
  };

  useEffect(() => {
    syncCoordinates();
  }, [activeObject]);

  // Bind real-time canvas movement events
  useEffect(() => {
    if (!canvas || !activeObject) return;

    const handleUpdate = (e: any) => {
      if (e.target === activeObject) {
        syncCoordinates();
      }
    };

    canvas.on('object:moving', handleUpdate);
    canvas.on('object:scaling', handleUpdate);
    canvas.on('object:rotating', handleUpdate);

    return () => {
      canvas.off('object:moving', handleUpdate);
      canvas.off('object:scaling', handleUpdate);
      canvas.off('object:rotating', handleUpdate);
    };
  }, [canvas, activeObject]);

  if (!activeObject || activeObject === bgImageObject) {
    return (
      <aside className="quick-inspector">
        <div className="inspector-header">
          <h3>Selection Properties</h3>
        </div>
        <div className="inspector-body">
          <div className="empty-inspector">
            <MousePointerClick />
            <p>Select any object on the canvas to inspect and edit its properties.</p>
          </div>
        </div>
      </aside>
    );
  }

  // Update object property safely and trigger render + state save
  const updateProperty = (property: string, value: any) => {
    if (!canvas || !activeObject) return;
    activeObject.set(property as any, value);
    canvas.renderAll();
    onStateChange();
  };

  // Dimension scaling handlers
  const handleWidthChange = (val: number) => {
    setW(val);
    if (activeObject && activeObject.width) {
      activeObject.set('scaleX', val / activeObject.width);
      canvas?.renderAll();
      onStateChange();
    }
  };

  const handleHeightChange = (val: number) => {
    setH(val);
    if (activeObject && activeObject.height) {
      activeObject.set('scaleY', val / activeObject.height);
      canvas?.renderAll();
      onStateChange();
    }
  };

  // Delete selection
  const handleDelete = () => {
    if (!canvas || !activeObject) return;
    canvas.remove(activeObject);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  // Layer Ordering Operations
  const layerUp = () => {
    if (!canvas || !activeObject) return;
    canvas.bringForward(activeObject);
    canvas.renderAll();
    onStateChange();
  };

  const layerDown = () => {
    if (!canvas || !activeObject || !bgImageObject) return;
    const objects = canvas.getObjects();
    const bgIndex = objects.indexOf(bgImageObject);
    const activeIndex = objects.indexOf(activeObject);
    
    // Stop re-ordering if it touches background index
    if (activeIndex > bgIndex + 1) {
      canvas.sendBackwards(activeObject);
      canvas.renderAll();
      onStateChange();
    }
  };

  const layerTop = () => {
    if (!canvas || !activeObject) return;
    canvas.bringToFront(activeObject);
    canvas.renderAll();
    onStateChange();
  };

  const layerBottom = () => {
    if (!canvas || !activeObject || !bgImageObject) return;
    const objects = canvas.getObjects();
    const bgIndex = objects.indexOf(bgImageObject);
    
    while (canvas.getObjects().indexOf(activeObject) > bgIndex + 1) {
      canvas.sendBackwards(activeObject);
    }
    canvas.renderAll();
    onStateChange();
  };

  return (
    <aside className="quick-inspector">
      <div className="inspector-header">
        <h3>Selection Properties</h3>
        <button 
          className="btn-icon btn-danger-hover" 
          onClick={handleDelete}
          title="Delete Element"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="inspector-body">
        <div className="inspector-details">
          {/* Coordinates Grid */}
          <div className="panel-section">
            <label className="section-title">Position & Scale</label>
            <div className="grid-2-col">
              <div className="input-unit">
                <span>X</span>
                <input 
                  type="number" 
                  value={x} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setX(val);
                    updateProperty('left', val);
                  }} 
                />
              </div>
              <div className="input-unit">
                <span>Y</span>
                <input 
                  type="number" 
                  value={y} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setY(val);
                    updateProperty('top', val);
                  }} 
                />
              </div>
              <div className="input-unit">
                <span>W</span>
                <input 
                  type="number" 
                  value={w} 
                  onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="input-unit">
                <span>H</span>
                <input 
                  type="number" 
                  value={h} 
                  onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            
            <div className="property-row" style={{ marginTop: '10px' }}>
              <span className="prop-label">Opacity: {opacity}%</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={opacity} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setOpacity(val);
                  updateProperty('opacity', val / 100);
                }} 
              />
            </div>
          </div>

          {/* Layer Quick Actions */}
          <div className="panel-section">
            <label className="section-title">Layer Actions</label>
            <div className="layer-buttons">
              <button className="btn btn-secondary btn-sm" onClick={layerUp} title="Bring Forward">
                <ChevronUp size={16} /> Bring Forward
              </button>
              <button className="btn btn-secondary btn-sm" onClick={layerDown} title="Send Backward">
                <ChevronDown size={16} /> Send Backward
              </button>
              <button className="btn btn-secondary btn-sm" onClick={layerTop} title="Bring to Front">
                <ChevronsUp size={16} /> Bring to Front
              </button>
              <button className="btn btn-secondary btn-sm" onClick={layerBottom} title="Send to Back">
                <ChevronsDown size={16} /> Send to Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

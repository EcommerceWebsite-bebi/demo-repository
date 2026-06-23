import { Brush, Shapes, Type, ImagePlus, Layers, Wand2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: 'draw', label: 'Draw', icon: Brush },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'images', label: 'Images', icon: ImagePlus },
    { id: 'ai', label: 'AI Gen', icon: Wand2 },
    { id: 'layers', label: 'Layers', icon: Layers },
  ];

  return (
    <aside className="sidebar-tabs">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'ai' ? 'tab-btn-ai' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={`${tab.label} Tool`}
          >
            <IconComponent />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
}

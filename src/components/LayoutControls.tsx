
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sidebar, FileText, MessageSquare, Grid3X3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutState {
  showCanvas: boolean;
  showWriting: boolean;
  showChat: boolean;
}

interface LayoutControlsProps {
  layoutState: LayoutState;
  onLayoutChange: (state: LayoutState) => void;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({ 
  layoutState, 
  onLayoutChange 
}) => {
  const togglePanel = (panel: keyof LayoutState) => {
    const newState = {
      ...layoutState,
      [panel]: !layoutState[panel]
    };
    
    // 至少保留一个布局区域
    const visiblePanels = Object.values(newState).filter(Boolean).length;
    if (visiblePanels === 0) {
      return; // 不允许全部收起
    }
    
    onLayoutChange(newState);
  };

  const layouts = [
    {
      key: 'showCanvas' as keyof LayoutState,
      icon: Grid3X3,
      label: 'Canvas',
      active: layoutState.showCanvas
    },
    {
      key: 'showWriting' as keyof LayoutState,
      icon: FileText,
      label: 'Draft',
      active: layoutState.showWriting
    },
    {
      key: 'showChat' as keyof LayoutState,
      icon: MessageSquare,
      label: 'Agent',
      active: layoutState.showChat
    }
  ];

  return (
    <div className="flex items-center space-x-1 bg-black/5 p-1 rounded-lg">
      {layouts.map(({ key, icon: Icon, label, active }) => (
        <Button
          key={key}
          variant="ghost"
          size="sm"
          onClick={() => togglePanel(key)}
          className={cn(
            "h-8 px-3 text-xs font-serif transition-all duration-200",
            active 
              ? "bg-black text-white hover:bg-black/80" 
              : "text-black/60 hover:text-black hover:bg-black/10"
          )}
        >
          <Icon className="w-3 h-3 mr-1" />
          {label}
        </Button>
      ))}
    </div>
  );
};

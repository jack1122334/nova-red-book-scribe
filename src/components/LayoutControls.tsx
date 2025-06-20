import React, { useEffect } from 'react';
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
  xiaohongshuCardsCount?: number;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({ 
  layoutState, 
  onLayoutChange,
  xiaohongshuCardsCount = 0
}) => {
  // 监听 xiaohongshuCards 数量变化，自动展开 Draft
  useEffect(() => {
    if (xiaohongshuCardsCount > 0 && !layoutState.showWriting) {
      const newState = {
        ...layoutState,
        showWriting: true
      };
      onLayoutChange(newState);
    }
  }, [xiaohongshuCardsCount, layoutState, onLayoutChange]);

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
    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-gray-200/50 self-end gap-1">
      {layouts.map(({ key, icon: Icon, label, active }) => (
        <Button
          key={key}
          variant="ghost"
          size="sm"
          onClick={() => togglePanel(key)}
          className={cn(
            "h-8 w-8 md:w-auto md:px-3 text-xs font-serif transition-all duration-200 rounded-full md:rounded-lg",
            active
              ? "bg-black text-white hover:bg-black/80 shadow-sm"
              : "text-black/60 hover:text-black hover:bg-black/5"
          )}
        >
          <Icon className="w-4 h-4 md:mr-1" />
          <span className="hidden md:block">{label}</span>
        </Button>
      ))}
    </div>
  );
};


import React, { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sidebar, FileText, MessageSquare, Grid3X3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCardsStore } from '@/stores/cardsStore';

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
  const {
    loadProjectCards,
    currentProjectId
  } = useCardsStore();

  // 使用 ref 来跟踪之前的数量
  const prevCountRef = useRef(0);
  const hasAutoExpandedRef = useRef(false);
  
  // 监听 xiaohongshuCards 数量变化，只在从 0 变为大于 0 时自动展开 Draft
  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = xiaohongshuCardsCount;
    
    console.log('LayoutControls: Cards count change:', { prevCount, currentCount, showWriting: layoutState.showWriting, hasAutoExpanded: hasAutoExpandedRef.current });
    
    // 只有当数量从 0 变为大于 0 时，且当前 Draft 未展开时，且之前没有自动展开过时，才自动展开
    if (prevCount === 0 && currentCount > 0 && !layoutState.showWriting && !hasAutoExpandedRef.current) {
      console.log('LayoutControls: Auto-expanding Draft due to new xiaohongshu content');
      onLayoutChange({
        ...layoutState,
        showWriting: true,
      });
      hasAutoExpandedRef.current = true;
    }
    
    setTimeout(() => {
      loadProjectCards(currentProjectId)
    },200)
    // 更新之前的数量
    prevCountRef.current = currentCount;
  }, [xiaohongshuCardsCount, layoutState, onLayoutChange]);

  // 重置自动展开标记当用户手动关闭Draft时
  useEffect(() => {
    if (!layoutState.showWriting) {
      hasAutoExpandedRef.current = false;
    }
  }, [layoutState.showWriting]);

  const togglePanel = useCallback((panel: keyof LayoutState) => {
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
  }, [layoutState, onLayoutChange]);

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


import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Grid3X3 } from 'lucide-react';
import { CanvasGrid } from './CanvasArea/CanvasGrid';
import { InsightsList } from './CanvasArea/InsightsList';

export interface CanvasItem {
  id: string;
  type: 'canvas' | 'insight';
  title: string;
  content?: string;
  isSelected: boolean;
  isDisabled: boolean;
}

interface CanvasAreaProps {
  onItemSelect: (item: CanvasItem) => void;
  onItemDisable: (itemId: string) => void;
}

export interface CanvasAreaRef {
  deselectItem: (itemId: string) => void;
}

// Mock data for canvas grid (9 items, expandable to 25)
const mockCanvasItems: CanvasItem[] = Array.from({ length: 9 }, (_, index) => ({
  id: `canvas-${index + 1}`,
  type: 'canvas',
  title: `创意${index + 1}`,
  content: `创意内容${index + 1}的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-的详细描述-`,
  isSelected: false,
  isDisabled: false,
}));

// Mock data for insights
const mockInsights: CanvasItem[] = [
  {
    id: 'insight-1',
    type: 'insight',
    title: '用户画像分析',
    content: '目标用户主要为25-35岁的都市白领女性',
    isSelected: false,
    isDisabled: false,
  },
  {
    id: 'insight-2',
    type: 'insight',
    title: '内容偏好洞察',
    content: '用户更偏爱实用性强的生活技巧类内容',
    isSelected: false,
    isDisabled: false,
  },
  {
    id: 'insight-3',
    type: 'insight',
    title: '发布时间优化',
    content: '晚上8-10点发布效果最佳',
    isSelected: false,
    isDisabled: false,
  },
  {
    id: 'insight-4',
    type: 'insight',
    title: '标签策略建议',
    content: '建议使用长尾关键词提高曝光',
    isSelected: false,
    isDisabled: false,
  },
];

export const CanvasArea = forwardRef<CanvasAreaRef, CanvasAreaProps>(({ onItemSelect, onItemDisable }, ref) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(mockCanvasItems);
  const [insights, setInsights] = useState<CanvasItem[]>(mockInsights);
  const [selectedCanvasItems, setSelectedCanvasItems] = useState<Set<string>>(new Set());
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    deselectItem: (itemId: string) => {
      setCanvasItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, isSelected: false } : item
      ));
      
      setInsights(prev => prev.map(item => 
        item.id === itemId ? { ...item, isSelected: false } : item
      ));
      
      setSelectedCanvasItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      setSelectedInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }));

  const handleCanvasCheckboxChange = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedCanvasItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedCanvasItems(newSelected);
  };

  const handleInsightCheckboxChange = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedInsights);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedInsights(newSelected);
  };

  const handleCanvasBatchSelect = () => {
    selectedCanvasItems.forEach(itemId => {
      const item = canvasItems.find(i => i.id === itemId);
      if (item && !item.isDisabled) {
        const updatedItem = { ...item, isSelected: true };
        onItemSelect(updatedItem);
        setCanvasItems(prev => prev.map(i => 
          i.id === itemId ? updatedItem : i
        ));
      }
    });
    setSelectedCanvasItems(new Set());
  };

  const handleCanvasBatchDisable = () => {
    selectedCanvasItems.forEach(itemId => {
      onItemDisable(itemId);
      setCanvasItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, isDisabled: true, isSelected: false } : i
      ));
    });
    setSelectedCanvasItems(new Set());
  };

  const handleInsightBatchSelect = () => {
    selectedInsights.forEach(itemId => {
      const item = insights.find(i => i.id === itemId);
      if (item && !item.isDisabled) {
        const updatedItem = { ...item, isSelected: true };
        onItemSelect(updatedItem);
        setInsights(prev => prev.map(i => 
          i.id === itemId ? updatedItem : i
        ));
      }
    });
    setSelectedInsights(new Set());
  };

  const handleInsightBatchDisable = () => {
    selectedInsights.forEach(itemId => {
      onItemDisable(itemId);
      setInsights(prev => prev.map(i => 
        i.id === itemId ? { ...i, isDisabled: true, isSelected: false } : i
      ));
    });
    setSelectedInsights(new Set());
  };

  const handleCanvasRestore = (itemId: string) => {
    setCanvasItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, isDisabled: false } : i
    ));
  };

  const handleInsightRestore = (itemId: string) => {
    setInsights(prev => prev.map(i => 
      i.id === itemId ? { ...i, isDisabled: false } : i
    ));
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-black/10">
      {/* Header */}
      <div className="p-4 border-b border-black/10">
        <h2 className="text-lg font-semibold text-black font-serif">Canvas</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Canvas Grid Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-5 h-5 text-black" />
            <h3 className="font-medium text-black font-serif">Canvas</h3>
          </div>
          
          <CanvasGrid
            items={canvasItems}
            selectedItems={selectedCanvasItems}
            onCheckboxChange={handleCanvasCheckboxChange}
            onBatchSelect={handleCanvasBatchSelect}
            onBatchDisable={handleCanvasBatchDisable}
            onRestore={handleCanvasRestore}
          />
        </div>

        {/* Insights Section */}
        <div>
          <h3 className="font-medium text-black font-serif mb-4">Insights</h3>
          
          <InsightsList
            insights={insights}
            selectedInsights={selectedInsights}
            onCheckboxChange={handleInsightCheckboxChange}
            onBatchSelect={handleInsightBatchSelect}
            onBatchDisable={handleInsightBatchDisable}
            onRestore={handleInsightRestore}
          />
        </div>
      </div>
    </div>
  );
});

CanvasArea.displayName = "CanvasArea";

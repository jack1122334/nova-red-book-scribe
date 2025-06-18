
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Grid3X3, RotateCcw } from 'lucide-react';

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

// Mock data for canvas grid (9 items, expandable to 25)
const mockCanvasItems: CanvasItem[] = Array.from({ length: 9 }, (_, index) => ({
  id: `canvas-${index + 1}`,
  type: 'canvas',
  title: `创意${index + 1}`,
  content: `创意内容${index + 1}的详细描述`,
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

export const CanvasArea: React.FC<CanvasAreaProps> = ({ onItemSelect, onItemDisable }) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(mockCanvasItems);
  const [insights, setInsights] = useState<CanvasItem[]>(mockInsights);
  const [selectedCanvasItems, setSelectedCanvasItems] = useState<Set<string>>(new Set());
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());

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
    // 批量选中操作
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
    // 批量置灰操作
    selectedCanvasItems.forEach(itemId => {
      onItemDisable(itemId);
      setCanvasItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, isDisabled: true, isSelected: false } : i
      ));
    });
    setSelectedCanvasItems(new Set());
  };

  const handleInsightBatchSelect = () => {
    // 批量选中操作
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
    // 批量置灰操作
    selectedInsights.forEach(itemId => {
      onItemDisable(itemId);
      setInsights(prev => prev.map(i => 
        i.id === itemId ? { ...i, isDisabled: true, isSelected: false } : i
      ));
    });
    setSelectedInsights(new Set());
  };

  const handleCanvasRestore = (itemId: string) => {
    // 恢复置灰状态
    setCanvasItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, isDisabled: false } : i
    ));
  };

  const handleInsightRestore = (itemId: string) => {
    // 恢复置灰状态
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
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-5 h-5 text-black" />
            <h3 className="font-medium text-black font-serif">Canvas</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            {canvasItems.map((item) => (
              <div
                key={item.id}
                className={`relative aspect-square ${
                  item.isDisabled ? 'opacity-30' : ''
                }`}
              >
                <Card className={`h-full transition-all duration-200 ${
                  item.isSelected 
                    ? 'ring-2 ring-black bg-black/5' 
                    : 'hover:shadow-md hover:-translate-y-0.5'
                }`}>
                  <CardContent className="p-3 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <Checkbox
                        checked={selectedCanvasItems.has(item.id)}
                        onCheckedChange={(checked) => 
                          handleCanvasCheckboxChange(item.id, checked as boolean)
                        }
                        disabled={item.isDisabled}
                        className="flex-shrink-0"
                      />
                      {item.isDisabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 w-5 p-0 rounded-full hover:bg-green-50 hover:border-green-300"
                          onClick={() => handleCanvasRestore(item.id)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-sm text-center text-black font-serif">
                        {item.title}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Canvas Batch Operation Buttons */}
          {selectedCanvasItems.size > 0 && (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="default"
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleCanvasBatchSelect}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
                onClick={handleCanvasBatchDisable}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="relative">
          <h3 className="font-medium text-black font-serif mb-4">Insights</h3>
          
          <div className="space-y-3 mb-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`relative ${
                  insight.isDisabled ? 'opacity-30' : ''
                }`}
              >
                <Card className={`transition-all duration-200 ${
                  insight.isSelected 
                    ? 'ring-2 ring-black bg-black/5' 
                    : 'hover:shadow-md hover:-translate-y-0.5'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedInsights.has(insight.id)}
                        onCheckedChange={(checked) => 
                          handleInsightCheckboxChange(insight.id, checked as boolean)
                        }
                        disabled={insight.isDisabled}
                        className="flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-black font-serif mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-black/60 leading-relaxed">
                          {insight.content}
                        </p>
                      </div>
                      {insight.isDisabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 rounded-full hover:bg-green-50 hover:border-green-300 flex-shrink-0"
                          onClick={() => handleInsightRestore(insight.id)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Insights Batch Operation Buttons */}
          {selectedInsights.size > 0 && (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="default"
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleInsightBatchSelect}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
                onClick={handleInsightBatchDisable}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

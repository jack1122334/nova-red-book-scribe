
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Grid3X3 } from 'lucide-react';

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemAction = (item: CanvasItem, action: 'select' | 'disable') => {
    if (action === 'select') {
      onItemSelect(item);
      // Update the item's selected state
      if (item.type === 'canvas') {
        setCanvasItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, isSelected: !i.isSelected } : i
        ));
      } else {
        setInsights(prev => prev.map(i => 
          i.id === item.id ? { ...i, isSelected: !i.isSelected } : i
        ));
      }
    } else {
      onItemDisable(item.id);
      // Update the item's disabled state
      if (item.type === 'canvas') {
        setCanvasItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, isDisabled: true } : i
        ));
      } else {
        setInsights(prev => prev.map(i => 
          i.id === item.id ? { ...i, isDisabled: true } : i
        ));
      }
    }
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
          
          <div className="grid grid-cols-3 gap-3">
            {canvasItems.map((item) => (
              <div
                key={item.id}
                className={`relative group aspect-square ${
                  item.isDisabled ? 'opacity-30' : ''
                }`}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Card className={`h-full cursor-pointer transition-all duration-200 ${
                  item.isSelected 
                    ? 'ring-2 ring-black bg-black/5' 
                    : 'hover:shadow-md hover:-translate-y-0.5'
                }`}>
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <span className="text-sm text-center text-black font-serif">
                      {item.title}
                    </span>
                  </CardContent>
                </Card>
                
                {/* Action buttons - show on hover or when selected */}
                {(hoveredItem === item.id || item.isSelected) && !item.isDisabled && (
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant={item.isSelected ? "default" : "outline"}
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => handleItemAction(item, 'select')}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
                      onClick={() => handleItemAction(item, 'disable')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insights Section */}
        <div>
          <h3 className="font-medium text-black font-serif mb-4">Insights</h3>
          
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`relative group ${
                  insight.isDisabled ? 'opacity-30' : ''
                }`}
                onMouseEnter={() => setHoveredItem(insight.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Card className={`cursor-pointer transition-all duration-200 ${
                  insight.isSelected 
                    ? 'ring-2 ring-black bg-black/5' 
                    : 'hover:shadow-md hover:-translate-y-0.5'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-black font-serif mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-black/60 leading-relaxed">
                          {insight.content}
                        </p>
                      </div>
                      
                      {/* Action buttons - show on hover or when selected */}
                      {(hoveredItem === insight.id || insight.isSelected) && !insight.isDisabled && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant={insight.isSelected ? "default" : "outline"}
                            className="h-6 w-6 p-0 rounded-full"
                            onClick={() => handleItemAction(insight, 'select')}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
                            onClick={() => handleItemAction(insight, 'disable')}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

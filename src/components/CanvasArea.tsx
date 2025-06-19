import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Grid3X3 } from 'lucide-react';
import { CanvasGrid } from './CanvasArea/CanvasGrid';
import { InsightsList } from './CanvasArea/InsightsList';
import { bluechatApi as apiBluechat } from '@/lib/api';
import { BluechatCard } from '@/lib/bluechatApi';

export interface CanvasItem {
  id: string;
  type: 'canvas' | 'insight';
  title: string;
  content?: string;
  isSelected: boolean;
  isDisabled: boolean;
  keyword?: string;
  bluechatData?: BluechatCard;
}

interface CanvasAreaProps {
  projectId: string;
  onItemSelect: (item: CanvasItem) => void;
  onItemDisable: (itemId: string) => void;
  searchQuery?: string;
  selectedIds?: string[];
}

export interface CanvasAreaRef {
  deselectItem: (itemId: string) => void;
  searchWithQuery: (query: string) => void;
}

export const CanvasArea = forwardRef<CanvasAreaRef, CanvasAreaProps>(({ 
  projectId, 
  onItemSelect, 
  onItemDisable, 
  searchQuery,
  selectedIds = []
}, ref) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [insights, setInsights] = useState<CanvasItem[]>([]);
  const [selectedCanvasItems, setSelectedCanvasItems] = useState<Set<string>>(new Set());
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState<Set<string>>(new Set());

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
    },
    searchWithQuery: (query: string) => {
      handleSearch(query);
    }
  }));

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    console.log('Starting canvas search with query:', query);
    setIsLoading(true);
    setCanvasItems([]);
    setKeywords([]);
    setLoadingKeywords(new Set());

    try {
      await apiBluechat.searchCanvas(
        query.trim(),
        projectId,
        selectedIds,
        (response) => {
          console.log('Received response:', response);

          if ('keywords' in response) {
            console.log('Setting keywords:', response.keywords);
            setKeywords(response.keywords);
            setLoadingKeywords(new Set(response.keywords));
            
            // 为每个关键词创建空的canvas行
            const emptyItems: CanvasItem[] = [];
            response.keywords.forEach((keyword, rowIndex) => {
              for (let colIndex = 0; colIndex < 3; colIndex++) {
                emptyItems.push({
                  id: `${keyword}_${rowIndex}_${colIndex}`,
                  type: 'canvas',
                  title: '加载中...',
                  content: '',
                  isSelected: false,
                  isDisabled: false,
                  keyword
                });
              }
            });
            setCanvasItems(emptyItems);
          } 
          else if ('keyword' in response && 'cards' in response) {
            console.log('Processing cards for keyword:', response.keyword);
            setLoadingKeywords(prev => {
              const newSet = new Set(prev);
              newSet.delete(response.keyword);
              return newSet;
            });

            // 更新对应关键词的卡片
            setCanvasItems(prev => {
              const rowIndex = keywords.indexOf(response.keyword);
              if (rowIndex === -1) return prev;

              return prev.map((item, index) => {
                const itemRowIndex = Math.floor(index / 3);
                const itemColIndex = index % 3;
                
                if (itemRowIndex === rowIndex && itemColIndex < response.cards.length) {
                  const card = response.cards[itemColIndex];
                  return {
                    id: card.id,
                    type: 'canvas' as const,
                    title: card.title,
                    content: card.content || `${card.author} | 👍 ${card.like_count} 💾 ${card.collect_count}`,
                    isSelected: false,
                    isDisabled: false,
                    keyword: response.keyword,
                    bluechatData: card
                  };
                }
                return item;
              });
            });
          }
          else if ('type' in response && response.type === 'state_info') {
            console.log('Received state info:', response);
            // 处理状态信息，可以用于更新UI状态
          }
        }
      );
    } catch (error) {
      console.error('Error in canvas search:', error);
    } finally {
      setIsLoading(false);
      setLoadingKeywords(new Set());
    }
  };

  // 当searchQuery变化时自动搜索
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

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
        {isLoading && (
          <div className="text-sm text-gray-500 mt-1">正在搜索相关内容...</div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Canvas Grid Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-5 h-5 text-black" />
            <h3 className="font-medium text-black font-serif">Canvas</h3>
            {keywords.length > 0 && (
              <div className="text-sm text-gray-500">
                ({keywords.length} 个关键词)
              </div>
            )}
          </div>
          
          {keywords.length > 0 && (
            <div className="mb-3 text-xs text-gray-600">
              {keywords.map((keyword, index) => (
                <div key={keyword} className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 bg-gray-100 rounded text-center leading-6">
                    {index + 1}
                  </span>
                  <span>{keyword}</span>
                  {loadingKeywords.has(keyword) && (
                    <span className="animate-pulse text-blue-500">加载中...</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
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

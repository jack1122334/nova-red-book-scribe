import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Grid3X3 } from 'lucide-react';
import { CanvasGrid } from './CanvasArea/CanvasGrid';
import { InsightsList } from './CanvasArea/InsightsList';
import { canvasApi } from '@/lib/canvasApi';
import { useToast } from '@/hooks/use-toast';

export interface CanvasItem {
  id: string;
  type: 'canvas' | 'insight';
  title: string;
  content?: string;
  isSelected: boolean;
  isDisabled: boolean;
  keyword?: string;
  author?: string;
  author_avatar?: string;
  like_count?: number;
  collect_count?: number;
  comment_count?: number;
  share_count?: number;
  cover_url?: string;
  url?: string;
  platform?: string;
  ip_location?: string;
  tags?: string[];
  create_time?: string;
  isLoading?: boolean;
}

interface CanvasAreaProps {
  projectId: string;
  onItemSelect: (item: CanvasItem) => void;
  onItemDisable: (itemId: string) => void;
  onCanvasDataReceived?: (data: any) => void;
}

export interface CanvasAreaRef {
  deselectItem: (itemId: string) => void;
  processCanvasData: (data: any) => void;
}

export const CanvasArea = forwardRef<CanvasAreaRef, CanvasAreaProps>(({ 
  projectId,
  onItemSelect, 
  onItemDisable,
  onCanvasDataReceived 
}, ref) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [insights, setInsights] = useState<CanvasItem[]>([]);
  const [selectedCanvasItems, setSelectedCanvasItems] = useState<Set<string>>(new Set());
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        
        // Load canvas items
        const canvasData = await canvasApi.getCanvasItems(projectId);
        console.log('Loaded canvas items:', canvasData.length);
        
        if (canvasData.length > 0) {
          // Extract unique keywords
          const uniqueKeywords = Array.from(new Set(
            canvasData.map(item => item.keyword).filter(Boolean)
          ));
          setKeywords(uniqueKeywords);
          
          // Transform database items to component format
          const transformedItems: CanvasItem[] = canvasData.map(item => ({
            id: item.id,
            type: 'canvas' as const,
            title: item.title,
            content: item.content || '',
            isSelected: false,
            isDisabled: false,
            keyword: item.keyword || '',
            author: item.author || '',
            author_avatar: item.author_avatar || '',
            like_count: item.like_count || 0,
            collect_count: item.collect_count || 0,
            comment_count: item.comment_count || 0,
            share_count: item.share_count || 0,
            cover_url: item.cover_url || '',
            url: item.url || '',
            platform: item.platform || 'xiaohongshu',
            ip_location: item.ip_location || '',
            tags: item.tags || [],
            create_time: item.create_time || '',
            isLoading: false
          }));
          
          setCanvasItems(transformedItems);
        }
        
        // Load insights
        const insightsData = await canvasApi.getInsights(projectId);
        console.log('Loaded insights:', insightsData.length);
        
        if (insightsData.length > 0) {
          // Transform database items to component format
          const transformedInsights: CanvasItem[] = insightsData.map(item => ({
            id: item.id,
            type: 'insight' as const,
            title: item.title,
            content: item.content,
            isSelected: false,
            isDisabled: false,
            isLoading: false
          }));
          
          setInsights(transformedInsights);
        }
        
      } catch (error) {
        console.error('Failed to load existing canvas data:', error);
        toast({
          title: "加载失败",
          description: "无法加载Canvas数据",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, [projectId, toast]);

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
    
    processCanvasData: (data: any) => {
      console.log('Processing canvas data:', data);
      
      if (data.keywords) {
        console.log('Setting keywords:', data.keywords);
        setKeywords(data.keywords);
        
        // Initialize loading placeholders for each keyword (3x3 grid)
        const placeholders: CanvasItem[] = [];
        data.keywords.forEach((keyword: string, keywordIndex: number) => {
          for (let i = 0; i < 3; i++) {
            placeholders.push({
              id: `placeholder-${keywordIndex}-${i}`,
              type: 'canvas',
              title: `${keyword} - 加载中...`,
              content: '',
              isSelected: false,
              isDisabled: false,
              keyword,
              isLoading: true
            });
          }
        });
        
        setCanvasItems(placeholders);
      }
      
      if (data.keyword && data.cards) {
        console.log('Updating cards for keyword:', data.keyword, data.cards);
        
        // 标准化关键词匹配逻辑
        const normalizeKeyword = (kw: string) => {
          return kw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
        };
        
        const normalizedDataKeyword = normalizeKeyword(data.keyword);
        
        // 查找匹配的关键词索引
        let keywordIndex = keywords.findIndex(keyword => {
          const normalizedKeyword = normalizeKeyword(keyword);
          console.log('Comparing keywords:', { normalizedDataKeyword, normalizedKeyword });
          return normalizedDataKeyword === normalizedKeyword;
        });
        
        console.log('Keyword matching result:', { 
          dataKeyword: data.keyword, 
          normalizedDataKeyword,
          keywords, 
          keywordIndex 
        });
        
        if (keywordIndex === -1) {
          console.warn('Keyword not found in keywords array:', data.keyword);
          // 尝试模糊匹配
          keywordIndex = keywords.findIndex(keyword => {
            const normalizedKeyword = normalizeKeyword(keyword);
            return normalizedKeyword.includes(normalizedDataKeyword) || 
                   normalizedDataKeyword.includes(normalizedKeyword);
          });
          
          if (keywordIndex === -1) {
            console.error('Could not match keyword even with fuzzy matching');
            return;
          } else {
            console.log('Found keyword with fuzzy matching at index:', keywordIndex);
          }
        }
        
        setCanvasItems(prev => {
          const newItems = [...prev];
          
          data.cards.forEach((card: any, cardIndex: number) => {
            const gridPosition = keywordIndex * 3 + cardIndex;
            
            console.log('Placing card at position:', gridPosition, 'for keyword index:', keywordIndex, 'card index:', cardIndex);
            
            if (gridPosition < newItems.length) {
              newItems[gridPosition] = {
                id: card.id,
                type: 'canvas',
                title: card.title,
                content: card.content || '',
                isSelected: false,
                isDisabled: false,
                keyword: data.keyword,
                author: card.author,
                like_count: card.like_count,
                collect_count: card.collect_count,
                comment_count: card.comment_count,
                cover_url: card.cover_url,
                url: card.url,
                isLoading: false
              };
            }
          });
          
          console.log('Updated canvas items:', newItems.map(item => ({ 
            id: item.id, 
            title: item.title, 
            isLoading: item.isLoading,
            keyword: item.keyword 
          })));
          return newItems;
        });
      }
      
      if (data.type === 'state_info') {
        console.log('Received state info:', data);
        // Handle final state information if needed
      }
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

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white border-r border-black/10">
        <div className="p-4 border-b border-black/10">
          <h2 className="text-lg font-semibold text-black font-serif">Canvas</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-black/10 border-t-black rounded-full" />
        </div>
      </div>
    );
  }

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
            {/* {keywords.length > 0 && (
              <span className="text-xs text-black/50">
                ({keywords.map((keyword) => keyword.slice(0, 24)).join(", ")})
              </span>
            )} */}
          </div>

          <CanvasGrid
            items={canvasItems}
            selectedItems={selectedCanvasItems}
            onCheckboxChange={handleCanvasCheckboxChange}
            onBatchSelect={handleCanvasBatchSelect}
            onBatchDisable={handleCanvasBatchDisable}
            onRestore={handleCanvasRestore}
            keywords={keywords}
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

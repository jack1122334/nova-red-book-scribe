import React, { useImperativeHandle, forwardRef, useEffect } from 'react';
import { Grid3X3, Lightbulb } from 'lucide-react';
import { CanvasGrid } from './CanvasArea/CanvasGrid';
import { InsightsList } from './CanvasArea/InsightsList';
import { useToast } from '@/hooks/use-toast';
import { useCanvasStore, type CanvasItem } from '@/stores/canvasStore';

interface CanvasAreaProps {
  projectId: string;
  onItemSelect: (item: CanvasItem) => void;
  onItemDisable: (itemId: string) => void;
  onCanvasDataReceived?: (data: Record<string, unknown>) => void;
}

export interface CanvasAreaRef {
  deselectItem: (itemId: string) => void;
  processCanvasData: (data: Record<string, unknown>) => void;
}

export const CanvasArea = forwardRef<CanvasAreaRef, CanvasAreaProps>(({ 
  projectId,
  onItemSelect, 
  onItemDisable,
  onCanvasDataReceived 
}, ref) => {
  const { toast } = useToast();
  
  // 使用Zustand store
  const {
    canvasItems,
    insights,
    keywords,
    loading,
    selectedCanvasItems,
    selectedInsights,
    canvasReferences,
    loadProjectData,
    processStreamData,
    toggleCanvasSelection,
    toggleInsightSelection,
    batchSelectCanvas,
    batchDisableCanvas,
    batchSelectInsights,
    batchDisableInsights,
    restoreCanvasItem,
    restoreInsight,
    addToCanvasReferences,
    removeFromCanvasReferences,
    reset,
    setCurrentProject
  } = useCanvasStore();

  // Load existing data on mount
  useEffect(() => {
    if (!projectId) return;
    
    const loadData = async () => {
      try {
        setCurrentProject(projectId);
        await loadProjectData(projectId);
      } catch (error) {
        console.error('Failed to load canvas data:', error);
        toast({
          title: "加载失败",
          description: "无法加载Canvas数据",
          variant: "destructive"
        });
      }
    };

    loadData();
  }, [projectId, setCurrentProject, loadProjectData, toast]);

  useImperativeHandle(ref, () => ({
    deselectItem: (itemId: string) => {
      // 通过store方法来取消选择
      const canvasItem = canvasItems.find(item => item.id === itemId);
      const insightItem = insights.find(item => item.id === itemId);
      
      if (canvasItem && canvasItem.isSelected) {
        toggleCanvasSelection(itemId);
      }
      if (insightItem && insightItem.isSelected) {
        toggleInsightSelection(itemId);
      }
    },
    
    processCanvasData: (data: Record<string, unknown>) => {
      console.log('Processing canvas data via store:', data);
      processStreamData(data);
    }
  }));

  const handleCanvasCheckboxChange = (itemId: string, checked: boolean) => {
    toggleCanvasSelection(itemId);
  };

  const handleInsightCheckboxChange = (itemId: string, checked: boolean) => {
    toggleInsightSelection(itemId);
  };

  const handleCanvasBatchSelect = () => {
    const selectedIds = Array.from(selectedCanvasItems);
    selectedIds.forEach(itemId => {
      const item = canvasItems.find(i => i.id === itemId);
      if (item && !item.isDisabled) {
        addToCanvasReferences(item);
      }
    });
    // 清空勾选状态
    batchSelectCanvas(selectedIds);
  };

  const handleCanvasBatchDisable = () => {
    const selectedIds = Array.from(selectedCanvasItems);
    selectedIds.forEach(itemId => {
      removeFromCanvasReferences(itemId);
    });
    batchDisableCanvas(selectedIds);
  };

  const handleInsightBatchSelect = () => {
    const selectedIds = Array.from(selectedInsights);
    selectedIds.forEach(itemId => {
      const item = insights.find(i => i.id === itemId);
      if (item && !item.isDisabled) {
        addToCanvasReferences(item);
      }
    });
    // 清空勾选状态
    batchSelectInsights(selectedIds);
  };

  const handleInsightBatchDisable = () => {
    const selectedIds = Array.from(selectedInsights);
    selectedIds.forEach(itemId => {
      removeFromCanvasReferences(itemId);
    });
    batchDisableInsights(selectedIds);
  };

  const handleCanvasRestore = (itemId: string) => {
    restoreCanvasItem(itemId);
  };

  const handleInsightRestore = (itemId: string) => {
    restoreInsight(itemId);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[#f37021] border-r border-black/10">
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
    <div className="h-full flex flex-col bg-[#f37021] border-r border-black/10">
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
            canvasReferences={canvasReferences}
            onCheckboxChange={handleCanvasCheckboxChange}
            onBatchSelect={handleCanvasBatchSelect}
            onBatchDisable={handleCanvasBatchDisable}
            onRestore={handleCanvasRestore}
            keywords={keywords}
          />
        </div>

        {/* Insights Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-black" />
            <h3 className="font-medium text-black font-serif">Insights</h3>
          </div>

          <InsightsList
            insights={insights}
            selectedInsights={selectedInsights}
            canvasReferences={canvasReferences}
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

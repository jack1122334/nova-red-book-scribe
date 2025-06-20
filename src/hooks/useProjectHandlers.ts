
import { CanvasItem } from "@/stores/canvasStore";

interface LayoutState {
  showCanvas: boolean;
  showWriting: boolean;
  showChat: boolean;
}

interface UseProjectHandlersProps {
  writingAreaRef: React.RefObject<any>;
  chatAreaRef: React.RefObject<any>;
  canvasAreaRef: React.RefObject<any>;
  layoutState: LayoutState;
  setLayoutState: React.Dispatch<React.SetStateAction<LayoutState>>;
  setHasDraftData: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useProjectHandlers = ({
  writingAreaRef,
  chatAreaRef,
  canvasAreaRef,
  layoutState,
  setLayoutState,
  setHasDraftData
}: UseProjectHandlersProps) => {
  const handleCardCreated = async (cardId: string, title: string, content: string) => {
    if (writingAreaRef.current?.addCardFromAgent) {
      await writingAreaRef.current.addCardFromAgent(title, content);
    }
    
    if (!layoutState.showWriting) {
      setLayoutState(prev => ({ ...prev, showWriting: true }));
      setHasDraftData(true);
    }
  };

  const handleCardUpdated = async (cardTitle: string, content: string) => {
    if (writingAreaRef.current?.updateCardFromAgent) {
      await writingAreaRef.current.updateCardFromAgent(cardTitle, content);
    }
  };

  const handleTextSelection = (cardId: string, selectedText: string, instruction: string) => {
    console.log('Text selection:', { cardId, selectedText, instruction });
  };

  const handleCardUpdate = (cardId: string, content: string, title?: string) => {
    console.log('Card updated:', { cardId, content, title });
    if (chatAreaRef.current?.notifyCardUpdate) {
      chatAreaRef.current.notifyCardUpdate(cardId, content, title);
    }
  };

  const handleCardCreate = (cardId: string) => {
    console.log('Card created:', { cardId });
    if (chatAreaRef.current?.notifyCardCreate) {
      chatAreaRef.current.notifyCardCreate(cardId);
    }
  };

  const handleAddReference = (reference: any) => {
    if (chatAreaRef.current?.addReference) {
      chatAreaRef.current.addReference(reference);
    }
  };

  const handleCanvasItemSelect = (item: CanvasItem) => {
    console.log('Canvas item selected:', item);
    // Canvas 选择状态现在由 Canvas Store 管理
    // 这里只需要记录日志，实际的选择状态由 store 处理
  };

  const handleCanvasItemDisable = (itemId: string) => {
    console.log('Canvas item disabled:', itemId);
    // Canvas 禁用状态现在由 Canvas Store 管理
    // 如果需要取消选择，可以通过 CanvasArea ref 来处理
    if (canvasAreaRef.current?.deselectItem) {
      canvasAreaRef.current.deselectItem(itemId);
    }
  };

  // 新增处理流数据接收的方法
  const handleCanvasDataReceived = (data: Record<string, unknown>) => {
    console.log('Canvas data received:', data);
    if (canvasAreaRef.current?.processCanvasData) {
      canvasAreaRef.current.processCanvasData(data);
    }
  };

  return {
    handleCardCreated,
    handleCardUpdated,
    handleTextSelection,
    handleCardUpdate,
    handleCardCreate,
    handleAddReference,
    handleCanvasItemSelect,
    handleCanvasItemDisable,
    handleCanvasDataReceived
  };
};

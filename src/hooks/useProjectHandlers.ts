
import { CanvasItem } from "@/components/CanvasArea";

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
  canvasReferences: CanvasItem[];
  setCanvasReferences: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
}

export const useProjectHandlers = ({
  writingAreaRef,
  chatAreaRef,
  canvasAreaRef,
  layoutState,
  setLayoutState,
  setHasDraftData,
  canvasReferences,
  setCanvasReferences
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
    if (item.isSelected) {
      setCanvasReferences(prev => [...prev, item]);
    } else {
      setCanvasReferences(prev => prev.filter(ref => ref.id !== item.id));
    }
  };

  const handleCanvasItemDisable = (itemId: string) => {
    console.log('Canvas item disabled:', itemId);
    setCanvasReferences(prev => prev.filter(ref => ref.id !== itemId));
  };

  const handleRemoveCanvasReference = (itemId: string) => {
    setCanvasReferences(prev => prev.filter(ref => ref.id !== itemId));
    if (canvasAreaRef.current?.deselectItem) {
      canvasAreaRef.current.deselectItem(itemId);
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
    handleRemoveCanvasReference
  };
};

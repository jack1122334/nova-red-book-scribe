
import { useState, useEffect, useRef } from "react";
import { Project } from "@/pages/Creation";
import { CanvasItem } from "@/components/CanvasArea";
import { WorkbenchHeader } from "@/components/WorkbenchHeader";
import { WorkbenchContent } from "@/components/WorkbenchContent";

interface ProjectWorkbenchProps {
  project: Project | null;
  onBack: () => void;
  initialMessage?: string;
}

interface LayoutState {
  showCanvas: boolean;
  showWriting: boolean;
  showChat: boolean;
}

export const ProjectWorkbench = ({
  project,
  onBack,
  initialMessage
}: ProjectWorkbenchProps) => {
  const writingAreaRef = useRef<any>(null);
  const chatAreaRef = useRef<any>(null);
  const canvasAreaRef = useRef<any>(null);
  const [canvasReferences, setCanvasReferences] = useState<CanvasItem[]>([]);
  const [hasCanvasData, setHasCanvasData] = useState(true); // TODO: 根据实际数据判断
  const [hasDraftData, setHasDraftData] = useState(false);
  const [layoutState, setLayoutState] = useState<LayoutState>({
    showCanvas: true,
    showWriting: true,
    showChat: true
  });

  // 根据数据状态设置默认布局
  useEffect(() => {
    const defaultLayout = {
      showCanvas: hasCanvasData,
      showWriting: hasDraftData,
      showChat: true // Agent 默认显示
    };
    
    // 至少保留一个区域
    const visibleCount = Object.values(defaultLayout).filter(Boolean).length;
    if (visibleCount === 0) {
      defaultLayout.showChat = true;
    }
    
    setLayoutState(defaultLayout);
  }, [hasCanvasData, hasDraftData]);

  // Add debugging for project data
  console.log('ProjectWorkbench - project:', project);
  console.log('ProjectWorkbench - project.user_background:', project?.user_background);

  if (!project) return null;

  const handleCardCreated = async (cardId: string, title: string, content: string) => {
    // 通知WritingArea添加新卡片
    if (writingAreaRef.current?.addCardFromAgent) {
      await writingAreaRef.current.addCardFromAgent(title, content);
    }
    
    // 显示Draft区域
    if (!layoutState.showWriting) {
      setLayoutState(prev => ({ ...prev, showWriting: true }));
      setHasDraftData(true);
    }
  };

  const handleCardUpdated = async (cardTitle: string, content: string) => {
    // 通知WritingArea更新卡片
    if (writingAreaRef.current?.updateCardFromAgent) {
      await writingAreaRef.current.updateCardFromAgent(cardTitle, content);
    }
  };

  const handleTextSelection = (cardId: string, selectedText: string, instruction: string) => {
    // 将文本选择请求发送给ChatArea
    console.log('Text selection:', {
      cardId,
      selectedText,
      instruction
    });
    // TODO: 实现文本选择处理逻辑
  };

  const handleCardUpdate = (cardId: string, content: string, title?: string) => {
    console.log('Card updated:', {
      cardId,
      content,
      title
    });
    // 通知ChatArea用户编辑了卡片
    if (chatAreaRef.current?.notifyCardUpdate) {
      chatAreaRef.current.notifyCardUpdate(cardId, content, title);
    }
  };

  const handleCardCreate = (cardId: string) => {
    console.log('Card created:', {
      cardId
    });
    // 通知ChatArea用户创建了新卡片
    if (chatAreaRef.current?.notifyCardCreate) {
      chatAreaRef.current.notifyCardCreate(cardId);
    }
  };

  const handleAddReference = (reference: any) => {
    // 将引用添加到ChatArea
    if (chatAreaRef.current?.addReference) {
      chatAreaRef.current.addReference(reference);
    }
  };

  const handleCanvasItemSelect = (item: CanvasItem) => {
    console.log('Canvas item selected:', item);
    if (item.isSelected) {
      // 添加到引用列表
      setCanvasReferences(prev => [...prev, item]);
    } else {
      // 从引用列表移除
      setCanvasReferences(prev => prev.filter(ref => ref.id !== item.id));
    }
  };

  const handleCanvasItemDisable = (itemId: string) => {
    console.log('Canvas item disabled:', itemId);
    // 从引用列表移除（如果存在）
    setCanvasReferences(prev => prev.filter(ref => ref.id !== itemId));
  };

  const handleRemoveCanvasReference = (itemId: string) => {
    setCanvasReferences(prev => prev.filter(ref => ref.id !== itemId));
    // 通知CanvasArea取消选中状态
    if (canvasAreaRef.current?.deselectItem) {
      canvasAreaRef.current.deselectItem(itemId);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <WorkbenchHeader 
        project={project}
        layoutState={layoutState}
        onBack={onBack}
        onLayoutChange={setLayoutState}
      />

      <WorkbenchContent 
        project={project}
        layoutState={layoutState}
        canvasReferences={canvasReferences}
        initialMessage={initialMessage}
        writingAreaRef={writingAreaRef}
        chatAreaRef={chatAreaRef}
        canvasAreaRef={canvasAreaRef}
        onLayoutChange={setLayoutState}
        onCardCreated={handleCardCreated}
        onCardUpdated={handleCardUpdated}
        onTextSelection={handleTextSelection}
        onCardUpdate={handleCardUpdate}
        onCardCreate={handleCardCreate}
        onAddReference={handleAddReference}
        onCanvasItemSelect={handleCanvasItemSelect}
        onCanvasItemDisable={handleCanvasItemDisable}
        onRemoveCanvasReference={handleRemoveCanvasReference}
      />
    </div>
  );
};

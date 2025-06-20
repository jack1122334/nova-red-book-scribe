import { useState, useEffect, useRef } from "react";
import { Project } from "@/pages/Creation";
import { WorkbenchHeader } from "@/components/WorkbenchHeader";
import { WorkbenchContent } from "@/components/WorkbenchContent";
import { useProjectData } from "@/hooks/useProjectData";
import { useProjectHandlers } from "@/hooks/useProjectHandlers";
import { useProjectStore } from "@/stores/projectStore";

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
  const { currentProject } = useProjectStore();
  
  // 使用传入的 project 或者从状态管理获取的 currentProject
  const activeProject = project || currentProject;
  
  const { hasCanvasData, hasDraftData, setHasDraftData } = useProjectData(activeProject?.id);
  
  // 默认显示 Canvas 和 Chat，隐藏 Writing
  const [layoutState, setLayoutState] = useState<LayoutState>({
    showCanvas: true,
    showWriting: false,
    showChat: true
  });

  // 根据数据状态设置默认布局 - 但保持默认的 Canvas + Chat 布局
  useEffect(() => {
    const defaultLayout = {
      showCanvas: true, // 默认显示 Canvas
      showWriting: hasDraftData, // 只有当有草稿数据时才显示 Writing
      showChat: true // 默认显示 Chat
    };
    
    // 至少保留一个区域
    const visibleCount = Object.values(defaultLayout).filter(Boolean).length;
    if (visibleCount === 0) {
      defaultLayout.showChat = true;
    }
    
    setLayoutState(defaultLayout);
  }, [hasDraftData]); // 移除了 hasCanvasData 的依赖，因为我们总是默认显示 Canvas

  const handlers = useProjectHandlers({
    writingAreaRef,
    chatAreaRef,
    canvasAreaRef,
    layoutState,
    setLayoutState,
    setHasDraftData
  });

  if (!activeProject) return null;

  return (
    <div className="h-screen flex flex-col bg-white">
      <WorkbenchHeader 
        project={activeProject}
        layoutState={layoutState}
        onBack={onBack}
        onLayoutChange={setLayoutState}
      />

      <WorkbenchContent 
        project={activeProject}
        layoutState={layoutState}
        initialMessage={initialMessage}
        writingAreaRef={writingAreaRef}
        chatAreaRef={chatAreaRef}
        canvasAreaRef={canvasAreaRef}
        onLayoutChange={setLayoutState}
        onCardCreated={handlers.handleCardCreated}
        onCardUpdated={handlers.handleCardUpdated}
        onTextSelection={handlers.handleTextSelection}
        onCardUpdate={handlers.handleCardUpdate}
        onCardCreate={handlers.handleCardCreate}
        onAddReference={handlers.handleAddReference}
        onCanvasItemSelect={handlers.handleCanvasItemSelect}
        onCanvasItemDisable={handlers.handleCanvasItemDisable}
      />
    </div>
  );
};

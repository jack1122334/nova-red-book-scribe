
import { useState, useEffect, useRef } from "react";
import { Project } from "@/pages/Creation";
import { CanvasItem } from "@/components/CanvasArea";
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
  const [canvasReferences, setCanvasReferences] = useState<CanvasItem[]>([]);
  const { currentProject } = useProjectStore();
  
  // 使用传入的 project 或者从状态管理获取的 currentProject
  const activeProject = project || currentProject;
  
  const { hasCanvasData, hasDraftData, setHasDraftData } = useProjectData(activeProject?.id);
  
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

  const handlers = useProjectHandlers({
    writingAreaRef,
    chatAreaRef,
    canvasAreaRef,
    layoutState,
    setLayoutState,
    setHasDraftData,
    canvasReferences,
    setCanvasReferences
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
        canvasReferences={canvasReferences}
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
        onRemoveCanvasReference={handlers.handleRemoveCanvasReference}
      />
    </div>
  );
};

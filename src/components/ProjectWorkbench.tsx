
import { useState, useEffect, useRef } from "react";
import { Project } from "@/pages/Creation";
import { CanvasItem } from "@/components/CanvasArea";
import { WorkbenchHeader } from "@/components/WorkbenchHeader";
import { WorkbenchContent } from "@/components/WorkbenchContent";
import { useProjectData } from "@/hooks/useProjectData";
import { useProjectHandlers } from "@/hooks/useProjectHandlers";

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
  
  const { hasCanvasData, hasDraftData, draftCount, userClosedDraft, setHasDraftData, setUserClosedDraft } = useProjectData(project?.id);
  
  const [layoutState, setLayoutState] = useState<LayoutState>({
    showCanvas: true,
    showWriting: true,
    showChat: true
  });

  // Set default layout based on data state and user preferences
  useEffect(() => {
    const defaultLayout = {
      showCanvas: hasCanvasData,
      showWriting: hasDraftData && !userClosedDraft, // Respect user's manual close action
      showChat: true // Agent always defaults to show
    };
    
    // Ensure at least one area is visible
    const visibleCount = Object.values(defaultLayout).filter(Boolean).length;
    if (visibleCount === 0) {
      defaultLayout.showChat = true;
    }
    
    setLayoutState(defaultLayout);
  }, [hasCanvasData, hasDraftData, userClosedDraft]);

  // When draft count increases and user hasn't manually closed it, expand draft area
  useEffect(() => {
    if (hasDraftData && !userClosedDraft && !layoutState.showWriting) {
      setLayoutState(prev => ({ ...prev, showWriting: true }));
    }
  }, [draftCount, hasDraftData, userClosedDraft, layoutState.showWriting]);

  const handlers = useProjectHandlers({
    writingAreaRef,
    chatAreaRef,
    canvasAreaRef,
    layoutState,
    setLayoutState,
    setHasDraftData,
    canvasReferences,
    setCanvasReferences,
    setUserClosedDraft
  });

  if (!project) return null;

  return (
    <div className="h-screen flex flex-col bg-white">
      <WorkbenchHeader 
        project={project}
        layoutState={layoutState}
        onBack={onBack}
        onLayoutChange={setLayoutState}
        onUserToggleDraft={setUserClosedDraft}
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
        onCardCreated={handlers.handleCardCreated}
        onCardUpdated={handlers.handleCardUpdated}
        onTextSelection={handlers.handleTextSelection}
        onCardUpdate={handlers.handleCardUpdate}
        onCardCreate={handlers.handleCardCreate}
        onAddReference={handlers.handleAddReference}
        onCanvasItemSelect={handlers.handleCanvasItemSelect}
        onCanvasItemDisable={handlers.handleCanvasItemDisable}
        onRemoveCanvasReference={handlers.handleRemoveCanvasReference}
        onUserToggleDraft={setUserClosedDraft}
      />
    </div>
  );
};

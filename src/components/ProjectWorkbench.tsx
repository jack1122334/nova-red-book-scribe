
import React, { useRef, useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { CanvasArea } from "./CanvasArea";
import { WritingArea } from "./WritingArea";
import { ChatArea } from "./ChatArea";
import { WorkbenchHeader } from "./WorkbenchHeader";
import { LayoutControls } from "./LayoutControls";
import { useProjectHandlers } from "@/hooks/useProjectHandlers";

interface ProjectWorkbenchProps {
  projectId: string;
  initialMessage?: string;
}

export const ProjectWorkbench: React.FC<ProjectWorkbenchProps> = ({
  projectId,
  initialMessage
}) => {
  const writingAreaRef = useRef(null);
  const chatAreaRef = useRef(null);
  const canvasAreaRef = useRef(null);
  
  const [hasDraftData, setHasDraftData] = useState(false);
  const [layoutState, setLayoutState] = useState({
    showCanvas: true,
    showWriting: hasDraftData,
    showChat: true
  });

  const {
    handleCardCreated,
    handleCardUpdated,
    handleTextSelection,
    handleCardUpdate,
    handleCardCreate,
    handleAddReference,
    handleCanvasItemSelect,
    handleCanvasItemDisable,
    handleCanvasDataReceived
  } = useProjectHandlers({
    writingAreaRef,
    chatAreaRef,
    canvasAreaRef,
    layoutState,
    setLayoutState,
    setHasDraftData
  });

  const visiblePanels = [
    layoutState.showCanvas && 'canvas',
    layoutState.showWriting && 'writing',
    layoutState.showChat && 'chat'
  ].filter(Boolean);

  const panelCount = visiblePanels.length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <WorkbenchHeader 
        project={{ 
          id: projectId, 
          title: "项目工作台", 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString() 
        }} 
        layoutState={layoutState}
        onBack={() => {}}
        onLayoutChange={setLayoutState}
        hasDraftData={hasDraftData}
      />
      
      <div className="flex-1 flex flex-col">
        <LayoutControls 
          layoutState={layoutState}
          onLayoutChange={setLayoutState}
          hasDraftData={hasDraftData}
        />

        <div className="flex-1">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {layoutState.showCanvas && (
              <>
                <ResizablePanel 
                  defaultSize={panelCount === 3 ? 25 : panelCount === 2 ? 40 : 100}
                  minSize={20}
                  className="bg-white"
                >
                  <CanvasArea
                    ref={canvasAreaRef}
                    projectId={projectId}
                    onItemSelect={handleCanvasItemSelect}
                    onItemDisable={handleCanvasItemDisable}
                    onCanvasDataReceived={handleCanvasDataReceived}
                  />
                </ResizablePanel>
                {(layoutState.showWriting || layoutState.showChat) && (
                  <ResizableHandle withHandle />
                )}
              </>
            )}

            {layoutState.showWriting && (
              <>
                <ResizablePanel 
                  defaultSize={panelCount === 3 ? 35 : panelCount === 2 ? 60 : 100}
                  minSize={20}
                  className="bg-gray-50"
                >
                  <WritingArea
                    ref={writingAreaRef}
                    projectId={projectId}
                    onCardUpdate={handleCardUpdate}
                    onCardCreate={handleCardCreate}
                    onTextSelect={handleTextSelection}
                    onAddReference={handleAddReference}
                  />
                </ResizablePanel>
                {layoutState.showChat && <ResizableHandle withHandle />}
              </>
            )}

            {layoutState.showChat && (
              <ResizablePanel 
                defaultSize={panelCount === 3 ? 40 : panelCount === 2 ? 60 : 100}
                minSize={20}
                className="bg-white"
              >
                <ChatArea
                  ref={chatAreaRef}
                  projectId={projectId}
                  initialMessage={initialMessage}
                  onCardCreated={handleCardCreated}
                  onCardUpdated={handleCardUpdated}
                  onCanvasDataReceived={handleCanvasDataReceived}
                  writingAreaRef={writingAreaRef}
                />
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

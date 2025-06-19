import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Project } from "@/pages/Creation";
import { WritingArea } from "@/components/WritingArea";
import { ChatArea } from "@/components/ChatArea";
import { CanvasArea, CanvasItem } from "@/components/CanvasArea";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutState {
  showCanvas: boolean;
  showWriting: boolean;
  showChat: boolean;
}

interface WorkbenchContentProps {
  project: Project;
  layoutState: LayoutState;
  canvasReferences: CanvasItem[];
  initialMessage?: string;
  writingAreaRef: React.RefObject<any>;
  chatAreaRef: React.RefObject<any>;
  canvasAreaRef: React.RefObject<any>;
  onLayoutChange: (state: LayoutState) => void;
  onCardCreated: (cardId: string, title: string, content: string) => Promise<void>;
  onCardUpdated: (cardTitle: string, content: string) => Promise<void>;
  onTextSelection: (cardId: string, selectedText: string, instruction: string) => void;
  onCardUpdate: (cardId: string, content: string, title?: string) => void;
  onCardCreate: (cardId: string) => void;
  onAddReference: (reference: any) => void;
  onCanvasItemSelect: (item: CanvasItem) => void;
  onCanvasItemDisable: (itemId: string) => void;
  onRemoveCanvasReference: (itemId: string) => void;
}

export const WorkbenchContent: React.FC<WorkbenchContentProps> = ({
  project,
  layoutState,
  canvasReferences,
  initialMessage,
  writingAreaRef,
  chatAreaRef,
  canvasAreaRef,
  onLayoutChange,
  onCardCreated,
  onCardUpdated,
  onTextSelection,
  onCardUpdate,
  onCardCreate,
  onAddReference,
  onCanvasItemSelect,
  onCanvasItemDisable,
  onRemoveCanvasReference
}) => {
  const togglePanel = (panel: keyof LayoutState) => {
    const newState = {
      ...layoutState,
      [panel]: !layoutState[panel]
    };
    
    // 至少保留一个布局区域
    const visiblePanels = Object.values(newState).filter(Boolean).length;
    if (visiblePanels === 0) {
      return;
    }
    
    onLayoutChange(newState);
  };

  const getVisiblePanelsCount = () => {
    return Object.values(layoutState).filter(Boolean).length;
  };

  const getPanelSize = () => {
    const visibleCount = getVisiblePanelsCount();
    if (visibleCount === 1) return 100;
    if (visibleCount === 2) return 50;
    return 33.33;
  };

  const handleCanvasDataReceived = (data: any) => {
    if (canvasAreaRef.current?.processCanvasData) {
      canvasAreaRef.current.processCanvasData(data);
    }
  };

  return (
    <div className="flex-1 min-h-0 pl-0 md:pl-16">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Canvas Area - Left */}
        <AnimatePresence>
          {layoutState.showCanvas && (
            <ResizablePanel defaultSize={getPanelSize()} minSize={20} maxSize={50}>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanel('showCanvas')}
                  className="absolute top-2 right-2 z-10 h-6 w-6 p-0 text-black/40 hover:text-black"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CanvasArea 
                  ref={canvasAreaRef}
                  projectId={project.id}
                  onItemSelect={onCanvasItemSelect}
                  onItemDisable={onCanvasItemDisable}
                />
              </motion.div>
            </ResizablePanel>
          )}
        </AnimatePresence>
        
        {/* Resizable Handle between Canvas and Writing */}
        {layoutState.showCanvas && (layoutState.showWriting || layoutState.showChat) && (
          <ResizableHandle />
        )}
        
        {/* Writing Area - Middle */}
        <AnimatePresence>
          {layoutState.showWriting && (
            <ResizablePanel defaultSize={getPanelSize()} minSize={30}>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanel('showWriting')}
                  className="absolute top-2 right-2 z-10 h-6 w-6 p-0 text-black/40 hover:text-black"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <WritingArea 
                  ref={writingAreaRef} 
                  projectId={project.id} 
                  onCardUpdate={onCardUpdate} 
                  onCardCreate={onCardCreate} 
                  onTextSelect={onTextSelection} 
                  onAddReference={onAddReference} 
                />
              </motion.div>
            </ResizablePanel>
          )}
        </AnimatePresence>
        
        {/* Resizable Handle between Writing and Chat */}
        {layoutState.showWriting && layoutState.showChat && (
          <ResizableHandle />
        )}
        
        {/* Chat Area - Right */}
        <AnimatePresence>
          {layoutState.showChat && (
            <ResizablePanel defaultSize={getPanelSize()} minSize={25} maxSize={60}>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanel('showChat')}
                  className="absolute top-2 right-2 z-10 h-6 w-6 p-0 text-black/40 hover:text-black"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <ChatArea 
                  ref={chatAreaRef} 
                  projectId={project.id} 
                  initialMessage={initialMessage} 
                  onCardCreated={onCardCreated} 
                  onCardUpdated={onCardUpdated}
                  canvasReferences={canvasReferences}
                  onRemoveCanvasReference={onRemoveCanvasReference}
                  onCanvasDataReceived={handleCanvasDataReceived}
                />
              </motion.div>
            </ResizablePanel>
          )}
        </AnimatePresence>
      </ResizablePanelGroup>
    </div>
  );
};

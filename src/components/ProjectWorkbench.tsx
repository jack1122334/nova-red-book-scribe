
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Feather, Sidebar, FileText, MessageSquare, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import { Project } from "@/pages/Creation";
import { WritingArea } from "@/components/WritingArea";
import { ChatArea } from "@/components/ChatArea";
import { CanvasArea, CanvasItem } from "@/components/CanvasArea";
import { UserBackgroundIcon } from "@/components/UserBackgroundIcon";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { LayoutControls } from "@/components/LayoutControls";
import { motion, AnimatePresence } from "framer-motion";

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
  const [canvasReferences, setCanvasReferences] = useState<CanvasItem[]>([]);
  const [layoutState, setLayoutState] = useState<LayoutState>({
    showCanvas: true,
    showWriting: true,
    showChat: true
  });

  // Add debugging for project data
  console.log('ProjectWorkbench - project:', project);
  console.log('ProjectWorkbench - project.user_background:', project?.user_background);

  if (!project) return null;

  const handleCardCreated = async (cardId: string, title: string, content: string) => {
    // 通知WritingArea添加新卡片
    if (writingAreaRef.current?.addCardFromAgent) {
      await writingAreaRef.current.addCardFromAgent(title, content);
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
  };

  const togglePanel = (panel: keyof LayoutState) => {
    setLayoutState(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
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

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Simplified Header */}
      <header className="px-8 py-4 border-b border-black/10 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-black hover:text-white hover:bg-black font-serif rounded-xl border-0 shadow-none">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回项目
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black rounded-xl">
                <Feather className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-serif font-semibold text-black tracking-tight">
                {project.title}
              </h1>
              {/* User Background Icon with debugging */}
              <div>
                <UserBackgroundIcon userBackground={project.user_background} />
              </div>
            </div>
          </div>
          
          <LayoutControls layoutState={layoutState} onLayoutChange={setLayoutState} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
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
                  className="h-full relative border-r border-black/10"
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
                    onItemSelect={handleCanvasItemSelect}
                    onItemDisable={handleCanvasItemDisable}
                  />
                </motion.div>
              </ResizablePanel>
            )}
          </AnimatePresence>
          
          {layoutState.showCanvas && layoutState.showWriting && (
            <ResizableHandle className="w-0 hover:w-1 hover:bg-black/20 transition-all duration-200" />
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
                  className="h-full relative border-r border-black/10"
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
                    onCardUpdate={handleCardUpdate} 
                    onCardCreate={handleCardCreate} 
                    onTextSelect={handleTextSelection} 
                    onAddReference={handleAddReference} 
                  />
                </motion.div>
              </ResizablePanel>
            )}
          </AnimatePresence>
          
          {layoutState.showWriting && layoutState.showChat && (
            <ResizableHandle className="w-0 hover:w-1 hover:bg-black/20 transition-all duration-200" />
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
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <ChatArea 
                    ref={chatAreaRef} 
                    projectId={project.id} 
                    initialMessage={initialMessage} 
                    onCardCreated={handleCardCreated} 
                    onCardUpdated={handleCardUpdated}
                    canvasReferences={canvasReferences}
                    onRemoveCanvasReference={handleRemoveCanvasReference}
                  />
                </motion.div>
              </ResizablePanel>
            )}
          </AnimatePresence>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

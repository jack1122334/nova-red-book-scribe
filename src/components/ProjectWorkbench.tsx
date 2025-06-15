
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Feather } from "lucide-react";
import { Project } from "@/pages/Creation";
import { WritingArea } from "@/components/WritingArea";
import { ChatArea } from "@/components/ChatArea";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface ProjectWorkbenchProps {
  project: Project | null;
  onBack: () => void;
  initialMessage?: string;
}

export const ProjectWorkbench = ({ project, onBack, initialMessage }: ProjectWorkbenchProps) => {
  const writingAreaRef = useRef<any>(null);
  const chatAreaRef = useRef<any>(null);

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
    console.log('Text selection:', { cardId, selectedText, instruction });
    // TODO: 实现文本选择处理逻辑
  };

  const handleCardUpdate = (cardId: string, content: string, title?: string) => {
    console.log('Card updated:', { cardId, content, title });
    // 通知ChatArea用户编辑了卡片
    if (chatAreaRef.current?.notifyCardUpdate) {
      chatAreaRef.current.notifyCardUpdate(cardId, content, title);
    }
  };

  const handleCardCreate = (cardId: string) => {
    console.log('Card created:', { cardId });
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-sans"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回项目
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center space-x-3">
                <Feather className="w-5 h-5 text-gray-700" />
                <h1 className="text-xl font-sans font-medium text-gray-900 tracking-tight">
                  {project.title}
                </h1>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 font-sans">
              创作工作台
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Writing Area */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <WritingArea 
              ref={writingAreaRef}
              projectId={project.id} 
              onCardUpdate={handleCardUpdate}
              onCardCreate={handleCardCreate}
              onTextSelect={handleTextSelection}
              onAddReference={handleAddReference}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-gray-200 hover:bg-gray-300 transition-colors" />
          
          {/* Chat Area */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
            <ChatArea 
              ref={chatAreaRef}
              projectId={project.id} 
              initialMessage={initialMessage}
              onCardCreated={handleCardCreated}
              onCardUpdated={handleCardUpdated}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

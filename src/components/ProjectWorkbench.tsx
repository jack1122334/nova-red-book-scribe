
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Project } from "@/pages/Creation";
import { WritingArea } from "@/components/WritingArea";
import { ChatArea } from "@/components/ChatArea";

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

  const handleCardUpdate = (cardId: string, content: string) => {
    console.log('Card updated:', { cardId, content });
  };

  const handleCardCreate = (cardId: string) => {
    console.log('Card created:', { cardId });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white/70 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回项目列表
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-xl font-semibold text-gray-800">{project.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Writing Area - Left Side */}
        <div className="flex-1 border-r bg-white/30">
          <WritingArea 
            ref={writingAreaRef}
            projectId={project.id} 
            onCardUpdate={handleCardUpdate}
            onCardCreate={handleCardCreate}
            onTextSelect={handleTextSelection}
          />
        </div>

        {/* Chat Area - Right Side */}
        <div className="w-96 bg-white/50">
          <ChatArea 
            ref={chatAreaRef}
            projectId={project.id} 
            initialMessage={initialMessage}
            onCardCreated={handleCardCreated}
            onCardUpdated={handleCardUpdated}
          />
        </div>
      </div>
    </div>
  );
};

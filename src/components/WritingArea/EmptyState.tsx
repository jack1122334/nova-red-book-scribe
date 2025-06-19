
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateCard: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateCard }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white p-6 bg-white">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-black" />
      </div>
      <h3 className="text-lg font-medium mb-2 font-serif text-gray-950">还没有创作卡片</h3>
      <p className="text-sm text-center max-w-md mb-6 font-serif leading-relaxed text-zinc-950">
        卡片是您的创作素材库，可以保存草稿、想法和参考内容，方便在对话中引用。
      </p>
      <Button onClick={onCreateCard} className="bg-black text-white hover:bg-white hover:text-black">
        <Plus className="w-4 h-4 mr-2" />
        创建第一个卡片
      </Button>
    </div>
  );
};

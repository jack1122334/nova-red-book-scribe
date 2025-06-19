
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WritingAreaHeaderProps {
  onCreateCard: () => void;
}

export const WritingAreaHeader: React.FC<WritingAreaHeaderProps> = ({ onCreateCard }) => {
  return (
    <div className="p-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold font-serif text-slate-950">Draft</h2>
        </div>
        <Button onClick={onCreateCard} size="sm" className="bg-black text-white hover:bg-white hover:text-black">
          <Plus className="w-4 h-4 mr-2" />
          新建卡片
        </Button>
      </div>
    </div>
  );
};

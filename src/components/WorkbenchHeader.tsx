
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Feather } from "lucide-react";
import { Project } from "@/pages/Creation";
import { UserBackgroundIcon } from "@/components/UserBackgroundIcon";
import { LayoutControls } from "@/components/LayoutControls";

interface LayoutState {
  showCanvas: boolean;
  showWriting: boolean;
  showChat: boolean;
}

interface WorkbenchHeaderProps {
  project: Project;
  layoutState: LayoutState;
  onBack: () => void;
  onLayoutChange: (state: LayoutState) => void;
  onUserToggleDraft: (closed: boolean) => void;
}

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({
  project,
  layoutState,
  onBack,
  onLayoutChange,
  onUserToggleDraft
}) => {
  return (
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
            <div>
              <UserBackgroundIcon userBackground={project.user_background} />
            </div>
          </div>
        </div>
        
        <LayoutControls 
          layoutState={layoutState} 
          onLayoutChange={onLayoutChange} 
          onUserToggleDraft={onUserToggleDraft}
        />
      </div>
    </header>
  );
};

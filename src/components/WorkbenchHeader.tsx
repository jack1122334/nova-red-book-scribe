import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Feather } from "lucide-react";
import { Project } from "@/pages/Creation";
import { UserBackgroundIcon } from "@/components/UserBackgroundIcon";
import { LayoutControls } from "@/components/LayoutControls";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";

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
  xiaohongshuCardsCount?: number;
}

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({
  project,
  layoutState,
  onBack,
  onLayoutChange,
  xiaohongshuCardsCount = 0
}) => {
  return (
    <header className="px-2 md:px-2 py-4 border-b border-black/10 bg-white">
      <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
        <div className="w-full flex justify-between md:justify-start items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-black hover:text-white hover:bg-black font-serif rounded-xl border-0 shadow-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden md:block">我的项目</span>
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
          {/* 头像操作 */}
          <div className="block md:hidden">
            <UserAvatarMenu />
          </div>
        </div>
        <LayoutControls
          layoutState={layoutState}
          onLayoutChange={onLayoutChange}
          xiaohongshuCardsCount={xiaohongshuCardsCount}
        />
        <div className="hidden md:block ml-6">
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
};

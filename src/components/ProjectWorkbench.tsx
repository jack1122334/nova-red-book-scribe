
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Project } from "@/pages/Creation";
import { WritingArea } from "@/components/WritingArea";
import { ChatArea } from "@/components/ChatArea";

interface ProjectWorkbenchProps {
  project: Project | null;
  onBack: () => void;
}

export const ProjectWorkbench = ({ project, onBack }: ProjectWorkbenchProps) => {
  if (!project) return null;

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
          <WritingArea projectId={project.id} />
        </div>

        {/* Chat Area - Right Side */}
        <div className="w-96 bg-white/50">
          <ChatArea projectId={project.id} />
        </div>
      </div>
    </div>
  );
};

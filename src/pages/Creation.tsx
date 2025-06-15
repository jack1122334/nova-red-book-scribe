
import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { ProjectsManager } from "@/components/ProjectsManager";
import { ProjectWorkbench } from "@/components/ProjectWorkbench";

export type CreationView = "projects" | "workbench";

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  initialMessage?: string;
}

const Creation = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<CreationView>("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // 处理从首页传来的项目信息
  useEffect(() => {
    if (projectId && location.state?.project) {
      setSelectedProject(location.state.project);
      setCurrentView("workbench");
    } else if (projectId) {
      // 如果只有projectId但没有state，可能是直接访问链接
      // 这里应该根据projectId从后端获取项目信息
      // 暂时创建一个模拟项目
      const mockProject: Project = {
        id: projectId,
        title: `项目 ${projectId}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setSelectedProject(mockProject);
      setCurrentView("workbench");
    }
  }, [projectId, location.state]);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView("workbench");
  };

  const handleBackToProjects = () => {
    setCurrentView("projects");
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <FloatingSidebar currentPage="creation" />
      
      <div className="pl-20">
        {currentView === "projects" ? (
          <ProjectsManager onProjectSelect={handleProjectSelect} />
        ) : (
          <ProjectWorkbench 
            project={selectedProject} 
            onBack={handleBackToProjects}
            initialMessage={location.state?.initialMessage}
          />
        )}
      </div>
    </div>
  );
};

export default Creation;

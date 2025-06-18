
import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { ProjectsManager } from "@/components/ProjectsManager";
import { ProjectWorkbench } from "@/components/ProjectWorkbench";
import { projectsApi } from "@/lib/api";

export type CreationView = "projects" | "workbench";

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  initialMessage?: string;
  user_background?: any;
}

const Creation = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<CreationView>("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 处理从首页传来的项目信息
  useEffect(() => {
    if (projectId && location.state?.project) {
      console.log('Creation: Using project from location state:', location.state.project);
      setSelectedProject(location.state.project);
      setCurrentView("workbench");
    } else if (projectId) {
      // 如果只有projectId但没有state，从后端获取项目信息
      console.log('Creation: Fetching project from API:', projectId);
      setIsLoading(true);
      projectsApi.get(projectId)
        .then(project => {
          console.log('Creation: Project fetched from API:', project);
          const formattedProject: Project = {
            id: project.id,
            title: project.title,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            user_background: project.user_background,
            initialMessage: location.state?.initialMessage
          };
          setSelectedProject(formattedProject);
          setCurrentView("workbench");
        })
        .catch(error => {
          console.error('Creation: Error fetching project:', error);
          // 如果获取失败，回到项目列表
          setCurrentView("projects");
        })
        .finally(() => {
          setIsLoading(false);
        });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white rounded-none flex items-center justify-center">
        <div className="text-black font-serif">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-none">
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

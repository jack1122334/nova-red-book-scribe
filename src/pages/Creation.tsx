
import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { ProjectsManager } from "@/components/ProjectsManager";
import { ProjectWorkbench } from "@/components/ProjectWorkbench";
import { useProjectStore } from "@/stores/projectStore";

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
  const { currentProject, fetchProject, setCurrentProject } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);

  // 处理从首页传来的项目信息
  useEffect(() => {
    if (projectId && location.state?.project) {
      console.log('Creation: Using project from location state:', location.state.project);
      setCurrentProject(location.state.project);
      setCurrentView("workbench");
    } else if (projectId) {
      // 如果只有projectId但没有state，从状态管理获取项目信息
      console.log('Creation: Fetching project from store:', projectId);
      setIsLoading(true);
      fetchProject(projectId)
        .then(project => {
          if (project) {
            console.log('Creation: Project fetched from store:', project);
            const projectWithMessage = {
              ...project,
              initialMessage: location.state?.initialMessage
            };
            setCurrentProject(projectWithMessage);
            setCurrentView("workbench");
          } else {
            // 如果获取失败，回到项目列表
            setCurrentView("projects");
          }
        })
        .catch(error => {
          console.error('Creation: Error fetching project:', error);
          setCurrentView("projects");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [projectId, location.state, fetchProject, setCurrentProject]);

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    setCurrentView("workbench");
  };

  const handleBackToProjects = () => {
    setCurrentView("projects");
    setCurrentProject(null);
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
      
      <div className={currentView === "projects" ? "pl-20" : ""}>
        {currentView === "projects" ? (
          <ProjectsManager onProjectSelect={handleProjectSelect} />
        ) : (
          <ProjectWorkbench 
            project={currentProject} 
            onBack={handleBackToProjects} 
            initialMessage={location.state?.initialMessage} 
          />
        )}
      </div>
    </div>
  );
};

export default Creation;

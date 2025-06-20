import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { ProjectsManager } from "@/components/ProjectsManager";
import { ProjectWorkbench } from "@/components/ProjectWorkbench";
import { useProjectStore } from "@/stores/projectStore";
import { Navbar } from "@/components/Navbar";
import { UserBackgroundData } from "@/types/userBackground";
import { useCanvasStore } from "@/stores/canvasStore";
import { useCardsStore } from "@/stores/cardsStore";

export type CreationView = "projects" | "workbench";

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  initialMessage?: string;
  user_background?: UserBackgroundData;
}

const Creation = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProject, fetchProject, setCurrentProject } = useProjectStore();
  const { reset: resetCanvas } = useCanvasStore();
  const { reset: resetXiaohongshuCards } = useCardsStore();

  const [currentView, setCurrentView] = useState<CreationView>("projects");
  const [isLoading, setIsLoading] = useState(false);

  // 清除上一次的项目状态，避免显示上一次的项目详情
  useEffect(() => {
    // 当没有projectId时，清除当前项目状态
    if (!projectId) {
      setCurrentProject(null);
      setCurrentView("projects");
      resetXiaohongshuCards();
      resetCanvas();
    }
  }, [projectId, setCurrentProject]);

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
            navigate('/creation', { replace: true });
          }
        })
        .catch(error => {
          console.error('Creation: Error fetching project:', error);
          setCurrentView("projects");
          navigate('/creation', { replace: true });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [projectId, location.state, fetchProject, setCurrentProject, navigate]);

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    setCurrentView("workbench");
    // 更新URL添加项目ID参数
    navigate(`/creation/workbench/${project.id}`, { replace: true });
  };

  const handleBackToProjects = () => {
    setCurrentView("projects");
    setCurrentProject(null);
    // 导航到干净的 /creation 路由，清除所有URL参数
    navigate('/creation', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-500 rounded-none flex items-center justify-center">
        <div className="text-black font-serif">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-500 rounded-none">
      <FloatingSidebar currentPage="creation" />
      <div className={cn(currentView === "projects" ? "" : "")}>
        {currentView === "projects" ? (
          <>
            <Navbar />
            <ProjectsManager onProjectSelect={handleProjectSelect} />
          </>
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

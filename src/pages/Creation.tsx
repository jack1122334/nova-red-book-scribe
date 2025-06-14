
import { useState } from "react";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { ProjectsManager } from "@/components/ProjectsManager";
import { ProjectWorkbench } from "@/components/ProjectWorkbench";

export type CreationView = "projects" | "workbench";

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const Creation = () => {
  const [currentView, setCurrentView] = useState<CreationView>("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView("workbench");
  };

  const handleBackToProjects = () => {
    setCurrentView("projects");
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <FloatingSidebar currentPage="creation" />
      
      <div className="pl-20">
        {currentView === "projects" ? (
          <ProjectsManager onProjectSelect={handleProjectSelect} />
        ) : (
          <ProjectWorkbench 
            project={selectedProject} 
            onBack={handleBackToProjects}
          />
        )}
      </div>
    </div>
  );
};

export default Creation;

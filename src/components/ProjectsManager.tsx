import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, MessageSquare } from "lucide-react";
import { Project } from "@/pages/Creation";
import { projectsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProjectsManagerProps {
  onProjectSelect?: (project: Project) => void;
}

export const ProjectsManager = ({
  onProjectSelect
}: ProjectsManagerProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      console.log('Loading projects...');
      const data = await projectsApi.list();
      console.log('Loaded projects:', data);

      // Convert database projects to frontend Project format
      const formattedProjects: Project[] = data.map(proj => ({
        id: proj.id,
        title: proj.title,
        createdAt: proj.created_at.split('T')[0],
        // Convert to date string
        updatedAt: proj.updated_at.split('T')[0] // Convert to date string
      }));
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "加载项目失败",
        description: "无法加载项目列表",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || isCreating) return;
    setIsCreating(true);
    try {
      console.log('Creating project:', newProjectTitle);
      const dbProject = await projectsApi.create({
        title: newProjectTitle.trim()
      });
      console.log('Created project:', dbProject);
      const newProject: Project = {
        id: dbProject.id,
        title: dbProject.title,
        createdAt: dbProject.created_at.split('T')[0],
        updatedAt: dbProject.updated_at.split('T')[0]
      };
      setProjects(prev => [newProject, ...prev]);
      setNewProjectTitle("");
      toast({
        title: "项目创建成功",
        description: `项目"${newProject.title}"已创建`
      });

      // Auto-select the new project or navigate to creation page
      if (onProjectSelect) {
        onProjectSelect(newProject);
      } else {
        navigate(`/creation/workbench/${newProject.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast({
        title: "创建项目失败",
        description: error.message || "无法创建项目，请重试",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    } else {
      navigate(`/creation/workbench/${project.id}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    }
  };

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>;
  }

  return <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">我的项目</h1>
        <p className="text-gray-600">管理你的小红书创作项目</p>
      </div>

      {/* Create New Project */}
      <Card className="mb-8 bg-white/70 backdrop-blur-sm border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-950">
            <Plus className="w-5 h-5" />
            创建新项目
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="输入项目名称..." value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} onKeyPress={handleKeyPress} disabled={isCreating} className="flex-1 bg-neutral-300" />
            <Button onClick={handleCreateProject} disabled={!newProjectTitle.trim() || isCreating} className="bg-slate-950 hover:bg-slate-800">
              {isCreating ? "创建中..." : "创建项目"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/60 backdrop-blur-sm border-gray-200 hover:border-purple-300" onClick={() => handleProjectClick(project)}>
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>创建于 {project.createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>最后更新 {project.updatedAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {projects.length === 0 && <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>还没有项目</p>
          <p className="text-sm">创建你的第一个小红书创作项目吧</p>
        </div>}
    </div>;
};

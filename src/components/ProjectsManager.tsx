import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Calendar, MessageSquare, Trash2 } from "lucide-react";
import { Project } from "@/pages/Creation";
import { projectsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { UserBackgroundIcon } from "./UserBackgroundIcon";

interface ProjectsManagerProps {
  onProjectSelect?: (project: Project) => void;
}

export const ProjectsManager = ({
  onProjectSelect
}: ProjectsManagerProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
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
        user_background: proj.user_background,
        createdAt: proj.created_at.split('T')[0],
        updatedAt: proj.updated_at.split('T')[0]
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

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    
    if (onProjectSelect) {
      onProjectSelect(newProject);
    } else {
      navigate(`/creation/workbench/${newProject.id}`);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    } else {
      navigate(`/creation/workbench/${project.id}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await projectsApi.delete(projectToDelete.id);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      toast({
        title: "项目删除成功",
        description: `项目"${projectToDelete.title}"已被删除`,
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: "删除项目失败",
        description: "无法删除项目，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发项目点击
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>;
  }

  return (
    <div className="p-8 md:px-20 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">我的项目</h1>
      </div>

      {/* Create New Project */}
      <Card className="my-8 bg-white/70 backdrop-blur-sm">
        <CardContent>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="mt-6 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
          >
            创建项目
          </Button>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/60 backdrop-blur-sm border-gray-200  relative"
            onClick={() => handleProjectClick(project)}
          >
            {/* 删除按钮 - 只在hover时显示 */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white hover:bg-red-100 hover:text-red-600 z-10"
              onClick={(e) => handleDeleteClick(e, project)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-gray-800 pr-8">
                {project.title}
              </CardTitle>
              {project.user_background && (
                <UserBackgroundIcon
                  noHover={true}
                  userBackground={project.user_background}
                  size="sm"
                />
              )}
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
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>还没有项目</p>
          <p className="text-sm">创建你的第一个小红书创作项目吧</p>
        </div>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除项目</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除项目"{projectToDelete?.title}
              "吗？此操作无法撤销，项目中的所有内容都将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

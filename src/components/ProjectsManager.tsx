
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Clock, ArrowRight } from "lucide-react";
import { Project } from "@/pages/Creation";
import { projectsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProjectsManagerProps {
  onProjectSelect: (project: Project) => void;
}

export const ProjectsManager = ({ onProjectSelect }: ProjectsManagerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.list();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "加载失败",
        description: "无法加载项目列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const newProject = await projectsApi.create({
        title: `新项目 - ${new Date().toLocaleDateString()}`,
      });
      setProjects([newProject, ...projects]);
      onProjectSelect(newProject);
      toast({
        title: "项目创建成功",
        description: `项目 "${newProject.title}" 已创建`,
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "创建失败",
        description: "无法创建新项目",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await projectsApi.delete(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      toast({
        title: "项目已删除",
        description: "项目删除成功",
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: "删除失败",
        description: "无法删除项目",
        variant: "destructive",
      });
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
            <span className="ml-3 text-gray-600">加载项目中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            我的创作项目
          </h1>
          <p className="text-gray-600">管理和继续你的小红书创作项目</p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-purple-200 focus:border-purple-400"
            />
          </div>
          <Button
            onClick={handleCreateProject}
            className="h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            新建项目
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/70 backdrop-blur-sm border-purple-200"
              onClick={() => onProjectSelect(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                    {project.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    最后编辑：{new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      创建于 {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-700"
                    >
                      <span className="mr-1">继续创作</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? "未找到匹配的项目" : "还没有创作项目"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? "尝试调整搜索条件" : "点击「新建项目」开始你的创作之旅"}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateProject}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                新建项目
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

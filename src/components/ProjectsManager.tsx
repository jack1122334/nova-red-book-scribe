
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Clock, ArrowRight } from "lucide-react";
import { Project } from "@/pages/Creation";

interface ProjectsManagerProps {
  onProjectSelect: (project: Project) => void;
}

export const ProjectsManager = ({ onProjectSelect }: ProjectsManagerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "春季护肤小红书",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-16",
    },
    {
      id: "2", 
      title: "减脂餐搭配攻略",
      createdAt: "2024-01-14",
      updatedAt: "2024-01-15",
    },
    {
      id: "3",
      title: "穿搭显瘦技巧",
      createdAt: "2024-01-13",
      updatedAt: "2024-01-14",
    },
  ]);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: `新项目 - ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setProjects([newProject, ...projects]);
    onProjectSelect(newProject);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                    {project.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent 
                className="pt-0"
                onClick={() => onProjectSelect(project)}
              >
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    最后编辑：{project.updatedAt}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      创建于 {project.createdAt}
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

        {filteredProjects.length === 0 && (
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

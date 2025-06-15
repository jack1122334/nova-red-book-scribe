
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, LogOut, Feather } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoodcaseGallery } from "@/components/GoodcaseGallery";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { AuthContext } from "@/components/AuthProvider";
import { projectsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useContext(AuthContext);
  const { toast } = useToast();

  const handleCreateProject = async () => {
    if (!inputValue.trim() || isCreating) return;
    
    setIsCreating(true);
    
    try {
      const newProject = await projectsApi.create({
        title: `基于'${inputValue.slice(0, 20)}'的项目`,
      });
      
      navigate(`/creation/workbench/${newProject.id}`, { 
        state: { 
          project: newProject,
          initialMessage: inputValue 
        }
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "创建失败",
        description: "无法创建新项目，请重试",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "已退出登录",
        description: "您已成功退出登录",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "退出失败",
        description: "退出登录时发生错误",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateProject();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FloatingSidebar currentPage="home" />
      
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Feather className="w-8 h-8 text-gray-900" />
              <h1 className="text-2xl font-sans font-medium text-gray-900 tracking-tight">
                Nova
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-sans">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 font-sans"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <h1 className="text-5xl font-sans font-medium text-gray-900 mb-6 tracking-tight leading-tight">
              专业的小红书<br />创作助手
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              运用人工智能技术，帮助您创作出优质、引人入胜的小红书内容
            </p>
            
            {/* Input Section */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Input
                  placeholder="描述您想要创作的内容主题..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-16 text-lg px-6 pr-20 border-2 border-gray-300 focus:border-gray-900 rounded-sm font-serif placeholder:text-gray-500"
                  disabled={isCreating}
                />
                <Button
                  onClick={handleCreateProject}
                  disabled={!inputValue.trim() || isCreating}
                  className="absolute right-2 top-2 h-12 w-12 newyorker-button-primary rounded-sm p-0"
                >
                  {isCreating ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 mt-4 font-sans">
                按 Enter 键或点击箭头开始创作
              </p>
            </div>
          </div>
          
          {/* Gallery Section */}
          <div className="border-t border-gray-200 pt-16">
            <GoodcaseGallery />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

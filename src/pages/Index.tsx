
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, LogOut } from "lucide-react";
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
      // 创建新项目
      const newProject = await projectsApi.create({
        title: `基于'${inputValue.slice(0, 20)}'的项目`,
      });
      
      // 导航到项目工作台，传递初始消息
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <FloatingSidebar currentPage="home" />
      
      {/* 用户信息和退出按钮 */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2">
          <span className="text-sm text-gray-600">
            欢迎，{user?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Logo 和主输入区域 */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Nova
              </h1>
              <p className="text-lg text-gray-600">
                专门为小红书创作而生的 AI 助手
              </p>
            </div>
            
            {/* 主输入框 */}
            <div className="relative max-w-2xl mx-auto">
              <Input
                placeholder="告诉我你想要创作什么样的小红书内容..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-14 text-lg px-6 pr-16 border-2 border-purple-200 focus:border-purple-400 rounded-full shadow-lg"
                disabled={isCreating}
              />
              <Button
                onClick={handleCreateProject}
                disabled={!inputValue.trim() || isCreating}
                className="absolute right-2 top-2 h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-0"
              >
                {isCreating ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {/* 提示文本 */}
            <p className="text-sm text-gray-500 mt-4">
              按 Enter 键或点击箭头开始创作
            </p>
          </div>
          
          {/* Goodcase 展示区域 */}
          <GoodcaseGallery />
        </div>
      </div>
    </div>
  );
};

export default Index;

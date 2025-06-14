
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { GoodcaseGallery } from "@/components/GoodcaseGallery";

const Index = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    // Simulate project creation
    setTimeout(() => {
      // Navigate to project workbench with the initial message
      navigate("/creation/project/new", { 
        state: { initialMessage: inputValue } 
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <FloatingSidebar currentPage="home" />
      
      <div className="container mx-auto px-4 py-16">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4">
              Nova
            </h1>
            <p className="text-xl text-gray-600 mb-2">专业的小红书内容创作 AI 助手</p>
            <p className="text-gray-500">像 Cursor 一样智能，专为小红书而生</p>
          </div>

          {/* Main Input */}
          <div className="relative mb-16">
            <div className="flex items-center gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Input
                  placeholder="描述你想创作的小红书内容，例如：写一篇关于春季护肤的小红书"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-14 text-lg px-6 border-2 border-purple-200 focus:border-purple-400 rounded-2xl bg-white/70 backdrop-blur-sm shadow-lg"
                />
                <Sparkles className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              </div>
              <Button
                onClick={handleCreateProject}
                disabled={!inputValue.trim() || isLoading}
                className="h-14 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    创建项目
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Goodcase Gallery */}
          <GoodcaseGallery />
        </div>
      </div>
    </div>
  );
};

export default Index;

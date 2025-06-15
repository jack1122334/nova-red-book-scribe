
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { GoodcaseGallery } from "@/components/GoodcaseGallery";
import { Sparkles, ArrowRight, Feather, Clock, Users, Lightbulb } from "lucide-react";

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();

  const handleStart = () => {
    const projectId = `project-${Date.now()}`;
    navigate(`/creation/${projectId}`, { 
      state: { 
        project: {
          id: projectId,
          title: `新项目 ${new Date().toLocaleDateString()}`,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        },
        initialMessage: inputValue.trim() || undefined
      } 
    });
  };

  const features = [
    {
      icon: Feather,
      title: "智能创作助手",
      description: "AI驱动的写作灵感与结构建议"
    },
    {
      icon: Clock,
      title: "实时协作编辑",
      description: "多人同时编辑，实时同步内容"
    },
    {
      icon: Users,
      title: "社区分享交流",
      description: "与创作者分享作品，获得反馈"
    },
    {
      icon: Lightbulb,
      title: "创意灵感库",
      description: "丰富的素材库和创作模板"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <FloatingSidebar currentPage="home" />
      
      <div className="pl-20">
        {/* Hero Section */}
        <section className="px-8 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 animate-fade-in">
              <div className="inline-flex items-center space-x-2 bg-hermes-100 border-2 border-hermes-500 rounded-full px-6 py-3 mb-8">
                <Sparkles className="w-5 h-5 text-hermes-600" />
                <span className="text-sm font-serif text-black font-medium">智能写作平台</span>
              </div>
              
              <h1 className="text-6xl font-serif font-bold text-black mb-8 tracking-tight leading-tight">
                让创作<br />
                <span className="text-hermes-500">更加优雅</span>
              </h1>
              
              <p className="text-xl text-gray-800 mb-12 max-w-2xl mx-auto leading-relaxed font-serif">
                结合人工智能与人文美学，为您提供专业的写作环境和创作灵感。
                在这里，每一个字都有其独特的价值与意义。
              </p>
            </div>

            {/* Input Section */}
            <div className="max-w-2xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="描述您想要创作的内容..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 h-14 text-base font-serif"
                  onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                />
                <Button 
                  onClick={handleStart} 
                  size="lg"
                  className="h-14 px-8 font-serif text-base"
                >
                  开始创作
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="text-center p-6 animate-fade-in"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <CardContent className="p-0">
                    <div className="w-14 h-14 mx-auto mb-4 bg-hermes-100 border-2 border-hermes-500 rounded-2xl flex items-center justify-center">
                      <feature.icon className="w-7 h-7 text-hermes-600" />
                    </div>
                    <h3 className="font-serif font-semibold text-black mb-2 text-lg">{feature.title}</h3>
                    <p className="text-sm text-gray-700 font-serif leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Goodcase Gallery */}
        <section className="px-8 py-16 bg-hermes-50 border-t-2 border-hermes-500">
          <div className="max-w-6xl mx-auto">
            <GoodcaseGallery />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;

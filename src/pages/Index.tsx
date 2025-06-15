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
          updatedAt: new Date().toISOString().split('T')[0]
        },
        initialMessage: inputValue.trim() || undefined
      }
    });
  };
  const features = [{
    icon: Feather,
    title: "智能创作助手",
    description: "AI驱动的写作灵感与结构建议"
  }, {
    icon: Clock,
    title: "实时协作编辑",
    description: "多人同时编辑，实时同步内容"
  }, {
    icon: Users,
    title: "社区分享交流",
    description: "与创作者分享作品，获得反馈"
  }, {
    icon: Lightbulb,
    title: "创意灵感库",
    description: "丰富的素材库和创作模板"
  }];
  return <div className="min-h-screen bg-background">
      <FloatingSidebar currentPage="home" />
      
      <div className="pl-20">
        {/* Hero Section */}
        <section className="px-8 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 animate-fade-in">
              
              
              <h1 className="text-5xl font-serif font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                让创作<br />
                <span className="text-gray-600">更加优雅</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-serif">
                结合人工智能与人文美学，为您提供专业的写作环境和创作灵感。
                在这里，每一个字都有其独特的价值与意义。
              </p>
            </div>

            {/* Input Section */}
            <div className="max-w-2xl mx-auto mb-16 animate-fade-in" style={{
            animationDelay: '0.2s'
          }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input placeholder="描述您想要创作的内容..." value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 h-12 text-base font-serif rounded-xl border-gray-200 focus:border-gray-400" onKeyPress={e => e.key === 'Enter' && handleStart()} />
                <Button onClick={handleStart} size="lg" className="h-12 px-8 font-serif rounded-xl shadow-notion hover:shadow-notion-hover">
                  开始创作
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {features.map((feature, index) => <Card key={index} className="text-center p-6 hover:shadow-notion-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in border-gray-200/60" style={{
              animationDelay: `${0.3 + index * 0.1}s`
            }}>
                  <CardContent className="p-0">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <h3 className="font-serif font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 font-serif">{feature.description}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Goodcase Gallery */}
        <section className="px-8 py-16 bg-gray-50/50">
          <div className="max-w-6xl mx-auto">
            <GoodcaseGallery />
          </div>
        </section>
      </div>
    </div>;
};
export default Index;
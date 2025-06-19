
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { FloatingSidebar } from '@/components/FloatingSidebar';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';
import { ProjectGrid } from '@/components/ProjectGrid';
import { ThemeInput } from '@/components/ThemeInput';
import { useProjectStore } from '@/stores/projectStore';
import { Project } from '@/pages/Creation';

const Index = () => {
  const [theme, setTheme] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleThemeSubmit = () => {
    if (theme.trim()) {
      setShowCreateDialog(true);
    }
  };

  const handleProjectCreated = (project: Project) => {
    // 项目创建后，导航到项目详情页面并发送主题消息
    window.location.href = `/creation/workbench/${project.id}?theme=${encodeURIComponent(theme)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <FloatingSidebar currentPage="home" />
      <Navbar />
      
      {/* 主要内容区域 */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* 欢迎标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
            Good Afternoon, 创作者
          </h1>
          <p className="text-lg text-gray-600 font-serif">
            请输入您的创作主题，开始新的创作之旅
          </p>
        </div>

        {/* 主题输入区域 */}
        <div className="mb-16">
          <ThemeInput 
            value={theme}
            onChange={setTheme}
            onSubmit={handleThemeSubmit}
          />
        </div>

        {/* 项目展示区域 */}
        {projects.length > 0 && (
          <div className="mb-8 md:px-20">
            <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">
              我的项目
            </h2>
            <ProjectGrid projects={projects} />
          </div>
        )}
      </div>

      {/* 创建项目对话框 */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProjectCreated={handleProjectCreated}
        defaultTitle={theme}
      />
    </div>
  );
};

export default Index;

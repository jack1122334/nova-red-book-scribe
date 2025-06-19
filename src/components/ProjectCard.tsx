
import React from 'react';
import { Project } from '@/pages/Creation';
import { useNavigate } from 'react-router-dom';
import { Feather, Calendar } from 'lucide-react';
import { UserBackgroundIcon } from '@/components/UserBackgroundIcon';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/creation/workbench/${project.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
    >
      {/* 卡片头部 */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-black rounded-xl group-hover:bg-gray-800 transition-colors duration-200">
            <Feather className="w-5 h-5 text-white" />
          </div>
          {project.user_background && (
            <UserBackgroundIcon userBackground={project.user_background} size="sm" />
          )}
        </div>
        
        <h3 className="text-lg font-serif font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-black transition-colors duration-200">
          {project.title}
        </h3>
      </div>
      
      {/* 卡片底部 */}
      <div className="px-6 pb-6">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{project.updatedAt}</span>
        </div>
      </div>
      
      {/* 悬浮效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

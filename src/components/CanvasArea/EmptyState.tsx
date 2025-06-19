
import React from 'react';
import { Grid3X3, Lightbulb } from 'lucide-react';

interface EmptyStateProps {
  type: 'canvas' | 'insights';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const isCanvas = type === 'canvas';
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {isCanvas ? (
          <Grid3X3 className="w-6 h-6 text-gray-400" />
        ) : (
          <Lightbulb className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-700 font-serif mb-1">
        {isCanvas ? '暂无Canvas内容' : '暂无Insights'}
      </h3>
      <p className="text-xs text-gray-500 font-serif">
        {isCanvas 
          ? '在聊天中发送消息来生成Canvas内容' 
          : '分析内容后会在这里显示相关洞察'
        }
      </p>
    </div>
  );
};

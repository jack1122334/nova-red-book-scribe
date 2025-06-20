import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCanvasStore } from '@/stores/canvasStore';

export const CanvasReferenceDisplay: React.FC = () => {
const { 
getCanvasReferences,
removeFromCanvasReferences
} = useCanvasStore();

const canvasReferences = getCanvasReferences();
const totalSelected = canvasReferences.length;

if (totalSelected === 0) {
  return null;
}

const handleRemoveItem = (itemId: string) => {
  removeFromCanvasReferences(itemId);
};

return (
<div className="mb-4">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium">
      已选择的参考内容 ({totalSelected})
    </span>
  </div>
  
  <div className="space-y-2">
    {/* Canvas References */}
    {canvasReferences.map((item) => (
      <div key={item.id} className="flex items-center justify-between bg-white rounded p-2 border border-blue-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={item.type === 'canvas' ? 'secondary' : 'outline'} className="text-xs">
              {item.type === 'canvas' ? 'Canvas' : '洞察'}
            </Badge>
            <span className="text-sm font-medium text-gray-900 truncate">
              {item.title}
            </span>
          </div>
          {item.keyword && (
            <div className="text-xs text-gray-500 mt-1">
              关键词: {item.keyword?.substring(0, 24)}...
            </div>
          )}
          {item.content && item.type === 'insight' && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.content.substring(0, 24)}...
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveItem(item.id)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    ))}
  </div>
</div>
);
}; 
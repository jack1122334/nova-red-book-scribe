
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Grid3X3, Lightbulb } from 'lucide-react';
import { CanvasItem } from './CanvasArea';

interface ReferenceDisplayProps {
  references: CanvasItem[];
  onRemoveReference: (itemId: string) => void;
}

export const ReferenceDisplay: React.FC<ReferenceDisplayProps> = ({ 
  references, 
  onRemoveReference 
}) => {
  if (references.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border-b border-black/10 bg-gray-50">
      <h3 className="text-sm font-medium text-black mb-3 font-serif">
        选中的引用内容 ({references.length})
      </h3>
      
      <div className="space-y-2">
        {references.map((ref) => (
          <Card key={ref.id} className="bg-white">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <div className="mt-0.5">
                    {ref.type === 'canvas' ? (
                      <Grid3X3 className="w-4 h-4 text-black/60" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-black/60" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-black font-serif mb-1 truncate">
                      {ref.title}
                    </h4>
                    {ref.content && (
                      <p className="text-xs text-black/60 leading-relaxed">
                        {ref.content.length > 60 
                          ? `${ref.content.substring(0, 60)}...` 
                          : ref.content
                        }
                      </p>
                    )}
                    <span className="inline-block mt-1 text-xs text-black/40 bg-black/10 px-2 py-1 rounded">
                      {ref.type === 'canvas' ? 'Canvas' : 'Insight'}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-black/40 hover:text-black flex-shrink-0"
                  onClick={() => onRemoveReference(ref.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

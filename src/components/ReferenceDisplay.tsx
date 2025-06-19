
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
    <div className="pb-2">
      <h3 className="text-sm font-medium text-black mb-3 font-serif">
        选中的引用内容 ({references.length})
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {references.map((ref) => (
          <Card key={ref.id} className="bg-gray-50 border border-black/10 max-w-xs">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="mt-0.5 flex-shrink-0">
                    {ref.type === 'canvas' ? (
                      <Grid3X3 className="w-3 h-3 text-black/60" />
                    ) : (
                      <Lightbulb className="w-3 h-3 text-black/60" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-black font-serif mb-1 truncate">
                      {ref.title}
                    </h4>
                    {ref.content && (
                      <p className="text-xs text-black/60 leading-relaxed line-clamp-2">
                        {ref.content.length > 40 
                          ? `${ref.content.substring(0, 40)}...` 
                          : ref.content
                        }
                      </p>
                    )}
                    {/* <span className="inline-block mt-1 text-xs text-black/40 bg-black/10 px-1.5 py-0.5 rounded text-center">
                      {ref.type === 'canvas' ? 'Canvas' : 'Insight'}
                    </span> */}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-black/40 hover:text-black flex-shrink-0"
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

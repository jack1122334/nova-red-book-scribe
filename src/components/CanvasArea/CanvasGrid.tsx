
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, RotateCcw } from "lucide-react";
import { CanvasItem } from "../CanvasArea";

interface CanvasGridProps {
  items: CanvasItem[];
  selectedItems: Set<string>;
  onCheckboxChange: (itemId: string, checked: boolean) => void;
  onBatchSelect: () => void;
  onBatchDisable: () => void;
  onRestore: (itemId: string) => void;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  items,
  selectedItems,
  onCheckboxChange,
  onBatchSelect,
  onBatchDisable,
  onRestore
}) => {
  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`relative aspect-square ${
              item.isDisabled ? 'opacity-30' : ''
            }`}
          >
            <Card className={`h-full transition-all duration-500 overflow-hidden ${
              item.isSelected 
                ? 'ring-2 ring-black bg-black/5' 
                : 'hover:shadow-md hover:-translate-y-0.5'
            } ${
              item.isLoading ? 'animate-pulse' : 'animate-fadeIn'
            }`}>
              <CardContent className="p-3 h-full flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) => 
                      onCheckboxChange(item.id, checked as boolean)
                    }
                    disabled={item.isDisabled || item.isLoading}
                    className="flex-shrink-0"
                  />
                  {item.isDisabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-5 w-5 p-0 rounded-full hover:bg-green-50 hover:border-green-300"
                      onClick={() => onRestore(item.id)}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  {item.isLoading ? (
                    <>
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black font-serif mb-1">
                        {item.title}
                      </span>
                      {item.author && (
                        <span className="text-xs text-black/50 font-serif mb-1">
                          作者: {item.author}
                        </span>
                      )}
                      {(item.like_count || item.collect_count) && (
                        <div className="text-xs text-black/40 flex gap-2">
                          {item.like_count && <span>❤️ {item.like_count}</span>}
                          {item.collect_count && <span>⭐ {item.collect_count}</span>}
                        </div>
                      )}
                      <span className="text-xs text-black/50 font-serif flex-1">
                        {item.content}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Batch Operation Buttons */}
      {selectedItems.size > 0 && (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="default"
            className="h-8 w-8 p-0 rounded-full"
            onClick={onBatchSelect}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
            onClick={onBatchDisable}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

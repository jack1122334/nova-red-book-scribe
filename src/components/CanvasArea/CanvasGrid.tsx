
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, RotateCcw } from "lucide-react";
import { CanvasItem } from "../CanvasArea";
import { motion, AnimatePresence } from "framer-motion";

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
  const isLoading = (item: CanvasItem) => item.title === '加载中...';

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              className={`relative aspect-square ${
                item.isDisabled ? 'opacity-30' : ''
              }`}
            >
              <Card className={`h-full transition-all duration-200 overflow-hidden ${
                item.isSelected 
                  ? 'ring-2 ring-black bg-black/5' 
                  : 'hover:shadow-md hover:-translate-y-0.5'
              } ${isLoading(item) ? 'animate-pulse' : ''}`}>
                <CardContent className="p-3 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    {!isLoading(item) && (
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => 
                          onCheckboxChange(item.id, checked as boolean)
                        }
                        disabled={item.isDisabled}
                        className="flex-shrink-0"
                      />
                    )}
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
                    {isLoading(item) ? (
                      <div className="flex flex-col space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-black font-serif line-clamp-2 mb-1">
                          {item.title}
                        </span>
                        <span className="text-xs text-black/50 font-serif line-clamp-3">
                          {item.content}
                        </span>
                        {item.keyword && (
                          <div className="mt-1 text-xs text-blue-600 font-medium">
                            #{item.keyword}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Batch Operation Buttons */}
      {selectedItems.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 justify-end"
        >
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
        </motion.div>
      )}
    </div>
  );
};

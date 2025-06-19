
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, RotateCcw } from "lucide-react";
import { CanvasItem } from "../CanvasArea";

interface InsightsListProps {
  insights: CanvasItem[];
  selectedInsights: Set<string>;
  onCheckboxChange: (itemId: string, checked: boolean) => void;
  onBatchSelect: () => void;
  onBatchDisable: () => void;
  onRestore: (itemId: string) => void;
}

export const InsightsList: React.FC<InsightsListProps> = ({
  insights,
  selectedInsights,
  onCheckboxChange,
  onBatchSelect,
  onBatchDisable,
  onRestore
}) => {
  return (
    <div className="relative">
      <div className="space-y-3 mb-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`relative ${
              insight.isDisabled ? 'opacity-30' : ''
            }`}
          >
            <Card className={`transition-all duration-200 ${
              insight.isSelected 
                ? 'ring-2 ring-black bg-black/5' 
                : 'hover:shadow-md hover:-translate-y-0.5'
            }`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedInsights.has(insight.id)}
                    onCheckedChange={(checked) => 
                      onCheckboxChange(insight.id, checked as boolean)
                    }
                    disabled={insight.isDisabled}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-black font-serif mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-black/60 leading-relaxed">
                      {insight.content}
                    </p>
                  </div>
                  {insight.isDisabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 rounded-full hover:bg-green-50 hover:border-green-300 flex-shrink-0"
                      onClick={() => onRestore(insight.id)}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Batch Operation Buttons */}
      {selectedInsights.size > 0 && (
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

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, RotateCcw, Lightbulb, Sparkles } from "lucide-react";
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
  // 如果没有insights，显示空状态
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Lightbulb className="w-10 h-10 text-gray-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-serif font-semibold text-gray-900 mb-2">
          等待洞察分析
        </h3>
        <p className="text-gray-500 text-center font-serif leading-relaxed max-w-sm">
          AI 将基于对话内容为你生成深度洞察和创作建议，助力你的内容创作
        </p>
      </div>
    );
  }

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

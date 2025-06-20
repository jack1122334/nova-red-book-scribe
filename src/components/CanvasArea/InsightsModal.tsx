import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Calendar, Hash, Copy, Check } from "lucide-react";
import { CanvasItem } from "@/stores/canvasStore";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface InsightsModalProps {
  item: CanvasItem | null;
  open: boolean;
  onClose: () => void;
}

export const InsightsModal: React.FC<InsightsModalProps> = ({
  item,
  open,
  onClose,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!item || item.type !== "insight") return null;

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(item.content || "");
      setCopied(true);
      toast({
        title: "复制成功",
        description: "洞察内容已复制到剪贴板",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleString("zh-CN");
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-black flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            <motion.span layoutId={`insight-title-${item.id}`}>
              {item.title}
            </motion.span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keyword Badge */}
          {item.keyword && (
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-500" />
              <Badge variant="secondary" className="font-serif">
                {item.keyword}
              </Badge>
            </div>
          )}

          {/* Content */}
          <div className="rounded-lg p-6 border">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium font-serif">洞察内容</h3>
              <Button
                onClick={handleCopyContent}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制
                  </>
                )}
              </Button>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="font-serif leading-relaxed whitespace-pre-line">
                {item.content || "无内容"}
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                标识信息
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">ID: </span>
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                    {item.id}
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">类型: </span>
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                状态信息
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">选中状态: </span>
                  <Badge
                    variant={item.isSelected ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {item.isSelected ? "已选中" : "未选中"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">禁用状态: </span>
                  <Badge
                    variant={item.isDisabled ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {item.isDisabled ? "已禁用" : "正常"}
                  </Badge>
                </div>
                {item.isLoading && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">加载状态: </span>
                    <Badge variant="outline" className="text-xs">
                      加载中...
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Statistics */}
          <div className="rounded-lg p-4 border">
            <h4 className="text-sm font-medium mb-2">内容统计</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="">字符数: </span>
                <span className="font-medium">{item.content?.length || 0}</span>
              </div>
              <div>
                <span className="">段落数: </span>
                <span className="font-medium">
                  {item.content?.split("\n\n").length || 0}
                </span>
              </div>
              <div>
                <span className="">行数: </span>
                <span className="font-medium">
                  {item.content?.split("\n").length || 0}
                </span>
              </div>
              <div>
                <span className="">词数: </span>
                <span className="font-medium">
                  {item.content?.split(/\s+/).filter((word) => word.length > 0)
                    .length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleCopyContent}
              variant="default"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              复制全部内容
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

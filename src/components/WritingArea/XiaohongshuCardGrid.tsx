import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Hash, Copy, Check } from "lucide-react";
import { XiaohongshuCard } from "@/stores/cardsStore";
import { useToast } from "@/hooks/use-toast";

interface XiaohongshuCardGridProps {
  cards: XiaohongshuCard[];
  loading: boolean;
}

export const XiaohongshuCardGrid: React.FC<XiaohongshuCardGridProps> = ({
  cards,
  loading
}) => {
  const { toast } = useToast();
  const [copiedCardId, setCopiedCardId] = React.useState<string | null>(null);

  const handleCopyContent = async (card: XiaohongshuCard) => {
    try {
      await navigator.clipboard.writeText(`
${card.title}

${card.content}`);
      setCopiedCardId(card.id);
      toast({
        title: "已复制",
        description: "小红书内容已复制到剪贴板",
      });
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setCopiedCardId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
      toast({
        title: "复制失败",
        description: "无法复制内容到剪贴板",
        variant: "destructive",
      });
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-black/10 border-t-black rounded-full" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-serif font-semibold text-gray-900 mb-2">
          等待小红书内容
        </h3>
        <p className="text-gray-500 text-center font-serif leading-relaxed max-w-sm">
          AI 将根据对话内容为你生成小红书内容，内容将自动出现在这里
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="space-y-4">
        {cards.map(card => (
          <Card key={card.id} className="border border-red-200 hover:border-red-300 transition-colors relative group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-medium text-gray-900 flex-1 leading-tight">
                  {card.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                    小红书
                  </Badge>
                  {card.keyword && (
                    <Badge variant="outline" className="text-xs">
                      {card.keyword}
                    </Badge>
                  )}
                  {/* 复制按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyContent(card)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 sm:opacity-100 transition-opacity hover:bg-red-50"
                    title="复制内容"
                  >
                    {copiedCardId === card.id ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-red-600" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-3">
                <div className="whitespace-pre-wrap">
                  {card.content}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(card.created_at).toLocaleDateString('zh-CN')}
                </div>
                {card.platform && (
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {card.platform}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 
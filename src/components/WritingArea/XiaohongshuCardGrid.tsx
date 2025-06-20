
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Hash, Copy, Check, Trash2, Edit, Save, X } from "lucide-react";
import { XiaohongshuCard, useCardsStore } from "@/stores/cardsStore";
import { useToast } from "@/hooks/use-toast";
import { cardsApi } from "@/lib/api";

interface XiaohongshuCardGridProps {
  cards: XiaohongshuCard[];
  loading: boolean;
}

export const XiaohongshuCardGrid: React.FC<XiaohongshuCardGridProps> = ({
  cards,
  loading
}) => {
  const { toast } = useToast();
  const { removeXiaohongshuCard, updateXiaohongshuCard } = useCardsStore();
  const [copiedCardId, setCopiedCardId] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cardToDelete, setCardToDelete] = React.useState<XiaohongshuCard | null>(null);
  const [editingCard, setEditingCard] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");

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

  const handleEditClick = (card: XiaohongshuCard) => {
    setEditingCard(card.id);
    setEditTitle(card.title);
    setEditContent(card.content);
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    try {
      // 更新数据库
      await cardsApi.update(editingCard, {
        title: editTitle,
        content: editContent
      });
      
      // 更新本地状态
      updateXiaohongshuCard(editingCard, {
        title: editTitle,
        content: editContent,
        updated_at: new Date().toISOString()
      });
      
      setEditingCard(null);
      toast({
        title: "保存成功",
        description: "小红书内容已更新",
      });
    } catch (error) {
      console.error('Failed to update card:', error);
      toast({
        title: "保存失败",
        description: "无法保存更改",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleDeleteClick = (card: XiaohongshuCard) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;

    try {
      // 调用API删除卡片
      await cardsApi.delete(cardToDelete.id);
      
      // 从store中移除卡片
      removeXiaohongshuCard(cardToDelete.id);
      
      toast({
        title: "删除成功",
        description: "小红书内容已删除",
      });
    } catch (error) {
      console.error('Failed to delete card:', error);
      toast({
        title: "删除失败",
        description: "无法删除小红书内容",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCardToDelete(null);
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
    <>
      <div className="h-full overflow-y-auto p-6 bg-white">
        <div className="space-y-4">
          {cards.map(card => (
            <Card key={card.id} className="border border-red-200 hover:border-red-300 transition-colors relative group">
              <CardContent className="p-4">
                {editingCard === card.id ? (
                  // 编辑模式
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="标题"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveEdit}
                          className="h-8 w-8 p-0 hover:bg-green-50"
                          title="保存"
                        >
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          title="取消"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="内容"
                      className="min-h-[200px] resize-none"
                    />
                  </div>
                ) : (
                  // 查看模式
                  <>
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
                        {/* 编辑按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(card)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 sm:opacity-100 transition-opacity hover:bg-blue-50"
                          title="编辑内容"
                        >
                          <Edit className="w-3 h-3 text-blue-600" />
                        </Button>
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
                    
                    <div className="flex items-center justify-between">
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
                      
                      {/* 删除按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(card)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 sm:opacity-100 transition-opacity hover:bg-red-50"
                        title="删除内容"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条小红书内容吗？删除后将无法恢复。
              <br />
              <br />
              <strong>"{cardToDelete?.title}"</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cardsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface CardData {
  id: string;
  title: string;
  content: string;
  card_order: number;
  createdAt: string;
  updatedAt: string;
}

interface WritingAreaProps {
  projectId: string;
  onCardUpdate?: (cardId: string, content: string) => void;
  onCardCreate?: (cardId: string) => void;
  onTextSelect?: (cardId: string, selectedText: string, instruction: string) => void;
}

export const WritingArea = ({ projectId, onCardUpdate, onCardCreate, onTextSelect }: WritingAreaProps) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [modifyInstruction, setModifyInstruction] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadCards();
  }, [projectId]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await cardsApi.list(projectId);
      setCards(data.map(card => ({
        id: card.id,
        title: card.title || `卡片 ${card.card_order + 1}`,
        content: card.content,
        card_order: card.card_order,
        createdAt: card.created_at,
        updatedAt: card.updated_at,
      })));
    } catch (error) {
      console.error('Failed to load cards:', error);
      toast({
        title: "加载失败",
        description: "无法加载卡片",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    try {
      const newCard = await cardsApi.create(projectId, {
        title: `新草稿`,
        content: "",
        card_order: cards.length,
      });
      
      const cardData: CardData = {
        id: newCard.id,
        title: newCard.title || `新草稿`,
        content: newCard.content,
        card_order: newCard.card_order,
        createdAt: newCard.created_at,
        updatedAt: newCard.updated_at,
      };
      
      setCards([...cards, cardData]);
      setEditingCard(newCard.id);
      setEditingTitle(cardData.title);
      setEditingContent(cardData.content);
      
      onCardCreate?.(newCard.id);
      
      toast({
        title: "卡片创建成功",
        description: "新卡片已创建，开始编辑吧！",
      });
    } catch (error) {
      console.error('Failed to create card:', error);
      toast({
        title: "创建失败",
        description: "无法创建新卡片",
        variant: "destructive",
      });
    }
  };

  const handleEditCard = (card: CardData) => {
    setEditingCard(card.id);
    setEditingTitle(card.title);
    setEditingContent(card.content);
  };

  const handleSaveCard = async () => {
    if (editingCard) {
      try {
        const updatedCard = await cardsApi.update(editingCard, {
          title: editingTitle,
          content: editingContent,
        });
        
        setCards(cards.map(card => 
          card.id === editingCard 
            ? { 
                ...card, 
                title: editingTitle, 
                content: editingContent,
                updatedAt: updatedCard.updated_at
              }
            : card
        ));
        
        onCardUpdate?.(editingCard, editingContent);
        
        setEditingCard(null);
        setEditingTitle("");
        setEditingContent("");
        
        toast({
          title: "保存成功",
          description: "卡片内容已保存",
        });
      } catch (error) {
        console.error('Failed to save card:', error);
        toast({
          title: "保存失败",
          description: "无法保存卡片内容",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditingTitle("");
    setEditingContent("");
  };

  const handleTextSelection = (cardId: string, event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setSelectedText(selectedText);
      setSelectedCardId(cardId);
      setIsModifyDialogOpen(true);
    }
  };

  const handleModifyText = () => {
    if (modifyInstruction.trim() && selectedText && selectedCardId) {
      onTextSelect?.(selectedCardId, selectedText, modifyInstruction);
      setIsModifyDialogOpen(false);
      setModifyInstruction("");
      setSelectedText("");
      setSelectedCardId("");
    }
  };

  // 用于接收从Agent生成的新卡片
  const addCardFromAgent = async (title: string, content: string) => {
    try {
      const newCard = await cardsApi.create(projectId, {
        title,
        content,
        card_order: cards.length,
      });
      
      const cardData: CardData = {
        id: newCard.id,
        title: newCard.title || title,
        content: newCard.content,
        card_order: newCard.card_order,
        createdAt: newCard.created_at,
        updatedAt: newCard.updated_at,
      };
      
      setCards(prev => [...prev, cardData]);
      return newCard.id;
    } catch (error) {
      console.error('Failed to create card from agent:', error);
      toast({
        title: "AI创建卡片失败",
        description: "无法保存AI生成的卡片",
        variant: "destructive",
      });
      return null;
    }
  };

  // 用于更新现有卡片
  const updateCardFromAgent = async (cardTitle: string, content: string) => {
    try {
      // 根据title查找卡片
      const targetCard = cards.find(card => card.title === cardTitle);
      if (!targetCard) {
        console.error('Card not found:', cardTitle);
        return false;
      }

      const updatedCard = await cardsApi.update(targetCard.id, {
        content,
      });
      
      setCards(prev => prev.map(card => 
        card.id === targetCard.id 
          ? { 
              ...card, 
              content,
              updatedAt: updatedCard.updated_at
            }
          : card
      ));
      
      return true;
    } catch (error) {
      console.error('Failed to update card from agent:', error);
      toast({
        title: "AI更新卡片失败",
        description: "无法保存AI更新的卡片",
        variant: "destructive",
      });
      return false;
    }
  };

  // 暴露方法给父组件
  (WritingArea as any).addCardFromAgent = addCardFromAgent;
  (WritingArea as any).updateCardFromAgent = updateCardFromAgent;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-600">加载卡片中...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">写作区</h2>
          <Button
            onClick={handleCreateCard}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增卡片
          </Button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-w-max">
          {cards.map((card) => (
            <Card
              key={card.id}
              className="w-80 h-[600px] flex flex-col bg-white/70 backdrop-blur-sm border-purple-200 shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {editingCard === card.id ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="text-lg font-semibold border-0 px-0 focus:ring-0"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
                  )}
                  
                  {editingCard === card.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveCard}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCard(card)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  更新于 {new Date(card.updatedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {editingCard === card.id ? (
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="flex-1 resize-none border-purple-200 focus:border-purple-400"
                    placeholder="在这里写下你的小红书内容..."
                  />
                ) : (
                  <div 
                    className="flex-1 overflow-y-auto cursor-text"
                    onClick={(e) => handleTextSelection(card.id, e)}
                  >
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {card.content || "点击编辑按钮开始创作..."}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 文本修改对话框 */}
      <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改选中文本</DialogTitle>
            <DialogDescription>
              请描述你希望如何修改这段文字：
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">选中的文本：</p>
              <p className="text-sm font-medium">{selectedText}</p>
            </div>
            <Textarea
              placeholder="例如：让这段话更活泼一点、帮我换种说法..."
              value={modifyInstruction}
              onChange={(e) => setModifyInstruction(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsModifyDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleModifyText}
                disabled={!modifyInstruction.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                提交修改
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface CardData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface WritingAreaProps {
  projectId: string;
  onCardUpdate?: (cardId: string, content: string) => void;
  onCardCreate?: (cardId: string) => void;
  onTextSelect?: (cardId: string, selectedText: string) => void;
}

export const WritingArea = ({ projectId, onCardUpdate, onCardCreate, onTextSelect }: WritingAreaProps) => {
  const [cards, setCards] = useState<CardData[]>([
    {
      id: "1",
      title: "草稿 V1",
      content: "🌸春季护肤小贴士🌸\n\n姐妹们！春天来了，换季护肤一定要注意这几点：\n\n✨ 温和清洁很重要，别用太刺激的洁面\n💧 补水保湿不能少，多喝水多敷面膜\n🌿 防晒更要做好，紫外线开始强了\n\n你们还有什么春季护肤心得吗？评论区聊聊～\n\n#春季护肤 #护肤心得 #美妆分享",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
    },
  ]);
  
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [modifyInstruction, setModifyInstruction] = useState("");

  const handleCreateCard = () => {
    const newCardId = Date.now().toString();
    const newCard: CardData = {
      id: newCardId,
      title: `新草稿`,
      content: "",
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCards([...cards, newCard]);
    setEditingCard(newCard.id);
    setEditingTitle(newCard.title);
    setEditingContent(newCard.content);
    
    // 通知聊天区有新卡片创建
    onCardCreate?.(newCardId);
  };

  const handleEditCard = (card: CardData) => {
    setEditingCard(card.id);
    setEditingTitle(card.title);
    setEditingContent(card.content);
  };

  const handleSaveCard = () => {
    if (editingCard) {
      setCards(cards.map(card => 
        card.id === editingCard 
          ? { 
              ...card, 
              title: editingTitle, 
              content: editingContent,
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : card
      ));
      
      // 通知聊天区卡片已更新
      onCardUpdate?.(editingCard, editingContent);
      
      setEditingCard(null);
      setEditingTitle("");
      setEditingContent("");
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
      onTextSelect?.(selectedCardId, selectedText);
      setIsModifyDialogOpen(false);
      setModifyInstruction("");
      setSelectedText("");
      setSelectedCardId("");
    }
  };

  // 从Agent接收的新卡片或更新的卡片
  const handleReceiveCard = (cardId: string | null, content: string, title?: string) => {
    if (cardId) {
      // 更新现有卡片
      setCards(cards.map(card =>
        card.id === cardId
          ? {
              ...card,
              content,
              title: title || card.title,
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : card
      ));
    } else {
      // 创建新卡片
      const newCard: CardData = {
        id: Date.now().toString(),
        title: title || `AI草稿 ${Date.now()}`,
        content,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setCards([...cards, newCard]);
    }
  };

  // 暴露方法给父组件
  (WritingArea as any).handleReceiveCard = handleReceiveCard;

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
                  更新于 {card.updatedAt}
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

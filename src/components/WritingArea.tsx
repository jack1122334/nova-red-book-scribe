
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface CardData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface WritingAreaProps {
  projectId: string;
}

export const WritingArea = ({ projectId }: WritingAreaProps) => {
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

  const handleCreateCard = () => {
    const newCard: CardData = {
      id: Date.now().toString(),
      title: `新草稿`,
      content: "",
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCards([...cards, newCard]);
    setEditingCard(newCard.id);
    setEditingTitle(newCard.title);
    setEditingContent(newCard.content);
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
      setEditingCard(null);
      setEditingTitle("");
      setEditingContent("");
      
      // TODO: Send system message to chat
      console.log("User completed editing card:", editingCard);
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditingTitle("");
    setEditingContent("");
  };

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
                  <div className="flex-1 overflow-y-auto">
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
    </div>
  );
};

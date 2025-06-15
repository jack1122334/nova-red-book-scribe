
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Edit3, Trash2, Save, X, Link, FileText } from "lucide-react";
import { cardsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WritingAreaProps {
  projectId: string;
  onCardUpdate: (cardId: string, content: string, title?: string) => void;
  onCardCreate: (cardId: string) => void;
  onTextSelect: (cardId: string, selectedText: string, instruction: string) => void;
  onAddReference?: (reference: any) => void;
}

interface Card {
  id: string;
  title: string | null;
  content: string;
  card_order: number;
  created_at: string;
  updated_at: string;
}

export interface WritingAreaRef {
  addCardFromAgent: (title: string, content: string) => Promise<void>;
  updateCardFromAgent: (cardTitle: string, content: string) => Promise<void>;
}

export const WritingArea = forwardRef<WritingAreaRef, WritingAreaProps>(
  ({ projectId, onCardUpdate, onCardCreate, onTextSelect, onAddReference }, ref) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedText, setSelectedText] = useState("");
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
      addCardFromAgent: async (title: string, content: string) => {
        try {
          const newCard = await cardsApi.create({
            project_id: projectId,
            title: title,
            content: content,
            card_order: cards.length,
          });
          setCards(prev => [...prev, newCard]);
          onCardCreate(newCard.id);
          toast({
            title: "新卡片已创建",
            description: `AI 创建了新卡片"${title}"`,
          });
        } catch (error) {
          console.error('Failed to create card from agent:', error);
          toast({
            title: "创建失败",
            description: "AI 创建卡片时发生错误",
            variant: "destructive",
          });
        }
      },
      updateCardFromAgent: async (cardTitle: string, content: string) => {
        try {
          const card = await cardsApi.findByTitle(projectId, cardTitle);
          if (card) {
            const updatedCard = await cardsApi.update(card.id, { content });
            setCards(prev => prev.map(c => c.id === card.id ? updatedCard : c));
            onCardUpdate(card.id, content);
            toast({
              title: "卡片已更新",
              description: `AI 更新了卡片"${cardTitle}"`,
            });
          }
        } catch (error) {
          console.error('Failed to update card from agent:', error);
          toast({
            title: "更新失败",
            description: "AI 更新卡片时发生错误",
            variant: "destructive",
          });
        }
      },
    }));

    useEffect(() => {
      loadCards();
    }, [projectId]);

    const loadCards = async () => {
      try {
        setLoading(true);
        const data = await cardsApi.list(projectId);
        setCards(data);
      } catch (error) {
        console.error('Failed to load cards:', error);
        toast({
          title: "加载失败",
          description: "无法加载卡片列表",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleTextSelection = (cardId: string) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString().trim();
        setSelectedText(text);
        setSelectedCardId(cardId);
        console.log('Text selected:', { cardId, text });
      }
    };

    const handleAddReference = (card: Card, type: 'full_card' | 'text_snippet') => {
      if (!onAddReference) return;

      const reference = {
        type,
        card_id: card.id,
        card_friendly_title: card.title || `卡片-${card.id.slice(0, 8)}`,
        user_remark: type === 'full_card' ? '请参考整个卡片的内容' : '请参考选中的文本片段',
        ...(type === 'text_snippet' && selectedText ? { snippet_content: selectedText } : {})
      };

      onAddReference(reference);
      
      // Clear selection
      setSelectedText("");
      setSelectedCardId(null);
      window.getSelection()?.removeAllRanges();
    };

    const handleCreateCard = async () => {
      try {
        const newCard = await cardsApi.create({
          project_id: projectId,
          title: `新卡片 ${cards.length + 1}`,
          content: "",
          card_order: cards.length,
        });
        setCards(prev => [...prev, newCard]);
        onCardCreate(newCard.id);
        toast({
          title: "新卡片已创建",
          description: "您可以开始编辑新卡片了",
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

    const handleEditCard = (card: Card) => {
      setEditingCard(card.id);
      setEditTitle(card.title || "");
      setEditContent(card.content);
    };

    const handleSaveEdit = async () => {
      if (!editingCard) return;

      try {
        const updatedCard = await cardsApi.update(editingCard, {
          title: editTitle || null,
          content: editContent,
        });
        setCards(prev => prev.map(c => c.id === editingCard ? updatedCard : c));
        
        // 通知父组件用户编辑了卡片
        onCardUpdate(editingCard, editContent, editTitle || undefined);
        
        setEditingCard(null);
        toast({
          title: "卡片已保存",
          description: "您的编辑已保存并通知给AI",
        });
      } catch (error) {
        console.error('Failed to update card:', error);
        toast({
          title: "保存失败",
          description: "无法保存卡片更改",
          variant: "destructive",
        });
      }
    };

    const handleDeleteCard = async (cardId: string) => {
      try {
        await cardsApi.delete(cardId);
        setCards(prev => prev.filter(c => c.id !== cardId));
        toast({
          title: "卡片已删除",
          description: "卡片已从项目中移除",
        });
      } catch (error) {
        console.error('Failed to delete card:', error);
        toast({
          title: "删除失败",
          description: "无法删除卡片",
          variant: "destructive",
        });
      }
    };

    if (loading) {
      return (
        <div className="p-6 flex items-center justify-center bg-hermes-50">
          <div className="animate-spin w-6 h-6 border-2 border-hermes-300 border-t-hermes-500 rounded-full" />
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-hermes-50 border-r-2 border-hermes-500">
        {/* Header */}
        <div className="p-6 border-b-2 border-hermes-500 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black font-serif">创作卡片</h2>
              <p className="text-sm text-gray-700 mt-1 font-serif">管理您的内容草稿和创作素材</p>
            </div>
            <Button
              onClick={handleCreateCard}
              size="sm"
              className="bg-hermes-500 hover:bg-hermes-600 text-white font-serif shadow-hermes border-2 border-hermes-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建卡片
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-700 p-6">
              <div className="w-20 h-20 rounded-full bg-white border-2 border-hermes-500 flex items-center justify-center mb-4 shadow-hermes">
                <FileText className="w-10 h-10 text-hermes-500" />
              </div>
              <h3 className="text-lg font-medium text-black mb-2 font-serif">还没有创作卡片</h3>
              <p className="text-sm text-center max-w-md mb-6 font-serif text-gray-700 leading-relaxed">
                卡片是您的创作素材库，可以保存草稿、想法和参考内容，方便在对话中引用。
              </p>
              <Button
                onClick={handleCreateCard}
                className="bg-hermes-500 hover:bg-hermes-600 text-white font-serif shadow-hermes"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建第一个卡片
              </Button>
            </div>
          ) : (
            <div className="h-full overflow-x-auto overflow-y-hidden p-6">
              <div className="flex gap-4 h-full min-w-fit">
                {cards.map((card) => (
                  <Card key={card.id} className="w-80 h-full border-2 border-hermes-500 hover:border-hermes-600 transition-all duration-200 bg-white shadow-hermes hover:shadow-hermes-strong flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0 bg-hermes-50 border-b border-hermes-300">
                      <div className="flex items-start justify-between gap-2">
                        {editingCard === card.id ? (
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="卡片标题"
                            className="text-sm font-medium border-0 p-0 h-auto focus:ring-0 flex-1 bg-transparent font-serif"
                          />
                        ) : (
                          <CardTitle className="text-sm font-medium text-black flex-1 line-clamp-2 font-serif">
                            {card.title || "未命名卡片"}
                          </CardTitle>
                        )}
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Reference buttons */}
                          {editingCard !== card.id && onAddReference && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddReference(card, 'full_card')}
                                className="h-7 w-7 p-0 text-gray-500 hover:text-hermes-600 hover:bg-hermes-100 rounded-xl border border-transparent hover:border-hermes-300"
                                title="引用整个卡片"
                              >
                                <Link className="w-3 h-3" />
                              </Button>
                              {selectedText && selectedCardId === card.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddReference(card, 'text_snippet')}
                                  className="h-7 px-1.5 text-hermes-600 hover:text-hermes-700 hover:bg-hermes-100 text-xs font-serif rounded-xl border border-transparent hover:border-hermes-300"
                                  title="引用选中文本"
                                >
                                  <Link className="w-2.5 h-2.5 mr-0.5" />
                                  片段
                                </Button>
                              )}
                            </>
                          )}
                          
                          {/* Edit/Save buttons */}
                          {editingCard === card.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                                className="h-7 w-7 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCard(null)}
                                className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCard(card)}
                                className="h-7 w-7 p-0 text-gray-500 hover:text-hermes-600 hover:bg-hermes-100 rounded-xl border border-transparent hover:border-hermes-300"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCard(card.id)}
                                className="h-7 w-7 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col min-h-0 bg-white">
                      {editingCard === card.id ? (
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="输入卡片内容..."
                          className="flex-1 resize-none border-2 border-hermes-300 focus:border-hermes-500 focus:ring-0 text-sm bg-white font-serif leading-relaxed rounded-2xl"
                        />
                      ) : (
                        <div 
                          className="flex-1 whitespace-pre-wrap text-gray-800 cursor-text leading-relaxed text-sm overflow-y-auto font-serif"
                          onMouseUp={() => handleTextSelection(card.id)}
                        >
                          {card.content || (
                            <span className="text-gray-500 italic">暂无内容，点击编辑按钮开始写作</span>
                          )}
                        </div>
                      )}
                      
                      {/* Show selected text indicator */}
                      {selectedText && selectedCardId === card.id && (
                        <div className="mt-3">
                          <div className="bg-hermes-50 border-2 border-hermes-300 rounded-2xl p-3">
                            <p className="text-xs text-black font-medium mb-1 font-serif">
                              已选中文本
                            </p>
                            <p className="text-xs text-gray-700 mb-2 font-serif">
                              "{selectedText.substring(0, 80)}..."
                            </p>
                            <p className="text-xs text-gray-600 font-serif">
                              点击"片段"按钮将此文本添加为引用
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

WritingArea.displayName = "WritingArea";

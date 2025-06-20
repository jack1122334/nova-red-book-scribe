import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { cardsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WritingAreaHeader } from "./WritingArea/WritingAreaHeader";
import { WritingCardGrid } from "./WritingArea/WritingCardGrid";
import { EmptyState } from "./WritingArea/EmptyState";
import { XiaohongshuCardGrid } from "./WritingArea/XiaohongshuCardGrid";
import { useCardsStore, type XiaohongshuCard } from "@/stores/cardsStore";

interface WritingAreaProps {
  projectId: string;
  onCardUpdate: (cardId: string, content: string, title?: string) => void;
  onCardCreate: (cardId: string) => void;
  onTextSelect: (cardId: string, selectedText: string, instruction: string) => void;
  onAddReference?: (reference: Record<string, unknown>) => void;
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
  switchToXiaohongshuTab: () => void;
}

export const WritingArea = forwardRef<WritingAreaRef, WritingAreaProps>(({
  projectId,
  onCardUpdate,
  onCardCreate,
  onTextSelect,
  onAddReference
}, ref) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'drafts' | 'xiaohongshu'>('xiaohongshu');
  const { toast } = useToast();

  // 使用 cardsStore 来管理小红书内容
  const {
    xiaohongshuCards,
    loading: cardsLoading,
    loadProjectCards,
    setCurrentProject,
  } = useCardsStore();

  useImperativeHandle(ref, () => ({
    addCardFromAgent: async (title: string, content: string) => {
      try {
        const newCard = await cardsApi.create({
          project_id: projectId,
          title: title,
          content: content,
          card_order: cards.length
        });
        setCards(prev => [...prev, newCard]);
        onCardCreate(newCard.id);
        toast({
          title: "新卡片已创建",
          description: `AI 创建了新卡片"${title}"`
        });
      } catch (error) {
        console.error('Failed to create card from agent:', error);
        toast({
          title: "创建失败",
          description: "AI 创建卡片时发生错误",
          variant: "destructive"
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
            description: `AI 更新了卡片"${cardTitle}"`
          });
        }
      } catch (error) {
        console.error('Failed to update card from agent:', error);
        toast({
          title: "更新失败",
          description: "AI 更新卡片时发生错误",
          variant: "destructive"
        });
      }
    },
    switchToXiaohongshuTab: () => {
      setActiveTab('xiaohongshu');
    }
  }));

  useEffect(() => {
    // loadCards();
    loadXiaohongshuCards();
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadXiaohongshuCards = async () => {
    try {
      setLoading(true);
      setCurrentProject(projectId);
      await loadProjectCards(projectId);
    } catch (error) {
      console.error("Failed to load xiaohongshu cards:", error);
      toast({
        title: "加载小红书内容失败",
        description: "无法加载小红书内容列表",
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
      ...(type === 'text_snippet' && selectedText ? {
        snippet_content: selectedText
      } : {})
    };
    onAddReference(reference);

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
        card_order: cards.length
      });
      setCards(prev => [...prev, newCard]);
      onCardCreate(newCard.id);
      toast({
        title: "新卡片已创建",
        description: "您可以开始编辑新卡片了"
      });
    } catch (error) {
      console.error('Failed to create card:', error);
      toast({
        title: "创建失败",
        description: "无法创建新卡片",
        variant: "destructive"
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
        content: editContent
      });
      setCards(prev => prev.map(c => c.id === editingCard ? updatedCard : c));

      onCardUpdate(editingCard, editContent, editTitle || undefined);
      setEditingCard(null);
      toast({
        title: "卡片已保存",
        description: "您的编辑已保存并通知给AI"
      });
    } catch (error) {
      console.error('Failed to update card:', error);
      toast({
        title: "保存失败",
        description: "无法保存卡片更改",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await cardsApi.delete(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast({
        title: "卡片已删除",
        description: "卡片已从项目中移除"
      });
    } catch (error) {
      console.error('Failed to delete card:', error);
      toast({
        title: "删除失败",
        description: "无法删除卡片",
        variant: "destructive"
      });
    }
  };

  const toggleCardCollapse = (cardId: string) => {
    setCollapsedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-white border-t-black rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-black/10 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">Draft</h2>
          {activeTab === 'drafts' && (
            <button
              onClick={handleCreateCard}
              className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
            >
              新建卡片
            </button>
          )}
        </div>
        
        {/* 标签页 */}
        <div className="hidden flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'drafts'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            草稿内容 ({cards.length})
          </button>
          <button
            onClick={() => setActiveTab('xiaohongshu')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'xiaohongshu'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            小红书内容 ({xiaohongshuCards.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'drafts' ? (
          cards.length === 0 ? (
            <EmptyState onCreateCard={handleCreateCard} />
          ) : (
            <WritingCardGrid
              cards={cards}
              editingCard={editingCard}
              editTitle={editTitle}
              editContent={editContent}
              selectedText={selectedText}
              selectedCardId={selectedCardId}
              collapsedCards={collapsedCards}
              onEditCard={handleEditCard}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingCard(null)}
              onDeleteCard={handleDeleteCard}
              onTextSelection={handleTextSelection}
              onAddReference={handleAddReference}
              onToggleCollapse={toggleCardCollapse}
              setEditTitle={setEditTitle}
              setEditContent={setEditContent}
            />
          )
        ) : (
          <XiaohongshuCardGrid
            cards={xiaohongshuCards}
            loading={cardsLoading}
          />
        )}
      </div>
    </div>
  );
});

WritingArea.displayName = "WritingArea";

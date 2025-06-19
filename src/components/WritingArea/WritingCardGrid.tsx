
import React from "react";
import { WritingCard } from "./WritingCard";

interface Card {
  id: string;
  title: string | null;
  content: string;
  card_order: number;
  created_at: string;
  updated_at: string;
}

interface WritingCardGridProps {
  cards: Card[];
  editingCard: string | null;
  editTitle: string;
  editContent: string;
  selectedText: string;
  selectedCardId: string | null;
  collapsedCards: Set<string>;
  onEditCard: (card: Card) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteCard: (cardId: string) => void;
  onTextSelection: (cardId: string) => void;
  onAddReference: (card: Card, type: 'full_card' | 'text_snippet') => void;
  onToggleCollapse: (cardId: string) => void;
  setEditTitle: (title: string) => void;
  setEditContent: (content: string) => void;
}

export const WritingCardGrid: React.FC<WritingCardGridProps> = ({
  cards,
  editingCard,
  editTitle,
  editContent,
  selectedText,
  selectedCardId,
  collapsedCards,
  onEditCard,
  onSaveEdit,
  onCancelEdit,
  onDeleteCard,
  onTextSelection,
  onAddReference,
  onToggleCollapse,
  setEditTitle,
  setEditContent
}) => {
  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className={cards.length === 1 ? "space-y-4" : "columns-2 gap-4 space-y-4"}>
        {cards.map(card => (
          <WritingCard
            key={card.id}
            card={card}
            isEditing={editingCard === card.id}
            editTitle={editTitle}
            editContent={editContent}
            selectedText={selectedText}
            selectedCardId={selectedCardId}
            isCollapsed={collapsedCards.has(card.id)}
            onEdit={() => onEditCard(card)}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onDelete={() => onDeleteCard(card.id)}
            onTextSelection={() => onTextSelection(card.id)}
            onAddReference={(type) => onAddReference(card, type)}
            onToggleCollapse={() => onToggleCollapse(card.id)}
            setEditTitle={setEditTitle}
            setEditContent={setEditContent}
          />
        ))}
      </div>
    </div>
  );
};

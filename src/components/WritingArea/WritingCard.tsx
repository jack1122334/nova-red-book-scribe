
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit3, Trash2, Save, X, Link, ChevronDown, ChevronUp } from "lucide-react";

interface Card {
  id: string;
  title: string | null;
  content: string;
  card_order: number;
  created_at: string;
  updated_at: string;
}

interface WritingCardProps {
  card: Card;
  isEditing: boolean;
  editTitle: string;
  editContent: string;
  selectedText: string;
  selectedCardId: string | null;
  isCollapsed: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onTextSelection: () => void;
  onAddReference: (type: 'full_card' | 'text_snippet') => void;
  onToggleCollapse: () => void;
  setEditTitle: (title: string) => void;
  setEditContent: (content: string) => void;
}

export const WritingCard: React.FC<WritingCardProps> = ({
  card,
  isEditing,
  editTitle,
  editContent,
  selectedText,
  selectedCardId,
  isCollapsed,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onTextSelection,
  onAddReference,
  onToggleCollapse,
  setEditTitle,
  setEditContent
}) => {
  return (
    <Card className="break-inside-avoid mb-4 rounded-2xl bg-white border border-gray-200">
      <CardHeader className="pb-3 flex-shrink-0 bg-gray-100 rounded-t-2xl">
        <div className="flex items-start justify-between gap-2">
          {isEditing ? (
            <Input 
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)} 
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
            {!isEditing && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onAddReference('full_card')} 
                  className="h-7 w-7 p-0 text-black hover:text-white hover:bg-black rounded-lg" 
                  title="引用整个卡片"
                >
                  <Link className="w-3 h-3" />
                </Button>
                {selectedText && selectedCardId === card.id && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onAddReference('text_snippet')} 
                    className="h-7 px-1.5 text-black hover:text-white hover:bg-black text-xs font-serif rounded-lg" 
                    title="引用选中文本"
                  >
                    <Link className="w-2.5 h-2.5 mr-0.5" />
                    片段
                  </Button>
                )}
              </>
            )}
            
            {/* Collapse button */}
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleCollapse} 
                className="h-7 w-7 p-0 text-black hover:text-white hover:bg-black rounded-lg"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </Button>
            )}
            
            {/* Edit/Save buttons */}
            {isEditing ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onSave} 
                  className="h-7 w-7 p-0 text-black hover:text-white hover:bg-black rounded-lg"
                >
                  <Save className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCancel} 
                  className="h-7 w-7 p-0 text-black hover:text-white hover:bg-black rounded-lg"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onEdit} 
                  className="h-7 w-7 p-0 text-black hover:text-white hover:bg-black rounded-lg"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onDelete} 
                  className="h-7 w-7 p-0 text-black hover:text-white hover:bg-black rounded-lg"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="flex-1 flex flex-col min-h-0 bg-white rounded-b-2xl">
          {isEditing ? (
            <Textarea 
              value={editContent} 
              onChange={e => setEditContent(e.target.value)} 
              placeholder="输入卡片内容..." 
              className="flex-1 resize-none text-sm font-serif leading-relaxed min-h-32" 
            />
          ) : (
            <div 
              className="flex-1 whitespace-pre-wrap text-black cursor-text leading-relaxed text-sm font-serif" 
              onMouseUp={onTextSelection}
            >
              {card.content || <span className="text-black/60 italic">暂无内容，点击编辑按钮开始写作</span>}
            </div>
          )}
          
          {/* Show selected text indicator */}
          {selectedText && selectedCardId === card.id && (
            <div className="mt-3">
              <div className="bg-black/10 border border-black/20 rounded-lg p-3">
                <p className="text-xs text-black font-medium mb-1 font-serif">
                  已选中文本
                </p>
                <p className="text-xs text-black/80 mb-2 font-serif">
                  "{selectedText.substring(0, 80)}..."
                </p>
                <p className="text-xs text-black/60 font-serif">
                  点击"片段"按钮将此文本添加为引用
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

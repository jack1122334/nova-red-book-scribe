import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, RotateCcw, Heart, Star, MessageCircle, Grid3X3, Sparkles } from "lucide-react";
import { CanvasItem } from "@/stores/canvasStore";
import { CanvasItemModal } from "./CanvasItemModal";
import { imageProxyApi } from "@/lib/api";
import { motion } from "framer-motion";

interface CanvasGridProps {
  items: CanvasItem[];
  selectedItems: Set<string>;
  canvasReferences: CanvasItem[];
  onCheckboxChange: (itemId: string, checked: boolean) => void;
  onBatchSelect: () => void;
  onBatchDisable: () => void;
  onRestore: (itemId: string) => void;
  keywords?: string[];
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  items,
  selectedItems,
  canvasReferences,
  onCheckboxChange,
  onBatchSelect,
  onBatchDisable,
  onRestore,
  keywords = []
}) => {
  const [selectedCard, setSelectedCard] = useState<CanvasItem | null>(null);

  // 如果没有items，显示空状态
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Grid3X3 className="w-10 h-10 text-gray-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-serif font-semibold text-gray-900 mb-2">
          Canvas 等待内容
        </h3>
        <p className="text-gray-500 text-center font-serif leading-relaxed max-w-sm">
          与 AI 对话后，相关的创意内容和案例将在这里展示，帮助你获得更多灵感
        </p>
      </div>
    );
  }

  // 按关键词分组items，每个关键词对应3个卡片
  const groupedItems = keywords.length > 0 ? 
    keywords.map((keyword, index) => ({
      keyword,
      items: items.slice(index * 3, (index + 1) * 3)
    })) : 
    [{ keyword: '', items }];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const handleCardClick = (item: CanvasItem) => {
    if (!item.isLoading && !item.isDisabled) {
      setSelectedCard(item);
    }
  };

  // 检查item是否在canvasReferences中
  const isInReferences = (itemId: string) => {
    return canvasReferences.some(ref => ref.id === itemId);
  };

  return (
    <div className="relative">
      <div className="space-y-1 mb-4">
        {groupedItems.map((group, groupIndex) => (
          <div key={groupIndex} className="flex gap-3">
            {/* Keyword Label */}
            {group.keyword && (
              <div className="flex-shrink-0 w-20 flex items-center">
                <div className="text-sm font-medium text-black/70 font-serif">
                  {group.keyword.slice(0, 24)}
                </div>
              </div>
            )}

            {/* 3x1 Grid for this keyword */}
            <div className="flex-1 grid grid-cols-3 gap-1">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className={`relative aspect-square ${
                    item.isDisabled ? "opacity-30" : ""
                  }`}
                >
                  <Card
                    className={`h-full !rounded-sm transition-all duration-500 overflow-hidden cursor-pointer relative ${
                      isInReferences(item.id)
                        ? "ring-2 ring-black bg-black/5"
                        : item.isSelected
                        ? "ring-2 ring-gray-400 bg-gray-50"
                        : "hover:shadow-md hover:-translate-y-0.5"
                    } ${item.isLoading ? "animate-pulse" : "animate-fadeIn"}`}
                    onClick={() => handleCardClick(item)}
                  >
                    {/* Background Image */}
                    {item.cover_url && (
                      <div className="absolute inset-0 opacity-20 hover:opacity-40 transition-opacity duration-300">
                        <motion.img
                          layoutId={`canvas-image-${item.id}`}
                          referrerPolicy="no-referrer"
                          src={imageProxyApi.getProxiedImageUrl(item.cover_url)}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-sm"
                          onError={(e) => {
                            // 如果代理失败，尝试使用原始URL
                            const currentSrc = e.currentTarget.src;
                            if (currentSrc !== item.cover_url) {
                              e.currentTarget.src = item.cover_url;
                            } else {
                              e.currentTarget.style.display = "none";
                            }
                          }}
                        />
                      </div>
                    )}
                    <CardContent className="p-3 h-full flex flex-col relative z-10 backdrop-blur-[1px] hover:backdrop-blur-[0px]">
                      <div className="flex items-start justify-between mb-2">
                        <motion.span 
                          // layoutId={`canvas-title-${item.id}`}
                          className="text-sm text-black font-serif mb-1 line-clamp-2"
                        >
                          {item.isDisabled ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-5 w-5 p-0 mr-1 rounded-full hover:bg-green-50 hover:border-green-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestore(item.id);
                              }}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) =>
                                onCheckboxChange(item.id, checked as boolean)
                              }
                              disabled={item.isDisabled || item.isLoading}
                              className="flex-shrink-0 mr-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          {item.title}
                        </motion.span>
                      </div>

                      <div className="flex-1 flex flex-col">
                        {item.isLoading ? (
                          <>
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                          </>
                        ) : (
                          <>
                            {item.author && (
                              <motion.span 
                                layoutId={`canvas-author-${item.id}`}
                                className="text-xs text-black/50 font-serif mb-1"
                              >
                                作者: {item.author}
                              </motion.span>
                            )}
                            <div className="flex-1"></div>
                            {/* 互动数据 - 固定在右下角 */}
                            <div className="w-full absolute bg-white/60 backdrop-blur-sm rounded-sm bottom-0 right-0 flex items-center justify-end gap-1 text-xs text-black/60 mt-auto">
                              {item.like_count && item.like_count > 0 ? (
                                <div className="flex items-center gap-[1px]">
                                  <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                                  <span>{formatNumber(item.like_count)}</span>
                                </div>
                              ) : null}

                              {item.collect_count && item.collect_count > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>
                                    {formatNumber(item.collect_count)}
                                  </span>
                                </div>
                              ) : null}
                              {item.comment_count && item.comment_count > 0 ? (
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3 text-blue-400" />
                                  <span>
                                    {formatNumber(item.comment_count)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Batch Operation Buttons */}
      {selectedItems.size > 0 && (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="default"
            className="h-8 w-8 p-0 rounded-full"
            onClick={onBatchSelect}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
            onClick={onBatchDisable}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Canvas Item Modal */}
      <CanvasItemModal
        item={selectedCard}
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};

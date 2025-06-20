import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Star, 
  MessageCircle, 
  Share, 
  ExternalLink,
  MapPin,
  Calendar
} from "lucide-react";
import { CanvasItem } from "@/stores/canvasStore";
import { imageProxyApi } from "@/lib/api";
import { motion } from "framer-motion";

interface CanvasItemModalProps {
  item: CanvasItem | null;
  open: boolean;
  onClose: () => void;
}

export const CanvasItemModal: React.FC<CanvasItemModalProps> = ({
  item,
  open,
  onClose
}) => {
  if (!item) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const handleOpenOriginal = () => {
    if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-black">
            <motion.span layoutId={`canvas-title-${item.id}`}>
              {item.title}
            </motion.span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-row gap-4">
            {/* Cover Image */}
            {item.cover_url && (
              <div className="relative w-1/3 min-w-[200px] max-h-[320px] aspect-[3/4] rounded-lg bg-gray-100">
                <motion.img
                  layoutId={`canvas-image-${item.id}`}
                  referrerPolicy="no-referrer"
                  src={imageProxyApi.getProxiedImageUrl(item.cover_url)}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-lg"
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
            {/* Content */}
            <div className="flex-1 bg-gray-50 rounded-lg p-4">
              <p className="text-black font-serif whitespace-pre-line">
                {item.content || "无内容"}
              </p>
            </div>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={
                  item.author_avatar
                    ? imageProxyApi.getProxiedImageUrl(item.author_avatar)
                    : undefined
                }
                alt={item.author}
              />
              <AvatarFallback className="font-serif">
                {item.author?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <motion.div 
                // layoutId={`canvas-author-${item.id}`}
                className="font-medium text-black font-serif"
              >
                {item.author}
              </motion.div>
              {item.ip_location && (
                <div className="flex items-center gap-1 text-sm text-black/60">
                  <MapPin className="w-3 h-3" />
                  {item.ip_location}
                </div>
              )}
            </div>
            <Badge variant="secondary" className="font-serif">
              {item.platform === "xiaohongshu" ? "小红书" : item.platform}
            </Badge>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-6">
              {item.like_count && item.like_count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                  <span className="font-medium">
                    {formatNumber(item.like_count)}
                  </span>
                  <span className="text-black/60">点赞</span>
                </div>
              )}
              {item.collect_count && item.collect_count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {formatNumber(item.collect_count)}
                  </span>
                  <span className="text-black/60">收藏</span>
                </div>
              )}
              {item.comment_count && item.comment_count > 0 && (
                <motion.div 
                  layoutId={`canvas-comment-${item.id}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">
                    {formatNumber(item.comment_count)}
                  </span>
                  <span className="text-black/60">评论</span>
                </motion.div>
              )}
              {item.share_count && item.share_count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Share className="w-4 h-4 text-green-400" />
                  <span className="font-medium">
                    {formatNumber(item.share_count)}
                  </span>
                  <span className="text-black/60">分享</span>
                </div>
              )}
            </div>
          </div>

          {/* Create Time */}
          {item.create_time && (
            <div className="flex items-center gap-2 text-sm text-black/60">
              <Calendar className="w-4 h-4" />
              创建时间: {item.create_time}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {item.url && (
              <Button
                onClick={handleOpenOriginal}
                className="flex-1"
                variant="default"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                查看原文
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="flex-1">
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userBackgroundCardsApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const CARD_TYPES = {
  personalities: "人设定位",
  intentions: "写作目的",
  resources: "账号资源",
} as const;

interface BackgroundCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string;
  card?: any;
}

export const BackgroundCardDialog: React.FC<BackgroundCardDialogProps> = ({
  open,
  onOpenChange,
  type,
  card,
}) => {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (card) {
      setContent(card.content || '');
    } else {
      setContent('');
    }
  }, [card]);

  const createMutation = useMutation({
    mutationFn: userBackgroundCardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBackgroundCards'] });
      onOpenChange(false);
      setContent('');
      toast({
        title: '创建成功',
        description: '背景卡片已创建',
      });
    },
    onError: (error) => {
      toast({
        title: '创建失败',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      userBackgroundCardsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBackgroundCards'] });
      onOpenChange(false);
      setContent('');
      toast({
        title: '更新成功',
        description: '背景卡片已更新',
      });
    },
    onError: (error) => {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: '内容不能为空',
        description: '请填写卡片内容',
        variant: 'destructive',
      });
      return;
    }

    if (card) {
      updateMutation.mutate({
        id: card.id,
        updates: { content: content.trim() }
      });
    } else {
      createMutation.mutate({
        type,
        content: content.trim()
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {card ? '编辑' : '添加'}{CARD_TYPES[type as keyof typeof CARD_TYPES]}
          </DialogTitle>
          <DialogDescription>
            {card ? '修改' : '创建'}您的{CARD_TYPES[type as keyof typeof CARD_TYPES]}信息
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`请输入${CARD_TYPES[type as keyof typeof CARD_TYPES]}内容...`}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

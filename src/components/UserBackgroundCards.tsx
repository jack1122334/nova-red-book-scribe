import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userBackgroundCardsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { BackgroundCardDialog } from '@/components/BackgroundCardDialog';
import { useToast } from '@/hooks/use-toast';

const CARD_TYPES = {
  personalities: '人设定位',
  intentions: '写作目的',
  resources: '账号资源'
} as const;

export const UserBackgroundCards = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedType, setSelectedType] = useState('personalities');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['userBackgroundCards'],
    queryFn: userBackgroundCardsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: userBackgroundCardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBackgroundCards'] });
      toast({
        title: '删除成功',
        description: '背景卡片已删除',
      });
    },
    onError: (error) => {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAdd = (type: string) => {
    setSelectedType(type);
    setEditingCard(null);
    setDialogOpen(true);
  };

  const handleEdit = (card: any) => {
    setEditingCard(card);
    setSelectedType(card.type);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这张背景卡片吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const groupedCards = cards.reduce((acc, card) => {
    if (!acc[card.type]) {
      acc[card.type] = [];
    }
    acc[card.type].push(card);
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-semibold text-stone-900">背景信息卡片</h2>
      </div>

      <div className="grid gap-6">
        {Object.entries(CARD_TYPES).map(([type, label]) => (
          <Card key={type} className="p-6">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <CardDescription>
                    管理您的{label}信息
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleAdd(type)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupedCards[type]?.length > 0 ? (
                <div className="space-y-3">
                  {groupedCards[type].map((card) => (
                    <div
                      key={card.id}
                      className="flex justify-between items-start p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-stone-700">{card.content}</p>
                        <p className="text-xs text-stone-500 mt-1">
                          {new Date(card.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          onClick={() => handleEdit(card)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(card.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-500 text-center py-4">
                  暂无{label}信息，点击添加按钮创建
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <BackgroundCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={selectedType}
        card={editingCard}
      />
    </div>
  );
};

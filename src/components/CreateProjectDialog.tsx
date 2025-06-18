
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { projectsApi, userBackgroundCardsApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/pages/Creation';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  onProjectCreated,
}) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedIntention, setSelectedIntention] = useState('');
  const [customIntention, setCustomIntention] = useState('');
  const [selectedAccountStyle, setSelectedAccountStyle] = useState('');
  const [customAccountStyle, setCustomAccountStyle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 获取用户的背景卡片
  const { data: backgroundCards } = useQuery({
    queryKey: ['userBackgroundCards'],
    queryFn: userBackgroundCardsApi.list,
  });

  const intentions = backgroundCards?.filter(card => card.type === 'intentions') || [];
  const accountStyles = backgroundCards?.filter(card => card.type === 'accountStyles') || [];

  useEffect(() => {
    if (open) {
      // 重置表单
      setProjectTitle('');
      setSelectedIntention('');
      setCustomIntention('');
      setSelectedAccountStyle('');
      setCustomAccountStyle('');
    }
  }, [open]);

  const handleCreate = async () => {
    if (!projectTitle.trim()) {
      toast({
        title: '请输入项目名称',
        variant: 'destructive',
      });
      return;
    }

    const finalIntention = selectedIntention === 'custom' ? customIntention : selectedIntention;
    const finalAccountStyle = selectedAccountStyle === 'custom' ? customAccountStyle : selectedAccountStyle;

    if (!finalIntention.trim()) {
      toast({
        title: '请选择或输入写作意图',
        variant: 'destructive',
      });
      return;
    }

    if (!finalAccountStyle.trim()) {
      toast({
        title: '请选择或输入账号风格',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating project with intention and style:', {
        title: projectTitle,
        intention: finalIntention,
        accountStyle: finalAccountStyle,
      });

      const dbProject = await projectsApi.create({
        title: projectTitle.trim(),
      });

      const newProject: Project = {
        id: dbProject.id,
        title: dbProject.title,
        createdAt: dbProject.created_at.split('T')[0],
        updatedAt: dbProject.updated_at.split('T')[0],
      };

      // 如果用户输入了自定义的意图或风格，保存到背景卡片中
      if (selectedIntention === 'custom' && customIntention.trim()) {
        await userBackgroundCardsApi.create({
          type: 'intentions',
          content: customIntention.trim(),
        });
      }

      if (selectedAccountStyle === 'custom' && customAccountStyle.trim()) {
        await userBackgroundCardsApi.create({
          type: 'accountStyles',
          content: customAccountStyle.trim(),
        });
      }

      // 刷新背景卡片缓存
      queryClient.invalidateQueries({ queryKey: ['userBackgroundCards'] });

      toast({
        title: '项目创建成功',
        description: `项目"${newProject.title}"已创建`,
      });

      onOpenChange(false);

      // 调用回调或导航
      if (onProjectCreated) {
        onProjectCreated(newProject);
      } else {
        navigate(`/creation/workbench/${newProject.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast({
        title: '创建项目失败',
        description: error.message || '无法创建项目，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            请填写项目信息，包括必需的写作意图和账号风格
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">项目名称 *</Label>
            <Input
              id="project-title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="输入项目名称..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intention">写作意图 *</Label>
            <Select value={selectedIntention} onValueChange={setSelectedIntention}>
              <SelectTrigger>
                <SelectValue placeholder="选择写作意图..." />
              </SelectTrigger>
              <SelectContent>
                {intentions.map((intention) => (
                  <SelectItem key={intention.id} value={intention.content}>
                    {intention.content}
                  </SelectItem>
                ))}
                <SelectItem value="custom">自定义意图...</SelectItem>
              </SelectContent>
            </Select>
            {selectedIntention === 'custom' && (
              <Textarea
                value={customIntention}
                onChange={(e) => setCustomIntention(e.target.value)}
                placeholder="输入自定义的写作意图..."
                rows={3}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-style">账号风格 *</Label>
            <Select value={selectedAccountStyle} onValueChange={setSelectedAccountStyle}>
              <SelectTrigger>
                <SelectValue placeholder="选择账号风格..." />
              </SelectTrigger>
              <SelectContent>
                {accountStyles.map((style) => (
                  <SelectItem key={style.id} value={style.content}>
                    {style.content}
                  </SelectItem>
                ))}
                <SelectItem value="custom">自定义风格...</SelectItem>
              </SelectContent>
            </Select>
            {selectedAccountStyle === 'custom' && (
              <Textarea
                value={customAccountStyle}
                onChange={(e) => setCustomAccountStyle(e.target.value)}
                placeholder="输入自定义的账号风格..."
                rows={3}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? '创建中...' : '创建项目'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
  defaultTitle?: string;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  onProjectCreated,
  defaultTitle = '',
}) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState('');
  const [customPersonality, setCustomPersonality] = useState('');
  const [selectedResources, setSelectedResources] = useState('');
  const [customResources, setCustomResources] = useState('');
  const [selectedIntention, setSelectedIntention] = useState('');
  const [customIntention, setCustomIntention] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 获取用户的背景卡片
  const { data: backgroundCards } = useQuery({
    queryKey: ['userBackgroundCards'],
    queryFn: userBackgroundCardsApi.list,
  });

  const personalities = backgroundCards?.filter(card => card.type === 'personalities') || [];
  const resources = backgroundCards?.filter(card => card.type === 'resources') || [];
  const intentions = backgroundCards?.filter(card => card.type === 'intentions') || [];

  useEffect(() => {
    if (open) {
      // 重置表单，使用默认标题
      setProjectTitle(defaultTitle);
      setSelectedPersonality('');
      setCustomPersonality('');
      setSelectedResources('');
      setCustomResources('');
      setSelectedIntention('');
      setCustomIntention('');
    }
  }, [open, defaultTitle]);

  const handleCreate = async () => {
    if (!projectTitle.trim()) {
      toast({
        title: '请输入项目名称',
        variant: 'destructive',
      });
      return;
    }

    const finalPersonality = selectedPersonality === 'custom' ? customPersonality : selectedPersonality;
    const finalResources = selectedResources === 'custom' ? customResources : selectedResources;
    const finalIntention = selectedIntention === 'custom' ? customIntention : selectedIntention;

    if (!finalPersonality.trim()) {
      toast({
        title: '请选择或输入人设定位',
        variant: 'destructive',
      });
      return;
    }

    if (!finalResources.trim()) {
      toast({
        title: '请选择或输入账号资源',
        variant: 'destructive',
      });
      return;
    }

    if (!finalIntention.trim()) {
      toast({
        title: '请选择或输入写作目的',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating project with personality, resources and intention:', {
        title: projectTitle,
        personality: finalPersonality,
        resources: finalResources,
        intention: finalIntention,
      });

      // 准备背景信息数据
      const selectedPersonalityCard = personalities.find(p => p.content === finalPersonality);
      const selectedResourcesCard = resources.find(r => r.content === finalResources);
      const selectedIntentionCard = intentions.find(i => i.content === finalIntention);

      const userBackground = {
        personalities: {
          type: 'personalities',
          content: finalPersonality,
          id: selectedPersonalityCard?.id || null
        },
        resources: {
          type: 'resources', 
          content: finalResources,
          id: selectedResourcesCard?.id || null
        },
        intentions: {
          type: 'intentions',
          content: finalIntention,
          id: selectedIntentionCard?.id || null
        }
      };

      const dbProject = await projectsApi.create({
        title: projectTitle.trim(),
        user_background: userBackground,
      });

      const newProject: Project = {
        id: dbProject.id,
        title: dbProject.title,
        createdAt: dbProject.created_at.split('T')[0],
        updatedAt: dbProject.updated_at.split('T')[0],
      };

      // 如果用户输入了自定义的内容，保存到背景卡片中
      if (selectedPersonality === 'custom' && customPersonality.trim()) {
        await userBackgroundCardsApi.create({
          type: 'personalities',
          content: customPersonality.trim(),
        });
      }

      if (selectedResources === 'custom' && customResources.trim()) {
        await userBackgroundCardsApi.create({
          type: 'resources',
          content: customResources.trim(),
        });
      }

      if (selectedIntention === 'custom' && customIntention.trim()) {
        await userBackgroundCardsApi.create({
          type: 'intentions',
          content: customIntention.trim(),
        });
      }

      // 刷新背景卡片缓存
      queryClient.invalidateQueries({ queryKey: ['userBackgroundCards'] });

      // toast({
      //   title: '项目创建成功',
      //   description: `项目"${newProject.title}"已创建`,
      // });

      onOpenChange(false);

      // 调用回调或导航
      if (onProjectCreated) {
        onProjectCreated(newProject);
      } else {
        navigate(`/creation/workbench/${newProject.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: '创建项目失败',
        description: error instanceof Error ? error.message : '无法创建项目，请重试',
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
            请填写项目信息，包括人设定位、账号资源和写作目的
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
            <Label htmlFor="personality">人设定位 *</Label>
            <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
              <SelectTrigger>
                <SelectValue placeholder="选择人设定位..." />
              </SelectTrigger>
              <SelectContent>
                {personalities.map((personality) => (
                  <SelectItem key={personality.id} value={personality.content}>
                    {personality.content}
                  </SelectItem>
                ))}
                <SelectItem value="custom">自定义人设...</SelectItem>
              </SelectContent>
            </Select>
            {selectedPersonality === 'custom' && (
              <Textarea
                value={customPersonality}
                onChange={(e) => setCustomPersonality(e.target.value)}
                placeholder="输入自定义的人设定位..."
                rows={3}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resources">账号资源 *</Label>
            <Select value={selectedResources} onValueChange={setSelectedResources}>
              <SelectTrigger>
                <SelectValue placeholder="选择账号资源..." />
              </SelectTrigger>
              <SelectContent>
                {resources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.content}>
                    {resource.content}
                  </SelectItem>
                ))}
                <SelectItem value="custom">自定义资源...</SelectItem>
              </SelectContent>
            </Select>
            {selectedResources === 'custom' && (
              <Textarea
                value={customResources}
                onChange={(e) => setCustomResources(e.target.value)}
                placeholder="输入自定义的账号资源..."
                rows={3}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="intention">写作目的 *</Label>
            <Select value={selectedIntention} onValueChange={setSelectedIntention}>
              <SelectTrigger>
                <SelectValue placeholder="选择写作目的..." />
              </SelectTrigger>
              <SelectContent>
                {intentions.map((intention) => (
                  <SelectItem key={intention.id} value={intention.content}>
                    {intention.content}
                  </SelectItem>
                ))}
                <SelectItem value="custom">自定义目的...</SelectItem>
              </SelectContent>
            </Select>
            {selectedIntention === 'custom' && (
              <Textarea
                value={customIntention}
                onChange={(e) => setCustomIntention(e.target.value)}
                placeholder="输入自定义的写作目的..."
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

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type Card = Database['public']['Tables']['cards']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

export const projectsApi = {
  async list(): Promise<Project[]> {
    console.log('API: Fetching projects...');
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('API: Error fetching projects:', error);
      throw new Error(`获取项目失败: ${error.message}`);
    }
    console.log('API: Projects fetched successfully:', data?.length);
    return data || [];
  },

  async create(project: { title: string }): Promise<Project> {
    console.log('API: Creating project:', project);
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: project.title,
        user_id: user.data.user.id,
      })
      .select()
      .single();
    
    if (error) {
      console.error('API: Error creating project:', error);
      throw new Error(`创建项目失败: ${error.message}`);
    }
    console.log('API: Project created successfully:', data);
    return data;
  },

  async update(id: string, updates: { title?: string }): Promise<Project> {
    console.log('API: Updating project:', id, updates);
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('API: Error updating project:', error);
      throw new Error(`更新项目失败: ${error.message}`);
    }
    console.log('API: Project updated successfully:', data);
    return data;
  },

  async delete(id: string): Promise<void> {
    console.log('API: Deleting project:', id);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('API: Error deleting project:', error);
      throw new Error(`删除项目失败: ${error.message}`);
    }
    console.log('API: Project deleted successfully');
  },

  async getWithCards(id: string) {
    console.log('API: Fetching project with cards:', id);
    const { data, error } = await supabase
      .rpc('get_project_with_cards', { project_uuid: id });
    
    if (error) {
      console.error('API: Error fetching project with cards:', error);
      throw new Error(`获取项目详情失败: ${error.message}`);
    }
    console.log('API: Project with cards fetched successfully:', data?.length);
    return data;
  }
};

export const cardsApi = {
  async list(projectId: string): Promise<Card[]> {
    console.log('API: Fetching cards for project:', projectId);
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('project_id', projectId)
      .order('card_order', { ascending: true });
    
    if (error) {
      console.error('API: Error fetching cards:', error);
      throw new Error(`获取卡片失败: ${error.message}`);
    }
    console.log('API: Cards fetched successfully:', data?.length);
    return data || [];
  },

  async create(card: { project_id: string; title?: string; content?: string; card_order?: number }): Promise<Card> {
    console.log('API: Creating card:', card);
    const { data, error } = await supabase
      .from('cards')
      .insert({
        project_id: card.project_id,
        title: card.title || null,
        content: card.content || '',
        card_order: card.card_order || 0,
      })
      .select()
      .single();
    
    if (error) {
      console.error('API: Error creating card:', error);
      throw new Error(`创建卡片失败: ${error.message}`);
    }
    console.log('API: Card created successfully:', data);
    return data;
  },

  async update(id: string, updates: { title?: string; content?: string; card_order?: number }): Promise<Card> {
    console.log('API: Updating card:', id, updates);
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('API: Error updating card:', error);
      throw new Error(`更新卡片失败: ${error.message}`);
    }
    console.log('API: Card updated successfully:', data);
    return data;
  },

  async delete(id: string): Promise<void> {
    console.log('API: Deleting card:', id);
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('API: Error deleting card:', error);
      throw new Error(`删除卡片失败: ${error.message}`);
    }
    console.log('API: Card deleted successfully');
  },

  async findByTitle(projectId: string, title: string): Promise<Card | null> {
    console.log('API: Finding card by title:', projectId, title);
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('project_id', projectId)
      .eq('title', title)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('API: Error finding card by title:', error);
      throw new Error(`查找卡片失败: ${error.message}`);
    }
    console.log('API: Card found by title:', data);
    return data;
  }
};

export const chatApi = {
  getMessages: async (projectId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  sendMessage: async (projectId: string, content: string, references: any[] = [], systemMessages: string[] = []) => {
    const { data, error } = await supabase.functions.invoke('chat-dify', {
      body: {
        project_id: projectId,
        core_instruction: content,
        references: references,
        system_messages: systemMessages
      }
    });

    if (error) throw error;
    return data;
  }
};

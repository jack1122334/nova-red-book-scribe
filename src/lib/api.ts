
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type Card = Database['public']['Tables']['cards']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

export const projectsApi = {
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(project: { title: string }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: project.title,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { title?: string }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getWithCards(id: string) {
    const { data, error } = await supabase
      .rpc('get_project_with_cards', { project_uuid: id });
    
    if (error) throw error;
    return data;
  }
};

export const cardsApi = {
  async list(projectId: string): Promise<Card[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('project_id', projectId)
      .order('card_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(card: { project_id: string; title?: string; content?: string; card_order?: number }): Promise<Card> {
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
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { title?: string; content?: string; card_order?: number }): Promise<Card> {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async findByTitle(projectId: string, title: string): Promise<Card | null> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('project_id', projectId)
      .eq('title', title)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

export const chatApi = {
  async sendMessage(projectId: string, coreInstruction: string, references: any[] = []) {
    const { data, error } = await supabase.functions.invoke('chat-deepseek', {
      body: {
        project_id: projectId,
        core_instruction: coreInstruction,
        references: references,
      },
    });

    if (error) throw error;
    return data;
  },

  async getMessages(projectId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};

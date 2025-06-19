import { supabase } from '@/integrations/supabase/client';
import { Database, Json } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type Card = Database['public']['Tables']['cards']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type UserBackgroundCard = Database['public']['Tables']['user_background_cards']['Row'];

// 定义更具体的类型
type Reference = Record<string, unknown>;
type StreamEvent = Record<string, unknown>;

// 辅助函数：处理缓存的数据行
const processBufferLines = (buffer: string, onEvent: (event: StreamEvent) => void) => {
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const eventData = JSON.parse(line.slice(6));
        console.log('API: Received buffered event:', eventData.event, eventData);
        onEvent(eventData);
      } catch (parseError) {
        console.warn('API: Failed to parse buffered event:', line, parseError);
      }
    }
  }
};

// 辅助函数：处理bluechat缓存的数据行
const processBluechatBufferLines = (buffer: string, onEvent: (event: StreamEvent) => void) => {
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataContent = line.slice(6).trim();
      if (dataContent === '[DONE]') {
        console.log('API: Stream completed');
        continue;
      }
      if (dataContent === '') {
        continue;
      }
      
      try {
        const eventData = JSON.parse(dataContent);
        console.log('API: Received buffered bluechat event:', eventData);
        onEvent(eventData);
      } catch (parseError) {
        console.warn('API: Failed to parse buffered bluechat event:', line, parseError);
      }
    }
  }
};

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

  async get(id: string): Promise<Project> {
    console.log('API: Fetching single project:', id);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('API: Error fetching project:', error);
      throw new Error(`获取项目失败: ${error.message}`);
    }
    console.log('API: Project fetched successfully:', data);
    return data;
  },

  async create(project: { title: string; user_background?: Json }): Promise<Project> {
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
        user_background: project.user_background || null,
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

  async update(id: string, updates: { title?: string; user_background?: Json }): Promise<Project> {
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

  saveMessage: async (projectId: string, message: { 
    role: 'user' | 'assistant' | 'system'; 
    content: string; 
    llm_raw_output?: any;
  }) => {
    console.log('API: Saving message:', { projectId, role: message.role, contentLength: message.content.length });
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        project_id: projectId,
        role: message.role,
        content: message.content,
        llm_raw_output: message.llm_raw_output || null
      })
      .select()
      .single();

    if (error) {
      console.error('API: Error saving message:', error);
      throw new Error(`保存消息失败: ${error.message}`);
    }
    
    console.log('API: Message saved successfully:', data.id);
    return data;
  },

  sendMessageStream: async (
    projectId: string, 
    content: string, 
    references: Reference[] = [], 
    systemMessages: string[] = [],
    onEvent: (event: StreamEvent) => void
  ) => {
    console.log('API: Starting stream request to chat-dify function');
    
    const response = await fetch(`https://evpczvwygelrvxzfdcgv.supabase.co/functions/v1/chat-dify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cGN6dnd5Z2VscnZ4emZkY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTU3ODUsImV4cCI6MjA2NTQ3MTc4NX0.y7uP6NVj48UAKnMWcB_5LltTVCVFuSeo7xmrCEHlp1I`,
      },
      body: JSON.stringify({
        project_id: projectId,
        core_instruction: content,
        references: references,
        system_messages: systemMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Stream request failed:', response.status, errorText);
      throw new Error(`发送消息失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // 用于缓存不完整的数据

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('API: Stream reading completed');
          // 处理剩余的buffer数据
          if (buffer.trim()) {
            processBufferLines(buffer, onEvent);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk; // 将新数据添加到buffer

        // 按行分割，但保留最后一行（可能不完整）
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一行作为buffer

        // 处理完整的行
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              console.log('API: Received event:', eventData.event, eventData);
              onEvent(eventData);
            } catch (parseError) {
              console.warn('API: Failed to parse event:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('API: Error reading stream:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  },

  sendMessage: async (projectId: string, content: string, references: Reference[] = [], systemMessages: string[] = []) => {
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

export const bluechatApi = {
  sendMessageStream: async (
    projectId: string,
    query: string,
    stage: 'STAGE_1' | 'STAGE_2',
    selectedIds: string[] = [],
    onEvent: (event: StreamEvent) => void
  ) => {
    console.log('API: Starting bluechat stream request');
    
    // 在开发环境使用代理，生产环境使用Supabase Edge Function
    const isDevelopment = import.meta.env.DEV;
    const apiUrl = isDevelopment 
      ? '/api/bluechat'
      : 'https://evpczvwygelrvxzfdcgv.supabase.co/functions/v1/chat-bluechat';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cGN6dnd5Z2VscnZ4emZkY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTU3ODUsImV4cCI6MjA2NTQ3MTc4NX0.y7uP6NVj48UAKnMWcB_5LltTVCVFuSeo7xmrCEHlp1I`,
      },
      body: JSON.stringify(isDevelopment ? {
        stage,
        query,
        user_id: "123",
        session_id: projectId,
        limit: 3,
        ids: selectedIds,
        count: 6
      } : {
        project_id: projectId,
        query,
        stage,
        selected_ids: selectedIds
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Bluechat stream request failed:', response.status, errorText);
      throw new Error(`发送消息失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // 用于缓存不完整的数据

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('API: Bluechat stream reading completed');
          // 处理剩余的buffer数据
          if (buffer.trim()) {
            processBluechatBufferLines(buffer, onEvent);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk; // 将新数据添加到buffer

        // 按行分割，但保留最后一行（可能不完整）
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一行作为buffer

        // 处理完整的行
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            if (dataContent === '[DONE]') {
              console.log('API: Stream completed');
              continue;
            }
            if (dataContent === '') {
              continue;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              console.log('API: Received bluechat event:', eventData);
              onEvent(eventData);
            } catch (parseError) {
              console.warn('API: Failed to parse bluechat event:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('API: Error reading bluechat stream:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
};

export const userBackgroundCardsApi = {
  async list(): Promise<UserBackgroundCard[]> {
    console.log('API: Fetching user background cards...');
    const { data, error } = await supabase
      .from('user_background_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('API: Error fetching user background cards:', error);
      throw new Error(`获取背景卡片失败: ${error.message}`);
    }
    console.log('API: User background cards fetched successfully:', data?.length);
    return data || [];
  },

  async create(card: { type: string; content: string }): Promise<UserBackgroundCard> {
    console.log('API: Creating user background card:', card);
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('user_background_cards')
      .insert({
        type: card.type,
        content: card.content,
        user_id: user.data.user.id,
      })
      .select()
      .single();
    
    if (error) {
      console.error('API: Error creating user background card:', error);
      throw new Error(`创建背景卡片失败: ${error.message}`);
    }
    console.log('API: User background card created successfully:', data);
    return data;
  },

  async update(id: string, updates: { content?: string }): Promise<UserBackgroundCard> {
    console.log('API: Updating user background card:', id, updates);
    const { data, error } = await supabase
      .from('user_background_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('API: Error updating user background card:', error);
      throw new Error(`更新背景卡片失败: ${error.message}`);
    }
    console.log('API: User background card updated successfully:', data);
    return data;
  },

  async delete(id: string): Promise<void> {
    console.log('API: Deleting user background card:', id);
    const { error } = await supabase
      .from('user_background_cards')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('API: Error deleting user background card:', error);
      throw new Error(`删除背景卡片失败: ${error.message}`);
    }
    console.log('API: User background card deleted successfully');
  }
};

// Export canvas API
export { canvasApi } from './canvasApi';

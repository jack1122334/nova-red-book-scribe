
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type CanvasItem = Database['public']['Tables']['canvas_items']['Row'];
type InsertCanvasItem = Database['public']['Tables']['canvas_items']['Insert'];
type Insight = Database['public']['Tables']['insights']['Row'];
type InsertInsight = Database['public']['Tables']['insights']['Insert'];

export const canvasItemsApi = {
  async list(projectId: string): Promise<CanvasItem[]> {
    console.log('API: Fetching canvas items for project:', projectId);
    const { data, error } = await supabase
      .from('canvas_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('API: Error fetching canvas items:', error);
      throw new Error(`获取Canvas数据失败: ${error.message}`);
    }
    console.log('API: Canvas items fetched successfully:', data?.length);
    return data || [];
  },

  async bulkCreate(items: InsertCanvasItem[]): Promise<CanvasItem[]> {
    console.log('API: Creating canvas items bulk:', items.length);
    const { data, error } = await supabase
      .from('canvas_items')
      .insert(items)
      .select();
    
    if (error) {
      console.error('API: Error creating canvas items:', error);
      throw new Error(`创建Canvas数据失败: ${error.message}`);
    }
    console.log('API: Canvas items created successfully:', data?.length);
    return data || [];
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    console.log('API: Deleting canvas items for project:', projectId);
    const { error } = await supabase
      .from('canvas_items')
      .delete()
      .eq('project_id', projectId);
    
    if (error) {
      console.error('API: Error deleting canvas items:', error);
      throw new Error(`删除Canvas数据失败: ${error.message}`);
    }
    console.log('API: Canvas items deleted successfully');
  }
};

export const insightsApi = {
  async list(projectId: string): Promise<Insight[]> {
    console.log('API: Fetching insights for project:', projectId);
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('API: Error fetching insights:', error);
      throw new Error(`获取Insights数据失败: ${error.message}`);
    }
    console.log('API: Insights fetched successfully:', data?.length);
    return data || [];
  },

  async bulkCreate(items: InsertInsight[]): Promise<Insight[]> {
    console.log('API: Creating insights bulk:', items.length);
    const { data, error } = await supabase
      .from('insights')
      .insert(items)
      .select();
    
    if (error) {
      console.error('API: Error creating insights:', error);
      throw new Error(`创建Insights数据失败: ${error.message}`);
    }
    console.log('API: Insights created successfully:', data?.length);
    return data || [];
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    console.log('API: Deleting insights for project:', projectId);
    const { error } = await supabase
      .from('insights')
      .delete()
      .eq('project_id', projectId);
    
    if (error) {
      console.error('API: Error deleting insights:', error);
      throw new Error(`删除Insights数据失败: ${error.message}`);
    }
    console.log('API: Insights deleted successfully');
  }
};

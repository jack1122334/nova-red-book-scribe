
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type CanvasItem = Database['public']['Tables']['canvas_items']['Row'];
type Insight = Database['public']['Tables']['insights']['Row'];
type CanvasItemInsert = Database['public']['Tables']['canvas_items']['Insert'];
type InsightInsert = Database['public']['Tables']['insights']['Insert'];

export const canvasApi = {
  // Canvas Items
  async getCanvasItems(projectId: string): Promise<CanvasItem[]> {
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

  async createCanvasItem(item: CanvasItemInsert): Promise<CanvasItem> {
    console.log('API: Creating canvas item:', item);
    const { data, error } = await supabase
      .from('canvas_items')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('API: Error creating canvas item:', error);
      throw new Error(`创建Canvas项目失败: ${error.message}`);
    }
    console.log('API: Canvas item created successfully:', data);
    return data;
  },

  async batchCreateCanvasItems(items: CanvasItemInsert[]): Promise<CanvasItem[]> {
    console.log('API: Batch creating canvas items:', items.length);
    if (items.length === 0) return [];
    
    const { data, error } = await supabase
      .from('canvas_items')
      .insert(items)
      .select();
    
    if (error) {
      console.error('API: Error batch creating canvas items:', error);
      throw new Error(`批量创建Canvas项目失败: ${error.message}`);
    }
    console.log('API: Canvas items batch created successfully:', data?.length);
    return data || [];
  },

  // Insights
  async getInsights(projectId: string): Promise<Insight[]> {
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

  async createInsight(insight: InsightInsert): Promise<Insight> {
    console.log('API: Creating insight:', insight);
    const { data, error } = await supabase
      .from('insights')
      .insert(insight)
      .select()
      .single();
    
    if (error) {
      console.error('API: Error creating insight:', error);
      throw new Error(`创建Insight失败: ${error.message}`);
    }
    console.log('API: Insight created successfully:', data);
    return data;
  },

  async batchCreateInsights(insights: InsightInsert[]): Promise<Insight[]> {
    console.log('API: Batch creating insights:', insights.length);
    if (insights.length === 0) return [];
    
    const { data, error } = await supabase
      .from('insights')
      .insert(insights)
      .select();
    
    if (error) {
      console.error('API: Error batch creating insights:', error);
      throw new Error(`批量创建Insights失败: ${error.message}`);
    }
    console.log('API: Insights batch created successfully:', data?.length);
    return data || [];
  }
};

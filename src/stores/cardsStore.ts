import { create } from 'zustand';
import { cardsApi } from '@/lib/api';
import { Database } from '@/integrations/supabase/types';

// 类型定义 - 小红书内容卡片
export interface XiaohongshuCard {
  id: string;
  external_id: string;
  type: 'xiaohongshu_content';
  title: string;
  content: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  // 额外的小红书相关字段
  keyword?: string;
  platform?: string;
  isSelected?: boolean;
  isLoading?: boolean;
}

interface CardsState {
  // 状态
  xiaohongshuCards: XiaohongshuCard[];
  loading: boolean;
  currentProjectId: string | null;

  // 基本操作
  setXiaohongshuCards: (cards: XiaohongshuCard[]) => void;
  addXiaohongshuCards: (cards: XiaohongshuCard[]) => void;
  updateXiaohongshuCard: (id: string, updates: Partial<XiaohongshuCard>) => void;
  removeXiaohongshuCard: (id: string) => void;

  // 数据加载和保存
  loadProjectCards: (projectId: string) => Promise<void>;
  saveXiaohongshuData: (projectId: string, cardsData: Database['public']['Tables']['cards']['Insert'][]) => Promise<void>;

  // 流式数据处理
  processStreamData: (data: Record<string, unknown>) => void;

  // 重置状态
  reset: () => void;
  setCurrentProject: (projectId: string) => void;
}

export const useCardsStore = create<CardsState>((set, get) => ({
  // 初始状态
  xiaohongshuCards: [],
  loading: false,
  currentProjectId: null,

  // 基本操作
  setXiaohongshuCards: (cards) => set({ xiaohongshuCards: cards }),

  addXiaohongshuCards: (cards) => set((state) => ({
    xiaohongshuCards: [...state.xiaohongshuCards, ...cards]
  })),

  updateXiaohongshuCard: (id, updates) => set((state) => ({
    xiaohongshuCards: state.xiaohongshuCards.map(card =>
      card.id === id ? { ...card, ...updates } : card
    )
  })),

  removeXiaohongshuCard: (id) => set((state) => ({
    xiaohongshuCards: state.xiaohongshuCards.filter(card => card.id !== id)
  })),

  // 数据加载和保存
  loadProjectCards: async (projectId: string) => {
    set({ loading: true, currentProjectId: projectId });

    try {
      // 加载小红书内容卡片 - 从 cards 表中筛选 type 为 xiaohongshu_content 的数据
      const allCards = await cardsApi.list(projectId);
      console.log('Cards Store: Loaded all cards:', allCards.length);

      // 筛选出小红书内容类型的卡片
      // 注意：由于现有的 cards 表结构没有 type 字段，我们需要通过其他方式识别
      // 这里我们假设通过 title 或 content 的特定格式来识别小红书内容
      const xiaohongshuCards: XiaohongshuCard[] = allCards
        .map(card => ({
          id: card.id,
          external_id: card.id, // 使用 card.id 作为 external_id
          type: 'xiaohongshu_content' as const,
          title: card.title || '无标题',
          content: card.content,
          project_id: card.project_id,
          created_at: card.created_at,
          updated_at: card.updated_at,
          isSelected: false,
          isLoading: false
        }));

      set({ xiaohongshuCards });
      console.log('Cards Store: Loaded xiaohongshu cards:', xiaohongshuCards.length);

    } catch (error) {
      console.error('Cards Store: Failed to load project cards:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  saveXiaohongshuData: async (projectId: string, cardsData) => {
    try {
      console.log('Cards Store: Saving xiaohongshu data:', cardsData.length);

      // 批量创建卡片
      const promises = cardsData.map(cardData =>
        cardsApi.create({
          project_id: cardData.project_id,
          title: cardData.title || null,
          content: cardData.content || '',
          card_order: 0 // 小红书内容卡片的顺序可以设为0或根据需要调整
        })
      );

      const savedCards = await Promise.all(promises);
      console.log('Cards Store: Xiaohongshu data saved successfully:', savedCards.length);

      // 更新本地状态
      const newXiaohongshuCards: XiaohongshuCard[] = savedCards.map(card => ({
        id: card.id,
        external_id: card.id,
        type: 'xiaohongshu_content' as const,
        title: card.title || '无标题',
        content: card.content,
        project_id: card.project_id,
        created_at: card.created_at,
        updated_at: card.updated_at,
        isSelected: false,
        isLoading: false
      }));

    } catch (error) {
      console.error('Cards Store: Failed to save xiaohongshu data:', error);
      throw error;
    }
  },

  // 流式数据处理
  processStreamData: (data: Record<string, unknown>) => {
    console.log('Cards Store: Processing stream data:', data);

    // 处理 xiaohongshu_content 类型的数据
    if (data.type === 'xiaohongshu_content' && typeof data.content === 'string') {
      console.log('Cards Store: Adding xiaohongshu content:', data.content.substring(0, 100));

      const newCard: XiaohongshuCard = {
        id: (typeof data.id === 'string' ? data.id : null) || `xiaohongshu-${Date.now()}`,
        external_id: (typeof data.external_id === 'string' ? data.external_id : null) ||
          (typeof data.id === 'string' ? data.id : null) ||
          `xiaohongshu-${Date.now()}`,
        type: 'xiaohongshu_content',
        title: (typeof data.title === 'string' ? data.title : null) || `小红书内容 ${Date.now()}`,
        content: data.content,
        project_id: get().currentProjectId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        keyword: typeof data.keyword === 'string' ? data.keyword : undefined,
        platform: (typeof data.platform === 'string' ? data.platform : null) || 'xiaohongshu',
        isSelected: false,
        isLoading: false
      };
      get().addXiaohongshuCards([newCard]);
      return; // 提前返回，避免重复处理
    }
  },

  // 重置状态
  reset: () => set({
    xiaohongshuCards: [],
    loading: false,
    currentProjectId: null
  }),

  setCurrentProject: (projectId) => set({ currentProjectId: projectId })
})); 
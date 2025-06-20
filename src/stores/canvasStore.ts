import { create } from 'zustand';
import { canvasApi, chatApi } from '@/lib/api';
import { Database } from '@/integrations/supabase/types';

// 类型定义
export interface CanvasItem {
  id: string;
  external_id: string;
  type: 'canvas' | 'insight';
  title: string;
  content?: string;
  isSelected: boolean;
  isDisabled: boolean;
  keyword?: string;
  author?: string;
  author_avatar?: string;
  like_count?: number;
  collect_count?: number;
  comment_count?: number;
  share_count?: number;
  cover_url?: string;
  url?: string;
  platform?: string;
  ip_location?: string;
  tags?: string[];
  create_time?: string;
  isLoading?: boolean;
}

interface CanvasState {
  // 状态
  canvasItems: CanvasItem[];
  insights: CanvasItem[];
  keywords: string[];
  loading: boolean;
  selectedCanvasItems: Set<string>;
  selectedInsights: Set<string>;
  canvasReferences: CanvasItem[];
  currentProjectId: string | null;

  // Canvas Items 操作
  setCanvasItems: (items: CanvasItem[]) => void;
  addCanvasItems: (items: CanvasItem[]) => void;
  updateCanvasItem: (id: string, updates: Partial<CanvasItem>) => void;
  removeCanvasItem: (id: string) => void;
  toggleCanvasSelection: (id: string) => void;
  batchSelectCanvas: (ids: string[]) => void;
  batchDisableCanvas: (ids: string[]) => void;
  restoreCanvasItem: (id: string) => void;

  // Insights 操作
  setInsights: (insights: CanvasItem[]) => void;
  addInsights: (insights: CanvasItem[]) => void;
  updateInsight: (id: string, updates: Partial<CanvasItem>) => void;
  removeInsight: (id: string) => void;
  toggleInsightSelection: (id: string) => void;
  batchSelectInsights: (ids: string[]) => void;
  batchDisableInsights: (ids: string[]) => void;
  restoreInsight: (id: string) => void;

  // 关键词管理
  setKeywords: (keywords: string[]) => void;
  addKeywords: (keywords: string[]) => void;

  // 选择管理
  clearSelections: () => void;
  getSelectedCanvasItems: () => CanvasItem[];
  getSelectedInsights: () => CanvasItem[];

  // Canvas References 管理
  addToCanvasReferences: (item: CanvasItem) => void;
  removeFromCanvasReferences: (itemId: string) => void;
  clearCanvasReferences: () => void;
  getCanvasReferences: () => CanvasItem[];

  // 数据加载和保存
  loadProjectData: (projectId: string) => Promise<void>;
  saveCanvasData: (projectId: string, canvasData: Database['public']['Tables']['canvas_items']['Insert'][]) => Promise<void>;
  saveInsightsData: (projectId: string, insightsData: Database['public']['Tables']['insights']['Insert'][]) => Promise<void>;

  // 流式数据处理
  processStreamData: (data: any) => void;
  initializePlaceholders: (keywords: string[]) => void;
  updateCanvasCards: (keyword: string, cards: any[]) => void;

  // 重置状态
  reset: () => void;
  setCurrentProject: (projectId: string) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // 初始状态
  canvasItems: [],
  insights: [],
  keywords: [],
  loading: false,
  selectedCanvasItems: new Set(),
  selectedInsights: new Set(),
  canvasReferences: [],
  currentProjectId: null,

  // Canvas Items 操作
  setCanvasItems: (items) => set({ canvasItems: items }),

  addCanvasItems: (items) => set((state) => ({
    canvasItems: [...state.canvasItems, ...items]
  })),

  updateCanvasItem: (id, updates) => set((state) => ({
    canvasItems: state.canvasItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  removeCanvasItem: (id) => set((state) => ({
    canvasItems: state.canvasItems.filter(item => item.id !== id)
  })),

  toggleCanvasSelection: (id) => set((state) => {
    const newSelected = new Set(state.selectedCanvasItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return { selectedCanvasItems: newSelected };
  }),

  batchSelectCanvas: (ids) => set((state) => {
    const updatedItems = state.canvasItems.map(item =>
      ids.includes(item.id) && !item.isDisabled
        ? { ...item, isSelected: false }
        : item
    );
    return {
      canvasItems: updatedItems,
      selectedCanvasItems: new Set()
    };
  }),

  batchDisableCanvas: (ids) => set((state) => {
    const updatedItems = state.canvasItems.map(item =>
      ids.includes(item.id)
        ? { ...item, isDisabled: true, isSelected: false }
        : item
    );
    return {
      canvasItems: updatedItems,
      selectedCanvasItems: new Set()
    };
  }),

  restoreCanvasItem: (id) => set((state) => ({
    canvasItems: state.canvasItems.map(item =>
      item.id === id ? { ...item, isDisabled: false } : item
    )
  })),

  // Insights 操作
  setInsights: (insights) => set({ insights }),

  addInsights: (insights) => set((state) => ({
    insights: [...state.insights, ...insights]
  })),

  updateInsight: (id, updates) => set((state) => ({
    insights: state.insights.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  removeInsight: (id) => set((state) => ({
    insights: state.insights.filter(item => item.id !== id)
  })),

  toggleInsightSelection: (id) => set((state) => {
    const newSelected = new Set(state.selectedInsights);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return { selectedInsights: newSelected };
  }),

  batchSelectInsights: (ids) => set((state) => {
    const updatedInsights = state.insights.map(item =>
      ids.includes(item.id) && !item.isDisabled
        ? { ...item, isSelected: false }
        : item
    );
    return {
      insights: updatedInsights,
      selectedInsights: new Set()
    };
  }),

  batchDisableInsights: (ids) => set((state) => {
    const updatedInsights = state.insights.map(item =>
      ids.includes(item.id)
        ? { ...item, isDisabled: true, isSelected: false }
        : item
    );
    return {
      insights: updatedInsights,
      selectedInsights: new Set()
    };
  }),

  restoreInsight: (id) => set((state) => ({
    insights: state.insights.map(item =>
      item.id === id ? { ...item, isDisabled: false } : item
    )
  })),

  // 关键词管理
  setKeywords: (keywords) => set({ keywords }),

  addKeywords: (keywords) => set((state) => ({
    keywords: [...new Set([...state.keywords, ...keywords])]
  })),

  // 选择管理
  clearSelections: () => set({
    selectedCanvasItems: new Set(),
    selectedInsights: new Set()
  }),

  getSelectedCanvasItems: () => {
    const { canvasItems, selectedCanvasItems } = get();
    return canvasItems.filter(item => selectedCanvasItems.has(item.id));
  },

  getSelectedInsights: () => {
    const { insights, selectedInsights } = get();
    return insights.filter(item => selectedInsights.has(item.id));
  },

  // Canvas References 管理
  addToCanvasReferences: (item) => set((state) => {
    // 检查是否已存在，避免重复添加
    const exists = state.canvasReferences.some(ref => ref.id === item.id);
    if (exists) return state;
    
    return {
      canvasReferences: [...state.canvasReferences, { ...item, isSelected: true }]
    };
  }),

  removeFromCanvasReferences: (itemId) => set((state) => ({
    canvasReferences: state.canvasReferences.filter(item => item.id !== itemId)
  })),

  clearCanvasReferences: () => set({ canvasReferences: [] }),

  getCanvasReferences: () => {
    const { canvasReferences } = get();
    return canvasReferences;
  },

  // 数据加载和保存
  loadProjectData: async (projectId: string) => {
    set({ loading: true, currentProjectId: projectId });

    try {
      // 加载Canvas Items
      const canvasData = await canvasApi.getCanvasItems(projectId);
      console.log('Canvas Store: Loaded canvas items:', canvasData.length);

      if (canvasData.length > 0) {
        // 提取关键词
        const uniqueKeywords = Array.from(new Set(
          canvasData.map(item => item.keyword).filter(Boolean)
        ));

        // 转换为组件格式
        const transformedItems: CanvasItem[] = canvasData.map(item => ({
          id: item.id,
          external_id: item.external_id,
          type: 'canvas' as const,
          title: item.title,
          content: item.content || '',
          isSelected: false,
          isDisabled: false,
          keyword: item.keyword || '',
          author: item.author || '',
          author_avatar: item.author_avatar || '',
          like_count: item.like_count || 0,
          collect_count: item.collect_count || 0,
          comment_count: item.comment_count || 0,
          share_count: item.share_count || 0,
          cover_url: item.cover_url || '',
          url: item.url || '',
          platform: item.platform || 'xiaohongshu',
          ip_location: item.ip_location || '',
          tags: item.tags || [],
          create_time: item.create_time || '',
          isLoading: false
        }));

        set({
          canvasItems: transformedItems,
          keywords: uniqueKeywords
        });
      }

      // 加载Insights
      const insightsData = await canvasApi.getInsights(projectId);
      console.log('Canvas Store: Loaded insights:', insightsData.length);

      if (insightsData.length > 0) {
        const transformedInsights: CanvasItem[] = insightsData.map(item => ({
          id: item.id,
          external_id: item.external_id,
          type: 'insight' as const,
          title: item.title,
          content: item.content,
          isSelected: false,
          isDisabled: false,
          isLoading: false
        }));

        set({ insights: transformedInsights });
      }

    } catch (error) {
      console.error('Canvas Store: Failed to load project data:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  saveCanvasData: async (projectId: string, canvasData) => {
    try {
      console.log('Canvas Store: Saving canvas data:', canvasData.length);
      await chatApi.batchSaveCanvasItems(canvasData);
      console.log('Canvas Store: Canvas data saved successfully');
    } catch (error) {
      console.error('Canvas Store: Failed to save canvas data:', error);
      throw error;
    }
  },

  saveInsightsData: async (projectId: string, insightsData) => {
    try {
      console.log('Canvas Store: Saving insights data:', insightsData.length);
      await chatApi.batchSaveInsights(insightsData);
      console.log('Canvas Store: Insights data saved successfully');
    } catch (error) {
      console.error('Canvas Store: Failed to save insights data:', error);
      throw error;
    }
  },

  // 流式数据处理
  processStreamData: (data) => {
    console.log('Canvas Store: Processing stream data:', data);

    if (data.keywords && !data.type) {
      console.log('Canvas Store: Setting keywords:', data.keywords);
      get().setKeywords(data.keywords);
      get().initializePlaceholders(data.keywords);
    }

    if (data.keyword && data.cards) {
      console.log('Canvas Store: Updating cards for keyword:', data.keyword, data.cards.length);
      get().updateCanvasCards(data.keyword, data.cards);
    }

    // 处理 insight 类型的数据
    if (data.type === 'insight' && data.text) {
      console.log('Canvas Store: Adding insight:', data.text.substring(0, 100));
      const newInsight: CanvasItem = {
        id: data.id || `insight-${Date.now()}`,
        external_id: data.external_id,
        type: 'insight',
        title: data.title,
        content: data.text,
        isSelected: false,
        isDisabled: false,
        isLoading: false
      };
      get().addInsights([newInsight]);
    }

    // 处理 keyword_insight 类型的数据
    if ((data.type === 'keyword_insight') && data.answerText) {
      console.log('Canvas Store: Adding keyword insight:', data.answerText.substring(0, 100));
      const newInsight: CanvasItem = {
        id: data.id || `insight-${Date.now()}`,
        external_id: data.external_id,
        type: 'insight',
        title: data.keyword,
        content: data.answerText,
        keyword: data.keyword,
        isSelected: false,
        isDisabled: false,
        isLoading: false
      };
      get().addInsights([newInsight]);
    }
  },

  initializePlaceholders: (keywords) => {
    const placeholders: CanvasItem[] = [];
    keywords.forEach((keyword, keywordIndex) => {
      for (let i = 0; i < 3; i++) {
        placeholders.push({
          id: `placeholder-${keywordIndex}-${i}`,
          external_id: `placeholder-${keywordIndex}-${i}`,
          type: 'canvas',
          title: `${keyword} - 加载中...`,
          content: '',
          isSelected: false,
          isDisabled: false,
          keyword,
          isLoading: true
        });
      }
    });

    set({ canvasItems: placeholders });
  },

  updateCanvasCards: (keyword, cards) => {
    const { keywords } = get();

    // 标准化关键词匹配
    const normalizeKeyword = (kw: string) => {
      return kw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
    };

    const normalizedDataKeyword = normalizeKeyword(keyword);
    let keywordIndex = keywords.findIndex(kw => {
      const normalizedKeyword = normalizeKeyword(kw);
      return normalizedDataKeyword === normalizedKeyword;
    });

    if (keywordIndex === -1) {
      // 模糊匹配
      keywordIndex = keywords.findIndex(kw => {
        const normalizedKeyword = normalizeKeyword(kw);
        return normalizedKeyword.includes(normalizedDataKeyword) ||
          normalizedDataKeyword.includes(normalizedKeyword);
      });
    }

    if (keywordIndex === -1) {
      console.error('Canvas Store: Could not match keyword:', keyword);
      return;
    }

    set((state) => {
      const newItems = [...state.canvasItems];

      cards.forEach((card, cardIndex) => {
        const gridPosition = keywordIndex * 3 + cardIndex;

        if (gridPosition < newItems.length) {
          newItems[gridPosition] = {
            id: card.id,
            external_id: card.external_id,
            type: 'canvas',
            title: card.title,
            content: card.content || '',
            isSelected: false,
            isDisabled: false,
            keyword: keyword,
            author: card.author,
            author_avatar: card.author_avatar,
            like_count: card.like_count,
            collect_count: card.collect_count,
            comment_count: card.comment_count,
            share_count: card.share_count,
            cover_url: card.cover_url,
            url: card.url,
            platform: card.platform || 'xiaohongshu',
            ip_location: card.ip_location,
            tags: card.tags || [],
            create_time: card.create_time,
            isLoading: false
          };
        }
      });

      return { canvasItems: newItems };
    });
  },

  // 重置状态
  reset: () => set({
    canvasItems: [],
    insights: [],
    keywords: [],
    loading: false,
    selectedCanvasItems: new Set(),
    selectedInsights: new Set(),
    canvasReferences: [],
    currentProjectId: null
  }),

  setCurrentProject: (projectId) => set({ currentProjectId: projectId })
})); 
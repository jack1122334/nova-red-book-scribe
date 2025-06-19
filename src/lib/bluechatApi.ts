
export interface BluechatCard {
  id: string;
  title: string;
  content: string;
  author: string;
  author_avatar: string;
  create_time: string;
  like_count: number;
  collect_count: number;
  comment_count: number;
  share_count: number;
  tags: string[];
  url: string;
  cover_url: string;
  platform: string;
  ip_location: string;
  comments: Array<{
    content: string;
    user_nickname: string;
    user_avatar: string;
    create_time: number;
    like_count: number;
    sub_comments_count: number;
  }>;
  original_id: string;
  keyword: string;
}

export interface BluechatRequest {
  stage: 'STAGE_1' | 'STAGE_2';
  query: string;
  user_id: string;
  session_id: string;
  limit: number;
  ids: string[];
  count: number;
}

export interface BluechatKeywordsResponse {
  keywords: string[];
}

export interface BluechatCardsResponse {
  keyword: string;
  cards: BluechatCard[];
  total_count: number;
  cards_map_info: {
    exists: boolean;
    size: number;
    ids: string[];
  };
}

export interface BluechatStateResponse {
  type: 'state_info';
  cards_map_exists: boolean;
  cards_map_size: number;
  cards_map_ids: string[];
  stage1_ids: string[];
  keywords_count: number;
  cards_count: number;
}

export class BluechatApi {
  async *streamChat(request: BluechatRequest): AsyncGenerator<BluechatKeywordsResponse | BluechatCardsResponse | BluechatStateResponse> {
    console.log('BluechatApi: Starting stream request to chat-bluechat function');
    
    const response = await fetch(`https://evpczvwygelrvxzfdcgv.supabase.co/functions/v1/chat-bluechat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cGN6dnd5Z2VscnZ4emZkY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTU3ODUsImV4cCI6MjA2NTQ3MTc4NX0.y7uP6NVj48UAKnMWcB_5LltTVCVFuSeo7xmrCEHlp1I`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BluechatApi: Stream request failed:', response.status, errorText);
      throw new Error(`发送请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('BluechatApi: Stream reading completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6).trim();
              
              if (dataStr === '[DONE]') {
                return;
              }
              
              if (dataStr && dataStr !== '') {
                const data = JSON.parse(dataStr);
                console.log('BluechatApi: Received event:', data);
                yield data;
              }
            } catch (parseError) {
              console.warn('BluechatApi: Failed to parse event:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('BluechatApi: Error reading stream:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
}

export const bluechatApi = new BluechatApi();

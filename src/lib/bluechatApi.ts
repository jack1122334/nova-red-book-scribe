
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
  private baseUrl = 'http://172.22.45.74:8000/api/v1';

  async *streamChat(request: BluechatRequest): AsyncGenerator<BluechatKeywordsResponse | BluechatCardsResponse | BluechatStateResponse> {
    const response = await fetch(`${this.baseUrl}/bluechat`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            
            if (dataStr === '[DONE]') {
              return;
            }
            
            if (dataStr && dataStr !== '') {
              try {
                const data = JSON.parse(dataStr);
                yield data;
              } catch (error) {
                console.warn('Failed to parse JSON:', dataStr, error);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const bluechatApi = new BluechatApi();

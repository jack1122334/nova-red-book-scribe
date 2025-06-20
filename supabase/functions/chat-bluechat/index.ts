
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BluechatRequest {
  project_id: string;
  query: string;
  stage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3';
  selected_ids?: string[];
  user_id: string;
  user_background: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, query, stage, selected_ids = [], user_id, user_background }: BluechatRequest = await req.json();
    
    console.log('Bluechat request:', { project_id, query, stage, selected_ids, user_id });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'user',
        content: query,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
      throw userMessageError;
    }

    // Prepare request body for external API
    const requestBody = {
      stage,
      query,
      user_id,
      session_id: project_id,
      limit: 3,
      ids: selected_ids,
      count: 6,
      user_background
    };

    console.log('Calling external API with:', requestBody);

    // Call external API
    const response = await fetch('https://47.84.70.98:8443/api/v1/bluechat', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cGN6dnd5Z2VscnZ4emZkY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTU3ODUsImV4cCI6MjA2NTQ3MTc4NX0.y7uP6NVj48UAKnMWcB_5LltTVCVFuSeo7xmrCEHlp1I`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('External API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error details:', errorText);
      throw new Error(`External API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body from external API');
    }

    // Create streaming response with improved buffer handling
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        const decoder = new TextDecoder();
        let buffer = ''; // 缓冲区用于处理不完整的数据
        let fullAiContent = '';
        let canvasData: any[] = [];
        let insightsData: any[] = [];
        let allEvents: any[] = [];
        let thoughts: any[] = [];
        let toolCalls: any[] = [];
        let isStreamComplete = false;
        let associatedCardId: string | null = null;

        const processLine = (line: string) => {
          if (!line.trim()) return;
          
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            
            // 检查流结束标志
            if (dataContent === '[DONE]') {
              console.log('=== BLUECHAT STREAM COMPLETED ===');
              isStreamComplete = true;
              return;
            }
            
            if (dataContent === '') {
              return;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              console.log('=== BLUECHAT EVENT ===');
              console.log('Event type:', eventData.event || eventData.type || 'unknown');
              console.log('Full event data:', JSON.stringify(eventData, null, 2));
              
              // 存储所有事件用于调试
              allEvents.push({
                timestamp: new Date().toISOString(),
                event: eventData
              });
              
              // 转发事件到前端
              const forwardData = `data: ${JSON.stringify(eventData)}\n\n`;
              controller.enqueue(new TextEncoder().encode(forwardData));
              
              // 处理不同类型的事件
              processEventData(eventData);
              
            } catch (parseError) {
              console.warn('=== PARSE ERROR ===');
              console.warn('Failed to parse event data:', dataContent.substring(0, 200));
              console.warn('Parse error:', parseError);
              
              // 尝试修复常见的JSON格式问题
              const fixedData = tryFixJsonData(dataContent);
              if (fixedData) {
                try {
                  const eventData = JSON.parse(fixedData);
                  console.log('=== RECOVERED EVENT ===');
                  console.log('Fixed and parsed:', eventData);
                  processEventData(eventData);
                } catch (secondParseError) {
                  console.error('Even fixed data failed to parse:', secondParseError);
                }
              }
            }
          }
        };

        const processEventData = (eventData: any) => {
          // 处理 AI 消息内容
          if (eventData.event === 'agent_message' && eventData.answer) {
            fullAiContent += eventData.answer;
          }
          
          // 处理 Canvas 数据
          if (eventData.keyword && eventData.cards) {
            console.log('Found canvas cards for keyword:', eventData.keyword, eventData.cards.length);
            const transformedCards = eventData.cards.map((card: any) => ({
              project_id,
              external_id: card.id,
              type: 'canvas',
              title: card.title,
              content: card.content || '',
              keyword: eventData.keyword,
              author: card.author,
              author_avatar: card.author_avatar,
              like_count: card.like_count || 0,
              collect_count: card.collect_count || 0,
              comment_count: card.comment_count || 0,
              share_count: card.share_count || 0,
              cover_url: card.cover_url,
              url: card.url,
              platform: card.platform || 'xiaohongshu',
              ip_location: card.ip_location,
              tags: card.tags || [],
              create_time: card.create_time
            }));
            canvasData.push(...transformedCards);
          }
          
          // 处理 Insights 数据
          if (eventData.type === 'keyword_insight' && eventData.answerText) {
            console.log('Found keyword insight:', eventData.keyword, eventData.answerText.substring(0, 100));
            const transformedInsight = {
              project_id,
              external_id: eventData.id || `keyword_insight_${Date.now()}_${Math.random()}`,
              type: 'keyword_insight',
              title: eventData.keyword || 'Insight',
              content: eventData.answerText
            };
            insightsData.push(transformedInsight);
          }
          
          if (eventData.type === 'comprehensive_insights' && eventData.answerText) {
            console.log('Found comprehensive insights:', eventData.answerText.substring(0, 100));
            const transformedInsight = {
              project_id,
              external_id: eventData.id || `comprehensive_insights_${Date.now()}_${Math.random()}`,
              type: 'comprehensive_insights',
              title: 'Comprehensive Insights',
              content: eventData.answerText
            };
            insightsData.push(transformedInsight);
          }
        };

        const tryFixJsonData = (data: string): string | null => {
          // 尝试修复常见的JSON问题
          let fixed = data;
          
          // 修复未闭合的字符串
          const openQuotes = (fixed.match(/"/g) || []).length;
          if (openQuotes % 2 !== 0) {
            fixed += '"';
          }
          
          // 修复未闭合的对象
          const openBraces = (fixed.match(/{/g) || []).length;
          const closeBraces = (fixed.match(/}/g) || []).length;
          if (openBraces > closeBraces) {
            fixed += '}';
          }
          
          // 修复未闭合的数组
          const openBrackets = (fixed.match(/\[/g) || []).length;
          const closeBrackets = (fixed.match(/\]/g) || []).length;
          if (openBrackets > closeBrackets) {
            fixed += ']';
          }
          
          return fixed !== data ? fixed : null;
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('=== STREAM READING COMPLETED ===');
              
              // 处理剩余的缓冲区数据
              if (buffer.trim()) {
                console.log('=== PROCESSING REMAINING BUFFER ===');
                console.log('Remaining buffer:', buffer.substring(0, 200));
                
                const lines = buffer.split('\n');
                for (const line of lines) {
                  processLine(line);
                }
              }
              
              // 如果没有明确的结束标志，标记为完成
              if (!isStreamComplete) {
                console.log('=== MARKING STREAM AS COMPLETE ===');
                isStreamComplete = true;
              }
              
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 按行处理，保留最后一行（可能不完整）
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一行作为缓冲区

            // 处理完整的行
            for (const line of lines) {
              processLine(line);
            }
          }

          // 流结束后处理最终内容
          await processFinalContent(
            fullAiContent,
            project_id,
            supabase,
            userMessage,
            canvasData,
            insightsData,
            {
              allEvents,
              thoughts,
              toolCalls,
              fullResponse: {
                content: fullAiContent,
                metadata: {
                  total_events: allEvents.length,
                  canvas_items_count: canvasData.length,
                  insights_count: insightsData.length,
                  stream_complete: isStreamComplete
                }
              }
            }
          );

        } catch (error) {
          console.error('=== STREAM PROCESSING ERROR ===');
          console.error('Error details:', error);
          
          // 即使出错也要尝试保存已收集的数据
          if (canvasData.length > 0 || insightsData.length > 0 || fullAiContent.length > 0) {
            console.log('=== ATTEMPTING TO SAVE PARTIAL DATA ===');
            try {
              await processFinalContent(
                fullAiContent,
                project_id,
                supabase,
                userMessage,
                canvasData,
                insightsData,
                {
                  allEvents,
                  thoughts,
                  toolCalls,
                  fullResponse: {
                    content: fullAiContent,
                    metadata: {
                      total_events: allEvents.length,
                      canvas_items_count: canvasData.length,
                      insights_count: insightsData.length,
                      stream_complete: false,
                      error: error.message
                    }
                  }
                }
              );
            } catch (saveError) {
              console.error('Failed to save partial data:', saveError);
            }
          }
          
          throw error;
        } finally {
          console.log('=== FINAL STATISTICS ===');
          console.log('Total events processed:', allEvents.length);
          console.log('Canvas items collected:', canvasData.length);
          console.log('Insights collected:', insightsData.length);
          console.log('Content length:', fullAiContent.length);
          console.log('Stream completed normally:', isStreamComplete);
          
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chat-bluechat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function processFinalContent(
  fullAiContent: string,
  projectId: string,
  supabase: any,
  userMessage: any,
  canvasData: any[],
  insightsData: any[],
  debugInfo: any
) {
  let associatedCardId = null;

  console.log('=== PROCESSING FINAL CONTENT ===');
  console.log('Content length:', fullAiContent.length);
  console.log('Canvas items to save:', canvasData.length);
  console.log('Insights to save:', insightsData.length);
  console.log('Debug info metadata:', JSON.stringify(debugInfo.fullResponse.metadata, null, 2));

  // Save canvas items to database
  if (canvasData.length > 0) {
    try {
      console.log('=== SAVING CANVAS ITEMS ===');
      const { data: savedCanvasItems, error: canvasError } = await supabase
        .from('canvas_items')
        .insert(canvasData)
        .select();
      
      if (canvasError) {
        console.error('Error saving canvas items:', canvasError);
      } else {
        console.log('Canvas items saved successfully:', savedCanvasItems?.length);
      }
    } catch (error) {
      console.error('Failed to save canvas items:', error);
    }
  }

  // Save insights to database
  if (insightsData.length > 0) {
    try {
      console.log('=== SAVING INSIGHTS ===');
      const { data: savedInsights, error: insightsError } = await supabase
        .from('insights')
        .insert(insightsData)
        .select();
      
      if (insightsError) {
        console.error('Error saving insights:', insightsError);
      } else {
        console.log('Insights saved successfully:', savedInsights?.length);
      }
    } catch (error) {
      console.error('Failed to save insights:', error);
    }
  }

  // Parse XML tags and execute database operations (similar to chat-dify)
  const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([^]*?)<\/new_xhs_card>/g;
  const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)"([^]*?)<\/update_xhs_card>/g;
  
  let match;

  // Handle new card creation
  while ((match = newCardRegex.exec(fullAiContent)) !== null) {
    const title = match[1] || `AI生成卡片 ${new Date().toISOString().slice(0, 10)}`;
    const content = match[2].trim();
    
    console.log('=== CREATING NEW CARD ===');
    console.log('Title:', title);
    console.log('Content preview:', content.substring(0, 100));
    
    try {
      const { data: newCard, error: createError } = await supabase
        .from('cards')
        .insert({
          project_id: projectId,
          title,
          content,
          card_order: 999,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating card:', createError);
      } else {
        associatedCardId = newCard.id;
        console.log('Card created successfully:', newCard.id);
      }
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  }

  // Handle card updates
  while ((match = updateCardRegex.exec(fullAiContent)) !== null) {
    const cardRefId = match[1];
    const content = match[2].trim();
    
    console.log('=== UPDATING CARD ===');
    console.log('Card ref ID:', cardRefId);
    console.log('Content preview:', content.substring(0, 100));
    
    try {
      const { data: existingCard, error: findError } = await supabase
        .from('cards')
        .select('*')
        .eq('project_id', projectId)
        .eq('title', cardRefId)
        .single();

      if (findError || !existingCard) {
        console.error('Card not found for update:', cardRefId);
        continue;
      }

      const { error: updateError } = await supabase
        .from('cards')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCard.id);

      if (updateError) {
        console.error('Error updating card:', updateError);
      } else {
        associatedCardId = existingCard.id;
        console.log('Card updated successfully:', existingCard.id);
      }
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  }

  // Store AI response with complete debugging information
  const cleanedContent = fullAiContent
    .replace(/<new_xhs_card[^>]*>[\s\S]*?<\/new_xhs_card>/g, '[新卡片已创建]')
    .replace(/<update_xhs_card[^>]*>[\s\S]*?<\/update_xhs_card>/g, '[卡片已更新]');

  try {
    console.log('=== SAVING AI MESSAGE ===');
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        project_id: projectId,
        role: 'assistant',
        content: cleanedContent,
        llm_raw_output: {
          original_content: fullAiContent,
          debug_info: debugInfo,
          processing_summary: {
            total_events: debugInfo.allEvents.length,
            canvas_items_saved: canvasData.length,
            insights_saved: insightsData.length,
            cards_created: associatedCardId ? 1 : 0,
            stream_completed: debugInfo.fullResponse.metadata.stream_complete
          },
          complete_event_log: debugInfo.allEvents,
          thoughts_log: debugInfo.thoughts,
          tool_calls_log: debugInfo.toolCalls
        },
        associated_card_id: associatedCardId,
        created_at: new Date().toISOString()
      });

    if (aiMessageError) {
      console.error('Error storing AI message:', aiMessageError);
    } else {
      console.log('AI message stored successfully with complete debug info');
    }
  } catch (error) {
    console.error('Failed to store AI message:', error);
  }
}

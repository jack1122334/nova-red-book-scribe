
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
    const response = await fetch('http://loomi.live:8088/api/v1/bluechat', {
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

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        const decoder = new TextDecoder();
        let fullAiContent = '';
        let associatedCardId = null;
        let allEvents = []; // Store all events for debugging
        let canvasData = []; // Store canvas items
        let insightsData = []; // Store insights

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataContent = line.slice(6).trim();
                
                // Check for stream completion
                if (dataContent === '[DONE]') {
                  console.log('=== BLUECHAT RESPONSE COMPLETED ===');
                  console.log('Total content length:', fullAiContent.length);
                  console.log('Total canvas items:', canvasData.length);
                  console.log('Total insights:', insightsData.length);
                  
                  // Process final content and handle database operations
                  await processFinalContent(
                    fullAiContent, 
                    project_id, 
                    supabase, 
                    userMessage,
                    canvasData,
                    insightsData,
                    {
                      allEvents,
                      fullResponse: {
                        content: fullAiContent,
                        metadata: {
                          total_events: allEvents.length,
                          canvas_items_count: canvasData.length,
                          insights_count: insightsData.length
                        }
                      }
                    }
                  );
                  break;
                }
                
                if (dataContent === '') {
                  continue;
                }
                
                try {
                  const data = JSON.parse(dataContent);
                  
                  // Store all events for complete logging
                  allEvents.push({
                    timestamp: new Date().toISOString(),
                    event: data
                  });
                  
                  console.log('=== BLUECHAT EVENT ===');
                  console.log('Event type:', data.type || 'unknown');
                  console.log('Full event data:', JSON.stringify(data, null, 2));
                  
                  // Forward the event to frontend for streaming display
                  const eventData = `data: ${JSON.stringify(data)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(eventData));
                  
                  // Process different event types and collect detailed info
                  if (data.type === 'text' && data.text) {
                    fullAiContent += data.text;
                  } else if (data.type === 'canvas_data' && data.cards) {
                    console.log('Found canvas cards:', data.cards.length);
                    // Transform and store canvas data
                    const transformedCards = data.cards.map((card: any) => ({
                      project_id,
                      external_id: card.id,
                      type: 'canvas',
                      title: card.title,
                      content: card.content || '',
                      keyword: data.keyword || '',
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
                  } else if (data.type === 'insights' && data.insights) {
                    console.log('Found insights:', data.insights.length);
                    const transformedInsights = data.insights.map((insight: any) => ({
                      project_id,
                      external_id: insight.id || `insight_${Date.now()}_${Math.random()}`,
                      type: 'insight',
                      title: insight.title,
                      content: insight.text || insight.content || ''
                    }));
                    insightsData.push(...transformedInsights);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', line);
                  console.warn('Parse error:', parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          throw error;
        } finally {
          console.log('=== STREAM COMPLETED ===');
          console.log('Total events processed:', allEvents.length);
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
  console.log('Debug info:', JSON.stringify(debugInfo.metadata, null, 2));

  // Save canvas items to database
  if (canvasData.length > 0) {
    try {
      console.log('Saving canvas items to database:', canvasData.length);
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
      console.log('Saving insights to database:', insightsData.length);
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

  // Parse XML tags and execute database operations
  const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([^]*?)<\/new_xhs_card>/g;
  const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)"([^]*?)<\/update_xhs_card>/g;
  
  let match;

  // Handle new card creation
  while ((match = newCardRegex.exec(fullAiContent)) !== null) {
    const title = match[1] || `AI生成卡片 ${new Date().toISOString().slice(0, 10)}`;
    const content = match[2].trim();
    
    console.log('Creating new card:', { title, content: content.substring(0, 100) });
    
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
  }

  // Handle card updates
  while ((match = updateCardRegex.exec(fullAiContent)) !== null) {
    const cardRefId = match[1];
    const content = match[2].trim();
    
    console.log('Updating card:', { cardRefId, content: content.substring(0, 100) });
    
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
  }

  // Store AI response with complete debugging information
  const cleanedContent = fullAiContent
    .replace(/<new_xhs_card[^>]*>[\s\S]*?<\/new_xhs_card>/g, '[新卡片已创建]')
    .replace(/<update_xhs_card[^>]*>[\s\S]*?<\/update_xhs_card>/g, '[卡片已更新]');

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
          cards_created: associatedCardId ? 1 : 0,
          canvas_items_saved: canvasData.length,
          insights_saved: insightsData.length
        },
        complete_event_log: debugInfo.allEvents
      },
      associated_card_id: associatedCardId,
      created_at: new Date().toISOString()
    });

  if (aiMessageError) {
    console.error('Error storing AI message:', aiMessageError);
  } else {
    console.log('AI message stored successfully with complete debug info');
  }
}

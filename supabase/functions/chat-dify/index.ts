
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, core_instruction, references = [], system_messages = [] } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const difyApiKey = Deno.env.get('DIFY_API_KEY')!;
    const difyApiUrl = Deno.env.get('DIFY_API_URL') || 'https://api.dify.ai/v1';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'user',
        content: core_instruction,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
      throw userMessageError;
    }

    // Get or create conversation ID
    let conversationId = '';
    const { data: projectData } = await supabase
      .from('projects')
      .select('conversation_id')
      .eq('id', project_id)
      .single();
    
    if (projectData?.conversation_id) {
      conversationId = projectData.conversation_id;
    }

    // Build full query with system messages and references
    let fullQuery = core_instruction;

    if (system_messages.length > 0) {
      const systemContent = system_messages.join('\n\n');
      fullQuery = `${systemContent}\n\n用户当前请求：${core_instruction}`;
    }

    if (references.length > 0) {
      let referencesContent = "\n\n用户为本次创作提供了以下参考信息：\n\n";
      
      for (let i = 0; i < references.length; i++) {
        const ref = references[i];
        
        const { data: cardData, error: cardError } = await supabase
          .from('cards')
          .select('*')
          .eq('id', ref.card_id)
          .eq('project_id', project_id)
          .single();

        if (cardError) {
          console.error('Error loading referenced card:', cardError);
          continue;
        }

        referencesContent += `参考项${i + 1}：\n`;
        referencesContent += `  来源：卡片"${ref.card_friendly_title}"\n`;
        referencesContent += `  类型：${ref.type === 'full_card' ? '整个卡片' : '文本片段'}\n`;
        referencesContent += `  用户备注："${ref.user_remark}"\n`;
        
        if (ref.type === 'full_card') {
          referencesContent += `  内容：\n  ---\n  ${cardData.content}\n  ---\n\n`;
        } else if (ref.type === 'text_snippet' && ref.snippet_content) {
          referencesContent += `  片段内容：\n  ---\n  ${ref.snippet_content}\n  ---\n\n`;
        }
      }
      
      fullQuery += referencesContent;
    }

    console.log('=== DIFY REQUEST START ===');
    console.log('Sending to Dify:', { 
      query: fullQuery.substring(0, 500) + (fullQuery.length > 500 ? '...' : ''),
      conversationId,
      apiKey: difyApiKey ? 'present' : 'missing' 
    });

    // Call Dify API
    const difyResponse = await fetch(`${difyApiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: fullQuery,
        response_mode: 'streaming',
        conversation_id: conversationId,
        user: `project_${project_id}`,
        auto_generate_name: false
      }),
    });

    console.log('Dify API response status:', difyResponse.status);
    
    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('Dify API error details:', errorText);
      throw new Error(`Dify API error: ${difyResponse.status} - ${errorText}`);
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = difyResponse.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        const decoder = new TextDecoder();
        let fullAiContent = '';
        let newConversationId = conversationId;
        let associatedCardId = null;
        let allEvents = []; // Store all events for debugging
        let thoughts = [];
        let toolCalls = [];
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
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  // Store all events for complete logging
                  allEvents.push({
                    timestamp: new Date().toISOString(),
                    event: data
                  });
                  
                  console.log('=== DIFY EVENT ===');
                  console.log('Event type:', data.event);
                  console.log('Full event data:', JSON.stringify(data, null, 2));
                  
                  // Forward the event to frontend for streaming display
                  const eventData = `data: ${JSON.stringify(data)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(eventData));
                  
                  // Process different event types and collect detailed info
                  if (data.event === 'agent_thought') {
                    console.log('AGENT THOUGHT:', data.thought);
                    if (data.thought) {
                      thoughts.push({
                        timestamp: new Date().toISOString(),
                        thought: data.thought
                      });
                    }
                  } else if (data.event === 'tool_calls') {
                    console.log('TOOL CALLS:', JSON.stringify(data.tool_calls, null, 2));
                    if (data.tool_calls) {
                      toolCalls.push({
                        timestamp: new Date().toISOString(),
                        tools: data.tool_calls
                      });
                      
                      // Process canvas data if present
                      for (const tool of data.tool_calls) {
                        if (tool.tool_output) {
                          try {
                            const output = JSON.parse(tool.tool_output);
                            
                            // Check for canvas data
                            if (output.keywords) {
                              console.log('Found keywords in tool output:', output.keywords);
                            }
                            
                            if (output.keyword && output.cards) {
                              console.log('Found canvas cards for keyword:', output.keyword, output.cards);
                              // Transform and store canvas data
                              const transformedCards = output.cards.map((card: any) => ({
                                project_id,
                                external_id: card.id,
                                type: 'canvas',
                                title: card.title,
                                content: card.content || '',
                                keyword: output.keyword,
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
                            
                            // Check for insights data
                            if (output.insights) {
                              console.log('Found insights in tool output:', output.insights);
                              const transformedInsights = output.insights.map((insight: any) => ({
                                project_id,
                                external_id: insight.id || `insight_${Date.now()}_${Math.random()}`,
                                type: 'insight',
                                title: insight.title,
                                content: insight.text || insight.content || ''
                              }));
                              insightsData.push(...transformedInsights);
                            }

                            // Check for keyword_insight data (单个对象)
                            if (output.type === 'keyword_insight' && output.answerText) {
                              console.log('Found keyword insight in tool output:', output.keyword, output.answerText.substring(0, 100));
                              const transformedInsight = {
                                project_id,
                                external_id: output.id || `keyword_insight_${Date.now()}_${Math.random()}`,
                                type: 'keyword_insight',
                                title: output.keyword,
                                content: output.answerText
                              };
                              insightsData.push(transformedInsight);
                            }
                          } catch (parseError) {
                            console.warn('Failed to parse tool output as JSON:', parseError);
                          }
                        }
                      }
                    }
                  } else if (data.event === 'agent_message' || data.event === 'message') {
                    if (data.answer) {
                      fullAiContent += data.answer;
                    }
                    if (data.conversation_id && !newConversationId) {
                      newConversationId = data.conversation_id;
                    }
                  } else if (data.type === 'keyword_insight' && data.answerText) {
                    // Handle direct keyword_insight data in the stream
                    console.log('Found direct keyword insight in stream:', data.keyword, data.answerText.substring(0, 100));
                    const transformedInsight = {
                      project_id,
                      external_id: data.id || `keyword_insight_${Date.now()}_${Math.random()}`,
                      type: 'keyword_insight',
                      title: data.keyword,
                      content: data.answerText
                    };
                    insightsData.push(transformedInsight);
                  } else if (data.event === 'message_end') {
                    newConversationId = data.conversation_id;
                    console.log('=== DIFY RESPONSE COMPLETED ===');
                    console.log('Total content length:', fullAiContent.length);
                    console.log('Total thoughts:', thoughts.length);
                    console.log('Total tool calls:', toolCalls.length);
                    console.log('Total canvas items:', canvasData.length);
                    console.log('Total insights:', insightsData.length);
                    console.log('Conversation ID:', newConversationId);
                    
                    // Process final content and handle card operations
                    await processFinalContent(
                      fullAiContent, 
                      project_id, 
                      supabase, 
                      newConversationId, 
                      conversationId, 
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
                            conversation_id: newConversationId,
                            total_events: allEvents.length,
                            thoughts_count: thoughts.length,
                            tool_calls_count: toolCalls.length,
                            canvas_items_count: canvasData.length,
                            insights_count: insightsData.length
                          }
                        }
                      }
                    );
                    break;
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
    console.error('Error in chat-dify function:', error);
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
  newConversationId: string, 
  conversationId: string, 
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

  // Update conversation_id if new
  if (newConversationId && newConversationId !== conversationId) {
    await supabase
      .from('projects')
      .update({ conversation_id: newConversationId })
      .eq('id', projectId);
  }

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
          thoughts_count: debugInfo.thoughts.length,
          tool_calls_count: debugInfo.toolCalls.length,
          conversation_id: newConversationId,
          cards_created: associatedCardId ? 1 : 0,
          canvas_items_saved: canvasData.length,
          insights_saved: insightsData.length
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
}

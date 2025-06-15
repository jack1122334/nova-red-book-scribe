
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

    console.log('Sending to Dify:', { query: fullQuery.substring(0, 200), apiKey: difyApiKey ? 'present' : 'missing' });

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
                  console.log('Dify event:', JSON.stringify(data, null, 2));
                  
                  // Forward the event to frontend for streaming display
                  const eventData = `data: ${JSON.stringify(data)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(eventData));
                  
                  // Process different event types
                  if (data.event === 'agent_message' || data.event === 'message') {
                    fullAiContent += data.answer || '';
                    if (data.conversation_id && !newConversationId) {
                      newConversationId = data.conversation_id;
                    }
                  } else if (data.event === 'message_end') {
                    newConversationId = data.conversation_id;
                    console.log('Dify response completed:', { length: fullAiContent.length, conversationId: newConversationId });
                    
                    // Process final content and handle card operations
                    await processFinalContent(fullAiContent, project_id, supabase, newConversationId, conversationId, userMessage);
                    break;
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', line);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          throw error;
        } finally {
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

async function processFinalContent(fullAiContent: string, projectId: string, supabase: any, newConversationId: string, conversationId: string, userMessage: any) {
  let associatedCardId = null;

  // Update conversation_id if new
  if (newConversationId && newConversationId !== conversationId) {
    await supabase
      .from('projects')
      .update({ conversation_id: newConversationId })
      .eq('id', projectId);
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

  // Store AI response
  const { error: aiMessageError } = await supabase
    .from('chat_messages')
    .insert({
      project_id: projectId,
      role: 'assistant',
      content: fullAiContent.replace(/<new_xhs_card[^>]*>[\s\S]*?<\/new_xhs_card>/g, '[新卡片已创建]')
                            .replace(/<update_xhs_card[^>]*>[\s\S]*?<\/update_xhs_card>/g, '[卡片已更新]'),
      llm_raw_output: fullAiContent,
      associated_card_id: associatedCardId,
      created_at: new Date().toISOString()
    });

  if (aiMessageError) {
    console.error('Error storing AI message:', aiMessageError);
  }
}

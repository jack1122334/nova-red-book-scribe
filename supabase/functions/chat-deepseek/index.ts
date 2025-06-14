
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Reference {
  type: 'full_card' | 'text_snippet';
  card_id: string;
  card_friendly_title: string;
  user_remark: string;
  snippet_content?: string;
}

interface ChatRequest {
  project_id: string;
  core_instruction: string;
  references?: Reference[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Chat request received');
    
    // Parse request body
    const { project_id, core_instruction, references = [] }: ChatRequest = await req.json();
    console.log('Request data:', { project_id, core_instruction, references });

    if (!project_id || !core_instruction) {
      throw new Error('Missing required fields: project_id and core_instruction');
    }

    // Get API keys
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('User authenticated:', user.id);

    // Build messages array according to specification
    const messages: any[] = [];

    // 1. System Prompt (首条消息)
    messages.push({
      role: 'system',
      content: 'You are Nova, an AI assistant specialized in helping users create engaging Xiaohongshu (Little Red Book) posts. Your goal is to collaborate with the user to draft, refine, and finalize content. \n\nKey Interaction Protocols:\n1.  **Creating New Cards:** When you need to generate a new Xiaohongshu post, wrap the ENTIRE post content within <new_xhs_card title="[Optional: A concise title for the new card]">...</new_xhs_card> tags. The title attribute is optional but recommended.\n2.  **Updating Existing Cards:** When modifying an existing card, wrap the ENTIRE updated post content within <update_xhs_card card_ref_id="[The friendly title/reference ID of the card being updated]">...</update_xhs_card> tags. You will be provided with the card_ref_id in system messages describing user actions or references.\n3.  **Referring to Cards:** Users may provide references to existing cards (e.g., \'Card "Draft V1"\') or specific text snippets from them, along with instructions on how to use these references. Pay close attention to these references and instructions.\n4.  **General Chat:** For advice, questions, or discussions not directly resulting in a card creation/update, provide your response as plain text without special XML tags.\n5.  **Clarity:** If a user\'s request is unclear, ask for clarification.\n\nRemember to always provide the full content for a card inside the appropriate XML tag.'
    });

    // 2. Load historical chat messages
    const { data: chatHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error loading chat history:', historyError);
    } else if (chatHistory) {
      for (const msg of chatHistory) {
        if (msg.role === 'user') {
          messages.push({
            role: 'user',
            content: msg.content
          });
        } else if (msg.role === 'assistant') {
          // Use llm_raw_output if available, otherwise use content
          messages.push({
            role: 'assistant',
            content: msg.llm_raw_output || msg.content
          });
        } else if (msg.role === 'system') {
          messages.push({
            role: 'system',
            content: msg.content
          });
        }
      }
    }

    // 3. Process references and create system messages
    if (references && references.length > 0) {
      console.log('Processing references:', references);
      
      let referenceSystemMessage = '用户为本次创作提供了以下参考信息，请在理解核心指令时充分利用它们：\n\n';
      
      for (let i = 0; i < references.length; i++) {
        const ref = references[i];
        referenceSystemMessage += `参考项${i + 1}：\n`;
        referenceSystemMessage += `  来源：卡片"${ref.card_friendly_title}" (内部ID: ${ref.card_id})\n`;
        referenceSystemMessage += `  类型：${ref.type === 'full_card' ? '整个卡片' : '文本片段'}\n`;
        referenceSystemMessage += `  用户备注："${ref.user_remark}"\n`;
        
        if (ref.type === 'full_card') {
          // Get full card content
          const { data: cardData, error: cardError } = await supabase
            .from('cards')
            .select('content')
            .eq('id', ref.card_id)
            .eq('project_id', project_id)
            .single();
          
          if (cardError) {
            console.error('Error fetching referenced card:', cardError);
            referenceSystemMessage += `  内容：[无法获取卡片内容]\n`;
          } else {
            referenceSystemMessage += `  内容：\n  ---\n  ${cardData.content}\n  ---\n`;
          }
        } else if (ref.type === 'text_snippet') {
          referenceSystemMessage += `  片段内容：\n  ---\n  ${ref.snippet_content}\n  ---\n`;
        }
        
        referenceSystemMessage += '\n';
      }
      
      messages.push({
        role: 'system',
        content: referenceSystemMessage
      });
    }

    // 4. Current user core instruction
    messages.push({
      role: 'user',
      content: core_instruction
    });

    console.log('Constructed messages array:', messages.length, 'messages');

    // Call DeepSeek API
    console.log('Calling DeepSeek API...');
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${deepseekResponse.status} ${errorText}`);
    }

    const deepseekData = await deepseekResponse.json();
    console.log('DeepSeek API response received');

    if (!deepseekData.choices || !deepseekData.choices[0]) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const llmRawOutput = deepseekData.choices[0].message.content;
    console.log('LLM raw output:', llmRawOutput);

    // Parse XML tags and perform database operations
    let associatedCardId = null;
    
    // Parse <new_xhs_card> tags
    const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([^]*?)<\/new_xhs_card>/g;
    let newCardMatch;
    while ((newCardMatch = newCardRegex.exec(llmRawOutput)) !== null) {
      const title = newCardMatch[1] || `新卡片 ${Date.now()}`;
      const content = newCardMatch[2].trim();
      
      console.log('Creating new card:', { title, content: content.substring(0, 100) + '...' });
      
      const { data: newCard, error: createError } = await supabase
        .from('cards')
        .insert({
          project_id: project_id,
          title: title,
          content: content,
          card_order: 0, // You might want to calculate this properly
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating new card:', createError);
      } else {
        console.log('New card created with ID:', newCard.id);
        associatedCardId = newCard.id;
      }
    }

    // Parse <update_xhs_card> tags
    const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)"([^]*?)<\/update_xhs_card>/g;
    let updateCardMatch;
    while ((updateCardMatch = updateCardRegex.exec(llmRawOutput)) !== null) {
      const cardRefId = updateCardMatch[1];
      const content = updateCardMatch[2].trim();
      
      console.log('Updating card:', { cardRefId, content: content.substring(0, 100) + '...' });
      
      // Find card by title (card_ref_id)
      const { data: existingCard, error: findError } = await supabase
        .from('cards')
        .select('id')
        .eq('project_id', project_id)
        .eq('title', cardRefId)
        .single();
      
      if (findError) {
        console.error('Error finding card by title:', findError);
      } else {
        const { error: updateError } = await supabase
          .from('cards')
          .update({ content: content })
          .eq('id', existingCard.id);
        
        if (updateError) {
          console.error('Error updating card:', updateError);
        } else {
          console.log('Card updated successfully:', existingCard.id);
          associatedCardId = existingCard.id;
        }
      }
    }

    // Save user message to database
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'user',
        content: core_instruction,
        created_at: new Date().toISOString(),
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // Save assistant response to database
    const { error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'assistant',
        content: llmRawOutput.replace(/<[^>]*>/g, ''), // Strip XML tags for content field
        llm_raw_output: llmRawOutput,
        associated_card_id: associatedCardId,
        created_at: new Date().toISOString(),
      });

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    const aiResponse = {
      content: llmRawOutput, // Send raw output with XML tags to frontend
      role: 'assistant'
    };

    console.log('Chat response prepared');

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

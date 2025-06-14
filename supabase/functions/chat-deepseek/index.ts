
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
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 存储用户消息
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

    // 2. 获取历史消息
    const { data: historyMessages, error: historyError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error loading history:', historyError);
      throw historyError;
    }

    // 3. 构建消息数组
    const messages = [];
    
    // System prompt
    messages.push({
      role: "system",
      content: `You are Nova, an AI assistant specialized in helping users create engaging Xiaohongshu (Little Red Book) posts. Your goal is to collaborate with the user to draft, refine, and finalize content.

Key Interaction Protocols:
1. **Creating New Cards:** When you need to generate a new Xiaohongshu post, wrap the ENTIRE post content within <new_xhs_card title="[Optional: A concise title for the new card]">...</new_xhs_card> tags. The title attribute is optional but recommended.
2. **Updating Existing Cards:** When modifying an existing card, wrap the ENTIRE updated post content within <update_xhs_card card_ref_id="[The friendly title/reference ID of the card being updated]">...</update_xhs_card> tags. You will be provided with the card_ref_id in system messages describing user actions or references.
3. **Referring to Cards:** Users may provide references to existing cards (e.g., 'Card "Draft V1"') or specific text snippets from them, along with instructions on how to use these references. Pay close attention to these references and instructions.
4. **General Chat:** For advice, questions, or discussions not directly resulting in a card creation/update, provide your response as plain text without special XML tags.
5. **Clarity:** If a user's request is unclear, ask for clarification.

Remember to always provide the full content for a card inside the appropriate XML tag.`
    });

    // 历史消息 (除了刚才存储的用户消息)
    for (const msg of historyMessages) {
      if (msg.id !== userMessage.id) {
        if (msg.role === 'assistant' && msg.llm_raw_output) {
          messages.push({
            role: msg.role,
            content: msg.llm_raw_output
          });
        } else {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }

    // 4. 添加系统消息（用户编辑操作）
    for (const systemMsg of system_messages) {
      messages.push({
        role: "system",
        content: systemMsg
      });
    }

    // 5. 处理引用
    if (references.length > 0) {
      let referencesContent = "用户为本次创作提供了以下参考信息，请在理解核心指令时充分利用它们：\n\n";
      
      for (let i = 0; i < references.length; i++) {
        const ref = references[i];
        
        // 获取卡片内容
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
        referencesContent += `  来源：卡片"${ref.card_friendly_title}" (内部ID: ${ref.card_id})\n`;
        referencesContent += `  类型：${ref.type === 'full_card' ? '整个卡片' : '文本片段'}\n`;
        referencesContent += `  用户备注："${ref.user_remark}"\n`;
        
        if (ref.type === 'full_card') {
          referencesContent += `  内容：\n  ---\n  ${cardData.content}\n  ---\n\n`;
        } else if (ref.type === 'text_snippet' && ref.snippet_content) {
          referencesContent += `  片段内容：\n  ---\n  ${ref.snippet_content}\n  ---\n\n`;
        }
      }
      
      messages.push({
        role: "system",
        content: referencesContent
      });
    }

    // 6. 添加当前用户指令
    messages.push({
      role: "user",
      content: core_instruction
    });

    console.log('Sending to DeepSeek:', { messages: messages.length });

    // 7. 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const result = await response.json();
    const aiContent = result.choices[0].message.content;

    console.log('DeepSeek response received:', { length: aiContent.length });

    // 8. 解析 XML 标签并执行数据库操作
    const newCardRegex = /<new_xhs_card(?:\s+title="([^"]*)")?>([^]*?)<\/new_xhs_card>/g;
    const updateCardRegex = /<update_xhs_card\s+card_ref_id="([^"]*)"([^]*?)<\/update_xhs_card>/g;
    
    let associatedCardId = null;
    let match;

    // 处理新卡片创建
    while ((match = newCardRegex.exec(aiContent)) !== null) {
      const title = match[1] || `AI生成卡片 ${new Date().toISOString().slice(0, 10)}`;
      const content = match[2].trim();
      
      console.log('Creating new card:', { title, content: content.substring(0, 100) });
      
      const { data: newCard, error: createError } = await supabase
        .from('cards')
        .insert({
          project_id,
          title,
          content,
          card_order: 999, // 临时值，后续可以优化
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

    // 处理卡片更新
    while ((match = updateCardRegex.exec(aiContent)) !== null) {
      const cardRefId = match[1];
      const content = match[2].trim();
      
      console.log('Updating card:', { cardRefId, content: content.substring(0, 100) });
      
      // 通过友好标题查找卡片
      const { data: existingCard, error: findError } = await supabase
        .from('cards')
        .select('*')
        .eq('project_id', project_id)
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

    // 9. 存储 AI 响应
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'assistant',
        content: aiContent.replace(/<new_xhs_card[^>]*>[\s\S]*?<\/new_xhs_card>/g, '[新卡片已创建]')
                          .replace(/<update_xhs_card[^>]*>[\s\S]*?<\/update_xhs_card>/g, '[卡片已更新]'),
        llm_raw_output: aiContent,
        associated_card_id: associatedCardId,
        created_at: new Date().toISOString()
      });

    if (aiMessageError) {
      console.error('Error storing AI message:', aiMessageError);
    }

    return new Response(
      JSON.stringify({ content: aiContent }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in chat-deepseek function:', error);
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
